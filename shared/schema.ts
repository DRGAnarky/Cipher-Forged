import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  coins: integer("coins").notNull().default(100),
  points: integer("points").notNull().default(0),
  freeUnlockTokens: integer("free_unlock_tokens").notNull().default(1),
  totalCorrect: integer("total_correct").notNull().default(0),
  totalIncorrect: integer("total_incorrect").notNull().default(0),
  lastDailyClaimDate: varchar("last_daily_claim_date"),
  streakCount: integer("streak_count").notNull().default(0),
  chosenTitleId: integer("chosen_title_id").default(1),
  chosenAvatarId: integer("chosen_avatar_id").default(1),
  chosenFrameId: integer("chosen_frame_id").default(1),
  endlessHighStreak: integer("endless_high_streak").notNull().default(0),
  storyStartTime: timestamp("story_start_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ciphers = pgTable("ciphers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isReleased: boolean("is_released").notNull().default(false),
  baseUnlockCost: integer("base_unlock_cost").notNull().default(150),
});

export const userCipherUnlocks = pgTable("user_cipher_unlocks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  cipherId: integer("cipher_id").notNull().references(() => ciphers.id),
  unlockedVia: varchar("unlocked_via", { length: 50 }).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const storyContent = pgTable("story_content", {
  id: serial("id").primaryKey(),
  cipherId: integer("cipher_id").notNull().references(() => ciphers.id),
  chapterNumber: integer("chapter_number").notNull(),
  chapterTitle: varchar("chapter_title", { length: 200 }),
  stepNumber: integer("step_number").notNull(),
  storyText: text("story_text").notNull(),
  taskType: varchar("task_type", { length: 20 }).notNull(),
  taskPlaintext: text("task_plaintext").notNull(),
  taskShift: integer("task_shift").notNull().default(3),
  taskCiphertext: text("task_ciphertext").notNull(),
  taskKeyword: varchar("task_keyword", { length: 50 }),
  speaker: varchar("speaker", { length: 100 }),
  speakerAvatar: varchar("speaker_avatar", { length: 50 }),
  dialogueLines: jsonb("dialogue_lines").$type<{ speaker: string; text: string; isUser?: boolean }[]>(),
  responseChoices: jsonb("response_choices").$type<{ id: string; text: string; reaction: string }[]>(),
  stepType: varchar("step_type", { length: 20 }).default("dialogue_task"),
});

export const storyProgress = pgTable("story_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  cipherId: integer("cipher_id").notNull().references(() => ciphers.id),
  chapterNumber: integer("chapter_number").notNull(),
  stepNumber: integer("step_number").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  hint: text("hint").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  conditionKey: varchar("condition_key", { length: 100 }).notNull(),
  conditionValue: integer("condition_value").notNull().default(1),
  sigilId: varchar("sigil_id", { length: 50 }).notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const cosmetics = pgTable("cosmetics", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  svgData: text("svg_data").notNull(),
  unlockCondition: varchar("unlock_condition", { length: 200 }),
  unlockValue: integer("unlock_value"),
});

export const userCosmeticUnlocks = pgTable("user_cosmetic_unlocks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  cosmeticId: integer("cosmetic_id").notNull().references(() => cosmetics.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const endlessSessions = pgTable("endless_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  cipherId: integer("cipher_id").notNull().references(() => ciphers.id),
  totalQuestions: integer("total_questions").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const dailyChallengeCompletions = pgTable("daily_challenge_completions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeDate: varchar("challenge_date", { length: 10 }).notNull(),
  challengeType: varchar("challenge_type", { length: 30 }).notNull(),
  difficulty: varchar("difficulty", { length: 10 }).notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  coinsAwarded: integer("coins_awarded").notNull().default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ createdAt: true });
export const insertCipherSchema = createInsertSchema(ciphers).omit({ id: true });
export const insertStoryContentSchema = createInsertSchema(storyContent).omit({ id: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true });
export const insertCosmeticSchema = createInsertSchema(cosmetics).omit({ id: true });

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Cipher = typeof ciphers.$inferSelect;
export type UserCipherUnlock = typeof userCipherUnlocks.$inferSelect;
export type StoryContent = typeof storyContent.$inferSelect;
export type StoryProgress = typeof storyProgress.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Cosmetic = typeof cosmetics.$inferSelect;
export type UserCosmeticUnlock = typeof userCosmeticUnlocks.$inferSelect;
export type EndlessSession = typeof endlessSessions.$inferSelect;
