import {
  users,
  userProfiles,
  ciphers,
  userCipherUnlocks,
  storyContent,
  storyProgress,
  achievements,
  userAchievements,
  cosmetics,
  userCosmeticUnlocks,
  endlessSessions,
  dailyChallengeCompletions,
  type UserProfile,
  type Cipher,
  type StoryContent,
  type StoryProgress,
  type Achievement,
  type UserAchievement,
  type EndlessSession,
  type Cosmetic,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getProfile(userId: string): Promise<UserProfile | undefined>;
  ensureProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;

  getCiphers(): Promise<Cipher[]>;
  getUserUnlockedCipherIds(userId: string): Promise<number[]>;
  unlockCipher(userId: string, cipherId: number, via: string): Promise<void>;

  getStorySteps(cipherId: number, chapter: number): Promise<StoryContent[]>;
  getStoryProgress(userId: string, cipherId: number, chapter: number): Promise<StoryProgress[]>;
  markStoryStepComplete(userId: string, cipherId: number, chapter: number, step: number): Promise<void>;
  isChapterComplete(userId: string, cipherId: number, chapter: number): Promise<boolean>;
  getChaptersForCipher(cipherId: number): Promise<{ chapterNumber: number; chapterTitle: string | null; stepCount: number }[]>;
  getAllStoryProgressForCipher(userId: string, cipherId: number): Promise<StoryProgress[]>;
  isAllStoryComplete(userId: string, cipherId: number): Promise<boolean>;

  getAchievements(): Promise<Achievement[]>;
  getUserAchievementIds(userId: string): Promise<number[]>;
  grantAchievement(userId: string, achievementId: number): Promise<void>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;

  getCosmetics(): Promise<Cosmetic[]>;
  getUserCosmeticIds(userId: string): Promise<number[]>;
  grantCosmetic(userId: string, cosmeticId: number): Promise<void>;

  createEndlessSession(userId: string, cipherId: number): Promise<EndlessSession>;
  getActiveEndlessSession(userId: string): Promise<EndlessSession | undefined>;
  updateEndlessSession(id: number, data: Partial<EndlessSession>): Promise<EndlessSession>;

  getDailyChallengeCompletion(userId: string, date: string): Promise<any | undefined>;
  completeDailyChallenge(userId: string, date: string, type: string, difficulty: string, points: number, coins: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async ensureProfile(userId: string): Promise<UserProfile> {
    let profile = await this.getProfile(userId);
    if (!profile) {
      const [newProfile] = await db.insert(userProfiles).values({ userId }).returning();
      profile = newProfile;
      await this.unlockCipher(userId, 1, "default");
    }
    return profile;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const [updated] = await db
      .update(userProfiles)
      .set(data)
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async getCiphers(): Promise<Cipher[]> {
    return db.select().from(ciphers);
  }

  async getUserUnlockedCipherIds(userId: string): Promise<number[]> {
    const rows = await db
      .select({ cipherId: userCipherUnlocks.cipherId })
      .from(userCipherUnlocks)
      .where(eq(userCipherUnlocks.userId, userId));
    return rows.map((r) => r.cipherId);
  }

  async unlockCipher(userId: string, cipherId: number, via: string): Promise<void> {
    const existing = await db
      .select()
      .from(userCipherUnlocks)
      .where(and(eq(userCipherUnlocks.userId, userId), eq(userCipherUnlocks.cipherId, cipherId)));
    if (existing.length === 0) {
      await db.insert(userCipherUnlocks).values({ userId, cipherId, unlockedVia: via });
    }
  }

  async getStorySteps(cipherId: number, chapter: number): Promise<StoryContent[]> {
    return db
      .select()
      .from(storyContent)
      .where(and(eq(storyContent.cipherId, cipherId), eq(storyContent.chapterNumber, chapter)));
  }

  async getStoryProgress(userId: string, cipherId: number, chapter: number): Promise<StoryProgress[]> {
    return db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, userId),
          eq(storyProgress.cipherId, cipherId),
          eq(storyProgress.chapterNumber, chapter)
        )
      );
  }

  async markStoryStepComplete(userId: string, cipherId: number, chapter: number, step: number): Promise<void> {
    const existing = await db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, userId),
          eq(storyProgress.cipherId, cipherId),
          eq(storyProgress.chapterNumber, chapter),
          eq(storyProgress.stepNumber, step)
        )
      );
    if (existing.length === 0) {
      await db.insert(storyProgress).values({
        userId,
        cipherId,
        chapterNumber: chapter,
        stepNumber: step,
        completed: true,
        completedAt: new Date(),
      });
    } else if (!existing[0].completed) {
      await db
        .update(storyProgress)
        .set({ completed: true, completedAt: new Date() })
        .where(eq(storyProgress.id, existing[0].id));
    }
  }

  async isChapterComplete(userId: string, cipherId: number, chapter: number): Promise<boolean> {
    const steps = await this.getStorySteps(cipherId, chapter);
    const progress = await this.getStoryProgress(userId, cipherId, chapter);
    const completedSteps = progress.filter((p) => p.completed).map((p) => p.stepNumber);
    return steps.length > 0 && steps.every((s) => completedSteps.includes(s.stepNumber));
  }

  async getChaptersForCipher(cipherId: number): Promise<{ chapterNumber: number; chapterTitle: string | null; stepCount: number }[]> {
    const allSteps = await db
      .select()
      .from(storyContent)
      .where(eq(storyContent.cipherId, cipherId));
    const chapterMap = new Map<number, { chapterTitle: string | null; stepCount: number }>();
    for (const step of allSteps) {
      if (!chapterMap.has(step.chapterNumber)) {
        chapterMap.set(step.chapterNumber, { chapterTitle: step.chapterTitle, stepCount: 0 });
      }
      chapterMap.get(step.chapterNumber)!.stepCount++;
    }
    return Array.from(chapterMap.entries())
      .map(([chapterNumber, data]) => ({ chapterNumber, ...data }))
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  async getAllStoryProgressForCipher(userId: string, cipherId: number): Promise<StoryProgress[]> {
    return db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, userId),
          eq(storyProgress.cipherId, cipherId)
        )
      );
  }

  async isAllStoryComplete(userId: string, cipherId: number): Promise<boolean> {
    const chapters = await this.getChaptersForCipher(cipherId);
    if (chapters.length === 0) return false;
    for (const ch of chapters) {
      const complete = await this.isChapterComplete(userId, cipherId, ch.chapterNumber);
      if (!complete) return false;
    }
    return true;
  }

  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getUserAchievementIds(userId: string): Promise<number[]> {
    const rows = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    return rows.map((r) => r.achievementId);
  }

  async grantAchievement(userId: string, achievementId: number): Promise<void> {
    const existing = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));
    if (existing.length === 0) {
      await db.insert(userAchievements).values({ userId, achievementId });
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async getCosmetics(): Promise<Cosmetic[]> {
    return db.select().from(cosmetics);
  }

  async getUserCosmeticIds(userId: string): Promise<number[]> {
    const rows = await db
      .select({ cosmeticId: userCosmeticUnlocks.cosmeticId })
      .from(userCosmeticUnlocks)
      .where(eq(userCosmeticUnlocks.userId, userId));
    return rows.map((r) => r.cosmeticId);
  }

  async grantCosmetic(userId: string, cosmeticId: number): Promise<void> {
    const existing = await db
      .select()
      .from(userCosmeticUnlocks)
      .where(and(eq(userCosmeticUnlocks.userId, userId), eq(userCosmeticUnlocks.cosmeticId, cosmeticId)));
    if (existing.length === 0) {
      await db.insert(userCosmeticUnlocks).values({ userId, cosmeticId });
    }
  }

  async createEndlessSession(userId: string, cipherId: number): Promise<EndlessSession> {
    await db
      .update(endlessSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(and(eq(endlessSessions.userId, userId), eq(endlessSessions.isActive, true)));

    const [session] = await db
      .insert(endlessSessions)
      .values({ userId, cipherId })
      .returning();
    return session;
  }

  async getActiveEndlessSession(userId: string): Promise<EndlessSession | undefined> {
    const [session] = await db
      .select()
      .from(endlessSessions)
      .where(and(eq(endlessSessions.userId, userId), eq(endlessSessions.isActive, true)))
      .orderBy(desc(endlessSessions.startedAt));
    return session;
  }

  async updateEndlessSession(id: number, data: Partial<EndlessSession>): Promise<EndlessSession> {
    const [updated] = await db
      .update(endlessSessions)
      .set(data)
      .where(eq(endlessSessions.id, id))
      .returning();
    return updated;
  }
  async getDailyChallengeCompletion(userId: string, date: string): Promise<any | undefined> {
    const [row] = await db
      .select()
      .from(dailyChallengeCompletions)
      .where(
        and(
          eq(dailyChallengeCompletions.userId, userId),
          eq(dailyChallengeCompletions.challengeDate, date)
        )
      );
    return row;
  }

  async completeDailyChallenge(userId: string, date: string, type: string, difficulty: string, points: number, coins: number): Promise<void> {
    await db.insert(dailyChallengeCompletions).values({
      userId,
      challengeDate: date,
      challengeType: type,
      difficulty,
      pointsAwarded: points,
      coinsAwarded: coins,
    });
  }
}

export const storage = new DatabaseStorage();
