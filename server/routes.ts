import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { caesarCipher, getCipherModule, type Challenge } from "./cipher-logic";
import { seedDatabase } from "./seed";
import { checkAchievements, awardPoints } from "./achievement-checker";
import { getDailyChallengeInfo, generateDailyChallenge } from "./daily-challenge";

const pendingChallenges = new Map<string, Challenge>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await seedDatabase();

  app.get("/api/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.ensureProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/ciphers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allCiphers = await storage.getCiphers();
      const unlockedIds = await storage.getUserUnlockedCipherIds(userId);

      const result = allCiphers.map((c) => ({
        ...c,
        isUnlocked: unlockedIds.includes(c.id),
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching ciphers:", error);
      res.status(500).json({ message: "Failed to fetch ciphers" });
    }
  });

  app.post("/api/ciphers/:id/unlock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cipherId = parseInt(req.params.id);
      const { method } = req.body;

      const allCiphers = await storage.getCiphers();
      const cipher = allCiphers.find((c) => c.id === cipherId);
      if (!cipher) return res.status(404).json({ message: "Cipher not found" });
      if (!cipher.isReleased) return res.status(400).json({ message: "Cipher not yet released" });

      const unlockedIds = await storage.getUserUnlockedCipherIds(userId);
      if (unlockedIds.includes(cipherId)) {
        return res.status(400).json({ message: "Cipher already unlocked" });
      }

      const profile = await storage.getProfile(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      if (method === "coins") {
        if (profile.coins < cipher.baseUnlockCost) {
          return res.status(400).json({ message: "Not enough coins" });
        }
        await storage.updateProfile(userId, { coins: profile.coins - cipher.baseUnlockCost });
        await storage.unlockCipher(userId, cipherId, "coins");
        await checkAchievements(userId, { unlockVia: "coins" });
      } else if (method === "token") {
        if (profile.freeUnlockTokens < 1) {
          return res.status(400).json({ message: "No free tokens available" });
        }
        await storage.updateProfile(userId, { freeUnlockTokens: profile.freeUnlockTokens - 1 });
        await storage.unlockCipher(userId, cipherId, "token");
        await checkAchievements(userId, { unlockVia: "token" });
      } else {
        return res.status(400).json({ message: "Invalid unlock method" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error unlocking cipher:", error);
      res.status(500).json({ message: "Failed to unlock cipher" });
    }
  });

  app.post("/api/daily/claim", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.ensureProfile(userId);
      const today = new Date().toISOString().split("T")[0];

      if (profile.lastDailyClaimDate === today) {
        return res.json({ claimed: false, alreadyClaimed: true });
      }

      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      let newStreak = 1;
      if (profile.lastDailyClaimDate === yesterday) {
        newStreak = profile.streakCount + 1;
      }

      let streakBonus = 0;
      if (newStreak >= 28) streakBonus = 400;
      else if (newStreak >= 21) streakBonus = 300;
      else if (newStreak >= 14) streakBonus = 200;
      else if (newStreak >= 7) streakBonus = 100;

      const dailyCoins = 50;
      const totalBonus = dailyCoins + streakBonus;

      await storage.updateProfile(userId, {
        coins: profile.coins + totalBonus,
        lastDailyClaimDate: today,
        streakCount: newStreak,
      });

      await checkAchievements(userId);

      res.json({
        claimed: true,
        coinsAwarded: dailyCoins,
        streakBonus,
        streakCount: newStreak,
      });
    } catch (error) {
      console.error("Error claiming daily:", error);
      res.status(500).json({ message: "Failed to claim daily reward" });
    }
  });

  app.get("/api/story/completions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allCiphers = await storage.getCiphers();
      const completions: Record<number, boolean> = {};
      for (const cipher of allCiphers) {
        if (cipher.isReleased) {
          completions[cipher.id] = await storage.isAllStoryComplete(userId, cipher.id);
        }
      }
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });

  app.get("/api/story/:cipherId/chapters", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cipherId = parseInt(req.params.cipherId);

      const chapters = await storage.getChaptersForCipher(cipherId);
      const progress = await storage.getAllStoryProgressForCipher(userId, cipherId);
      const completedByChapter = new Map<number, number>();
      for (const p of progress) {
        if (p.completed) {
          completedByChapter.set(p.chapterNumber, (completedByChapter.get(p.chapterNumber) || 0) + 1);
        }
      }

      const chaptersWithStatus = chapters.map((ch) => {
        const completedSteps = completedByChapter.get(ch.chapterNumber) || 0;
        const isComplete = completedSteps >= ch.stepCount;
        return {
          ...ch,
          completedSteps,
          isComplete,
        };
      });

      res.json({ chapters: chaptersWithStatus });
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.get("/api/story/:cipherId/completion", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cipherId = parseInt(req.params.cipherId);
      const isComplete = await storage.isAllStoryComplete(userId, cipherId);
      res.json({ isComplete });
    } catch (error) {
      console.error("Error checking completion:", error);
      res.status(500).json({ message: "Failed to check completion" });
    }
  });

  app.get("/api/story/:cipherId/:chapter", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cipherId = parseInt(req.params.cipherId);
      const chapter = parseInt(req.params.chapter);

      const steps = await storage.getStorySteps(cipherId, chapter);
      const progress = await storage.getStoryProgress(userId, cipherId, chapter);

      const allCiphers = await storage.getCiphers();
      const cipher = allCiphers.find((c) => c.id === cipherId);

      const completedSteps = progress.filter((p) => p.completed).map((p) => p.stepNumber);
      const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
      const nextStep = sortedSteps.find((s) => !completedSteps.includes(s.stepNumber));

      res.json({
        cipherName: cipher?.name || "Unknown",
        steps,
        completedSteps,
        currentStep: nextStep ? nextStep.stepNumber : (steps.length > 0 ? steps.length : 1),
      });
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  app.get("/api/story/:cipherId/:chapter/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cipherId = parseInt(req.params.cipherId);
      const chapter = parseInt(req.params.chapter);

      const progress = await storage.getStoryProgress(userId, cipherId, chapter);
      const completedSteps = progress.filter((p) => p.completed).map((p) => p.stepNumber);

      const steps = await storage.getStorySteps(cipherId, chapter);
      const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
      const maxCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
      const nextStep = sortedSteps.find((s) => s.stepNumber > maxCompleted && !completedSteps.includes(s.stepNumber));
      const resumeStep = nextStep || sortedSteps.find((s) => !completedSteps.includes(s.stepNumber));

      res.json({
        completedSteps,
        currentStep: resumeStep ? resumeStep.stepNumber : (steps.length > 0 ? steps.length + 1 : 1),
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/story/:cipherId/:chapter/:step/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cipherId = parseInt(req.params.cipherId);
      const chapter = parseInt(req.params.chapter);
      const step = parseInt(req.params.step);
      const { answer } = req.body;

      const steps = await storage.getStorySteps(cipherId, chapter);
      const storyStep = steps.find((s) => s.stepNumber === step);
      if (!storyStep) return res.status(404).json({ message: "Step not found" });

      const expectedAnswer =
        storyStep.taskType === "encrypt"
          ? storyStep.taskCiphertext
          : storyStep.taskPlaintext;

      const allCiphers = await storage.getCiphers();
      const cipher = allCiphers.find((c) => c.id === cipherId);
      const cipherModule = getCipherModule(cipher?.name || "caesar");
      const isCorrect = cipherModule.checkAnswer(expectedAnswer, answer);

      if (isCorrect) {
        const profile = await storage.getProfile(userId);
        if (step === 1 && !profile?.storyStartTime) {
          await storage.updateProfile(userId, { storyStartTime: new Date() });
        }

        await storage.markStoryStepComplete(userId, cipherId, chapter, step);
        await awardPoints(userId, 10);
        await checkAchievements(userId);
      }

      res.json({ correct: isCorrect });
    } catch (error) {
      console.error("Error submitting story:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.post("/api/game/endless/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { cipherId } = req.body;
      const parsedCipherId = parseInt(cipherId) || 1;

      await storage.ensureProfile(userId);
      const unlockedIds = await storage.getUserUnlockedCipherIds(userId);
      if (!unlockedIds.includes(parsedCipherId)) {
        return res.status(403).json({ message: "Cipher not unlocked" });
      }

      const allCiphers = await storage.getCiphers();
      const cipher = allCiphers.find((c) => c.id === parsedCipherId);
      if (!cipher) return res.status(404).json({ message: "Cipher not found" });

      const module = getCipherModule(cipher.name);
      const challenge = module.generateChallenge();

      pendingChallenges.set(userId, challenge);

      res.json({
        type: challenge.type,
        text: challenge.type === "encrypt" ? challenge.plaintext : challenge.ciphertext,
        shift: challenge.shift,
        keyword: challenge.keyword || null,
        hasPunctuation: challenge.hasPunctuation,
        cipherType: challenge.cipherType || "caesar",
      });
    } catch (error) {
      console.error("Error generating challenge:", error);
      res.status(500).json({ message: "Failed to generate challenge" });
    }
  });

  app.post("/api/game/endless/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { cipherId, answer } = req.body;
      const parsedCipherId = parseInt(cipherId) || 1;

      const challenge = pendingChallenges.get(userId);
      if (!challenge) {
        return res.status(400).json({ message: "No active challenge. Generate one first." });
      }

      const allCiphers = await storage.getCiphers();
      const cipher = allCiphers.find((c) => c.id === parsedCipherId);
      const module = getCipherModule(cipher?.name || "caesar");

      const expectedAnswer =
        challenge.type === "encrypt" ? challenge.ciphertext : challenge.plaintext;

      const isCorrect = module.checkAnswer(expectedAnswer, answer);
      const profile = await storage.ensureProfile(userId);

      pendingChallenges.delete(userId);

      let session = await storage.getActiveEndlessSession(userId);
      if (!session || session.cipherId !== parsedCipherId) {
        session = await storage.createEndlessSession(userId, parsedCipherId);
      }

      const newTotal = session.totalQuestions + 1;
      const newCorrect = session.correctAnswers + (isCorrect ? 1 : 0);
      const newStreak = isCorrect ? session.currentStreak + 1 : 0;
      const newBest = Math.max(session.bestStreak, newStreak);

      await storage.updateEndlessSession(session.id, {
        totalQuestions: newTotal,
        correctAnswers: newCorrect,
        currentStreak: newStreak,
        bestStreak: newBest,
      });

      const newTotalCorrect = profile.totalCorrect + (isCorrect ? 1 : 0);
      const newTotalIncorrect = profile.totalIncorrect + (isCorrect ? 0 : 1);
      const newHighStreak = Math.max(profile.endlessHighStreak, newStreak);

      await storage.updateProfile(userId, {
        totalCorrect: newTotalCorrect,
        totalIncorrect: newTotalIncorrect,
        endlessHighStreak: newHighStreak,
      });

      if (isCorrect) {
        await awardPoints(userId, 10);
      }

      const now = new Date();
      const isLateNight = now.getHours() >= 0 && now.getHours() < 6;

      await checkAchievements(userId, {
        endlessCorrect: newCorrect,
        endlessTotal: newTotal,
        endlessStreak: newStreak,
        cipherId: parsedCipherId,
        hasPunctuation: challenge.hasPunctuation,
        shift: challenge.shift,
        challengeType: challenge.type,
        isCorrect,
        isLateNight,
      });

      res.json({
        correct: isCorrect,
        expectedAnswer,
        sessionCorrect: newCorrect,
        sessionIncorrect: newTotal - newCorrect,
        sessionTotal: newTotal,
        currentStreak: newStreak,
        bestStreak: newBest,
        pointsAwarded: isCorrect ? 10 : 0,
      });
    } catch (error) {
      console.error("Error submitting endless:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.ensureProfile(userId);

      const unlockedCosmeticIds = await storage.getUserCosmeticIds(userId);
      const allCosmetics = await storage.getCosmetics();

      const unlockedTitles: number[] = [];
      const unlockedAvatars: number[] = [];
      const unlockedFrames: number[] = [];

      for (const cosmetic of allCosmetics) {
        if (unlockedCosmeticIds.includes(cosmetic.id) || cosmetic.unlockCondition === "default") {
          if (cosmetic.type === "title") {
            unlockedTitles.push(cosmetic.id);
          } else if (cosmetic.type === "avatar") {
            unlockedAvatars.push(parseInt(cosmetic.svgData) || cosmetic.id);
          } else if (cosmetic.type === "frame") {
            unlockedFrames.push(parseInt(cosmetic.svgData) || cosmetic.id);
          }
        }
      }

      res.json({
        ...profile,
        unlockedTitles,
        unlockedAvatars,
        unlockedFrames,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile/select-title", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { titleId } = req.body;
      await storage.updateProfile(userId, { chosenTitleId: titleId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update title" });
    }
  });

  app.post("/api/profile/select-avatar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { avatarId } = req.body;
      await storage.updateProfile(userId, { chosenAvatarId: avatarId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  app.post("/api/profile/select-frame", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { frameId } = req.body;
      await storage.updateProfile(userId, { chosenFrameId: frameId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update frame" });
    }
  });

  app.get("/api/daily-challenge", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split("T")[0];
      const info = getDailyChallengeInfo(today);
      const completion = await storage.getDailyChallengeCompletion(userId, today);
      res.json({ ...info, completed: !!completion });
    } catch (error) {
      console.error("Error fetching daily challenge info:", error);
      res.status(500).json({ message: "Failed to fetch daily challenge" });
    }
  });

  interface DailySession {
    data: ReturnType<typeof generateDailyChallenge>;
    answeredIds: Set<number>;
  }
  const pendingDailyChallenges = new Map<string, DailySession>();

  app.post("/api/daily-challenge/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split("T")[0];

      const completion = await storage.getDailyChallengeCompletion(userId, today);
      if (completion) {
        return res.status(400).json({ message: "Daily challenge already completed today" });
      }

      const challenge = generateDailyChallenge(today);
      const existingSession = pendingDailyChallenges.get(userId);
      if (!existingSession) {
        pendingDailyChallenges.set(userId, { data: challenge, answeredIds: new Set() });
      }

      const sessionData = pendingDailyChallenges.get(userId)!.data;
      const clientChallenges = sessionData.challenges.map((c) => ({
        id: c.id,
        instruction: c.instruction,
        displayText: c.displayText,
        shift: c.shift,
        hint: c.hint,
        partialReveal: c.partialReveal,
      }));

      res.json({
        type: sessionData.type,
        typeName: sessionData.typeName,
        typeDescription: sessionData.typeDescription,
        difficulty: sessionData.difficulty,
        pointsReward: sessionData.pointsReward,
        coinsReward: sessionData.coinsReward,
        challenges: clientChallenges,
        totalCount: clientChallenges.length,
      });
    } catch (error) {
      console.error("Error starting daily challenge:", error);
      res.status(500).json({ message: "Failed to start daily challenge" });
    }
  });

  app.post("/api/daily-challenge/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeId, answer } = req.body;

      if (typeof challengeId !== "number" || typeof answer !== "string") {
        return res.status(400).json({ message: "Invalid request body" });
      }

      const session = pendingDailyChallenges.get(userId);
      if (!session) {
        return res.status(400).json({ message: "No active daily challenge. Start one first." });
      }

      const item = session.data.challenges.find((c) => c.id === challengeId);
      if (!item) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }

      const normalize = (s: string) => s.toUpperCase().trim().replace(/\s+/g, " ");
      const isCorrect = normalize(answer) === normalize(item.expectedAnswer);

      session.answeredIds.add(challengeId);

      res.json({
        correct: isCorrect,
        expectedAnswer: item.expectedAnswer,
      });
    } catch (error) {
      console.error("Error submitting daily challenge answer:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.post("/api/daily-challenge/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split("T")[0];

      const existing = await storage.getDailyChallengeCompletion(userId, today);
      if (existing) {
        return res.status(400).json({ message: "Already completed today" });
      }

      let session = pendingDailyChallenges.get(userId);
      if (!session) {
        const challenge = generateDailyChallenge(today);
        session = { data: challenge, answeredIds: new Set() };
      }

      const points = session.data.pointsReward;
      const coins = session.data.coinsReward;

      await storage.completeDailyChallenge(userId, today, session.data.type, session.data.difficulty, points, coins);

      const profile = await storage.ensureProfile(userId);
      await storage.updateProfile(userId, {
        coins: profile.coins + coins,
      });
      await awardPoints(userId, points);
      await checkAchievements(userId);

      pendingDailyChallenges.delete(userId);

      res.json({
        success: true,
        pointsAwarded: points,
        coinsAwarded: coins,
      });
    } catch (error) {
      console.error("Error completing daily challenge:", error);
      res.status(500).json({ message: "Failed to complete daily challenge" });
    }
  });

  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allAchievements = await storage.getAchievements();
      const userAchievements = await storage.getUserAchievements(userId);

      const result = allAchievements.map((a) => {
        const ua = userAchievements.find((ua) => ua.achievementId === a.id);
        return {
          ...a,
          unlockedAt: ua?.unlockedAt || null,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  return httpServer;
}
