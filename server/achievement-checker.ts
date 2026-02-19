import { storage } from "./storage";

const POINTS_PER_CORRECT = 10;
const COINS_PER_50_POINTS = 15;

export async function awardPoints(userId: string, points: number) {
  const profile = await storage.getProfile(userId);
  if (!profile) return;

  const oldPoints = profile.points;
  const newPoints = oldPoints + points;
  const oldCoinThreshold = Math.floor(oldPoints / 50);
  const newCoinThreshold = Math.floor(newPoints / 50);
  const bonusCoins = (newCoinThreshold - oldCoinThreshold) * COINS_PER_50_POINTS;

  await storage.updateProfile(userId, {
    points: newPoints,
    coins: profile.coins + bonusCoins,
  });
}

export async function checkAchievements(userId: string, context?: {
  endlessCorrect?: number;
  endlessTotal?: number;
  endlessStreak?: number;
  cipherId?: number;
  hasPunctuation?: boolean;
  shift?: number;
  challengeType?: string;
  isCorrect?: boolean;
  isLateNight?: boolean;
  unlockVia?: string;
}) {
  const profile = await storage.getProfile(userId);
  if (!profile) return;

  const allAchievements = await storage.getAchievements();
  const unlockedIds = await storage.getUserAchievementIds(userId);

  for (const achievement of allAchievements) {
    if (unlockedIds.includes(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.conditionKey) {
      case "caesar_story_step_1": {
        const progress = await storage.getStoryProgress(userId, 1, 1);
        shouldUnlock = progress.some((p) => p.stepNumber === 1 && p.completed);
        break;
      }
      case "caesar_ch1_complete": {
        shouldUnlock = await storage.isChapterComplete(userId, 1, 1);
        break;
      }
      case "coins_total": {
        shouldUnlock = profile.coins >= achievement.conditionValue;
        break;
      }
      case "streak_count": {
        shouldUnlock = profile.streakCount >= achievement.conditionValue;
        break;
      }
      case "endless_correct_total": {
        shouldUnlock = profile.totalCorrect >= achievement.conditionValue;
        break;
      }
      case "endless_total_submissions": {
        shouldUnlock = (profile.totalCorrect + profile.totalIncorrect) >= achievement.conditionValue;
        break;
      }
      case "points_total": {
        shouldUnlock = profile.points >= achievement.conditionValue;
        break;
      }
      case "endless_streak_caesar": {
        if (context?.cipherId === 1 && context?.endlessStreak) {
          shouldUnlock = context.endlessStreak >= achievement.conditionValue;
        }
        if (profile.endlessHighStreak >= achievement.conditionValue) {
          shouldUnlock = true;
        }
        break;
      }
      case "punctuation_solve": {
        if (context?.hasPunctuation && context?.isCorrect) {
          shouldUnlock = true;
        }
        break;
      }
      case "unlock_via_coins": {
        if (context?.unlockVia === "coins") {
          shouldUnlock = true;
        }
        break;
      }
      case "unlock_via_token": {
        if (context?.unlockVia === "token") {
          shouldUnlock = true;
        }
        break;
      }
      case "endless_streak_any": {
        if (context?.endlessStreak) {
          shouldUnlock = context.endlessStreak >= achievement.conditionValue;
        }
        if (profile.endlessHighStreak >= achievement.conditionValue) {
          shouldUnlock = true;
        }
        break;
      }
      case "endless_perfect_20": {
        if (context?.endlessTotal && context.endlessTotal >= 20 && context.endlessCorrect === context.endlessTotal) {
          shouldUnlock = true;
        }
        break;
      }
      case "late_night_correct": {
        if (context?.isLateNight && context?.isCorrect) {
          shouldUnlock = true;
        }
        break;
      }
      case "story_speedrun": {
        if (profile.storyStartTime) {
          const elapsed = Date.now() - profile.storyStartTime.getTime();
          const isComplete = await storage.isChapterComplete(userId, 1, 1);
          if (isComplete && elapsed < 5 * 60 * 1000) {
            shouldUnlock = true;
          }
        }
        break;
      }
      case "shift_19_decrypt": {
        if (context?.shift === 19 && context?.challengeType === "decrypt" && context?.isCorrect) {
          shouldUnlock = true;
        }
        break;
      }
    }

    if (shouldUnlock) {
      await storage.grantAchievement(userId, achievement.id);

      const allCosmetics = await storage.getCosmetics();
      for (const cosmetic of allCosmetics) {
        if (cosmetic.unlockCondition === `achievement_${achievement.id}`) {
          await storage.grantCosmetic(userId, cosmetic.id);
        }
      }
    }
  }

  await checkCosmeticUnlocks(userId, profile);
}

async function checkCosmeticUnlocks(userId: string, profile: any) {
  const allCosmetics = await storage.getCosmetics();
  const unlockedCosmeticIds = await storage.getUserCosmeticIds(userId);

  for (const cosmetic of allCosmetics) {
    if (unlockedCosmeticIds.includes(cosmetic.id)) continue;

    let shouldUnlock = false;

    switch (cosmetic.unlockCondition) {
      case "default":
        shouldUnlock = true;
        break;
      case "finish_caesar_ch1":
        shouldUnlock = await storage.isChapterComplete(userId, 1, 1);
        break;
      case "200_points":
        shouldUnlock = profile.points >= 200;
        break;
      case "7_day_streak":
        shouldUnlock = profile.streakCount >= 7;
        break;
      case "1000_points":
        shouldUnlock = profile.points >= 1000;
        break;
    }

    if (shouldUnlock) {
      await storage.grantCosmetic(userId, cosmetic.id);
    }
  }
}
