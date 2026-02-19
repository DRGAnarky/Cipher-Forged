import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Calendar, Coins } from "lucide-react";

interface DailyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinsAwarded: number;
  streakCount: number;
  streakBonus: number;
}

const STREAK_BONUSES = [
  { label: "Week 1", days: 7, coins: 100 },
  { label: "Week 2", days: 14, coins: 200 },
  { label: "Week 3", days: 21, coins: 300 },
  { label: "Week 4", days: 28, coins: 400 },
];

export function DailyLoginModal({
  isOpen,
  onClose,
  coinsAwarded,
  streakCount,
  streakBonus,
}: DailyLoginModalProps) {
  if (!isOpen) return null;

  const totalCoins = coinsAwarded + streakBonus;

  const nextBonus = STREAK_BONUSES.find((b) => streakCount < b.days);
  const daysUntilNext = nextBonus ? nextBonus.days - streakCount : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="bg-[#1e1145] border border-purple-500/30 rounded-md p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white" data-testid="text-daily-title">
                  Daily Login Bonus
                </h2>
              </div>

              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-sm text-purple-300/70">Current Streak</span>
                <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-md">
                  <Flame className="w-3 h-3" />
                  {streakCount} days
                </span>
              </div>

              {nextBonus && (
                <p className="text-xs text-purple-300/50 mb-4">
                  {daysUntilNext} more days until {nextBonus.coins} coin bonus!
                </p>
              )}

              <div className="my-5">
                <div className="text-4xl text-yellow-400 font-bold" data-testid="text-streak-count">
                  {streakCount}
                </div>
                <p className="text-xs text-purple-300/50 mt-1">day streak</p>
              </div>

              <p className="text-sm text-purple-300/60 mb-4">Click to claim today's bonus!</p>

              <div className="flex items-center justify-center gap-2 text-sm text-purple-200 mb-4">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span data-testid="text-daily-coins">+{coinsAwarded} Coins</span>
                {streakBonus > 0 && (
                  <span className="text-purple-400" data-testid="text-streak-bonus">
                    +{streakBonus} Streak Bonus
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                data-testid="button-claim-daily"
                className="w-full py-2.5 rounded-md font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-colors"
              >
                Claim {totalCoins} Coins
              </button>

              <div className="mt-6 border-t border-purple-500/20 pt-4">
                <h3 className="text-sm font-semibold text-purple-200 mb-3">Streak Bonuses</h3>
                <div className="space-y-2">
                  {STREAK_BONUSES.map((bonus) => (
                    <div key={bonus.label} className="flex items-center justify-between text-xs px-2">
                      <span className="text-purple-300/70">
                        {bonus.label} ({bonus.days} days)
                      </span>
                      <span className="text-yellow-400 font-semibold">+{bonus.coins} coins</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-purple-300/40 mt-3">
                  Miss a day? Your weekly bonus resets, but you can still claim daily rewards!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
