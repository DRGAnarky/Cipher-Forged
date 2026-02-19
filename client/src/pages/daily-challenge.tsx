import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  X,
  Trophy,
  Coins,
  Star,
  Zap,
  Target,
  Eye,
  EyeOff,
  Link2,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

interface ChallengeItem {
  id: number;
  instruction: string;
  displayText: string;
  shift?: number;
  hint?: string;
  partialReveal?: string;
}

interface ChallengeSession {
  type: string;
  typeName: string;
  typeDescription: string;
  difficulty: string;
  pointsReward: number;
  coinsReward: number;
  challenges: ChallengeItem[];
  totalCount: number;
}

export default function DailyChallengePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; expected?: string } | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [reward, setReward] = useState<{ points: number; coins: number } | null>(null);
  const [startError, setStartError] = useState("");
  const [completeError, setCompleteError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const completionRequested = useRef(false);

  const { data: dailyStatus, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/daily-challenge"],
    enabled: isAuthenticated,
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/daily-challenge/start"),
    onSuccess: async (res) => {
      const data = await res.json();
      if (data.message) {
        setStartError(data.message);
      } else {
        setSession(data);
        setCurrentIndex(0);
        setResults([]);
        setFeedback(null);
        setUserAnswer("");
        setShowHint(false);
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    },
    onError: async (err: any) => {
      try {
        const text = await err?.response?.text?.();
        const parsed = text ? JSON.parse(text) : {};
        setStartError(parsed.message || "Failed to start challenge");
      } catch {
        setStartError("Daily challenge already completed today");
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: (args: { challengeId: number; answer: string }) =>
      apiRequest("POST", "/api/daily-challenge/submit", args),
    onSuccess: async (res) => {
      const data = await res.json();
      setFeedback({ correct: data.correct, expected: data.expectedAnswer });
      setResults((prev) => [...prev, data.correct]);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/daily-challenge/complete"),
    onSuccess: async (res) => {
      const data = await res.json();
      setReward({ points: data.pointsAwarded, coins: data.coinsAwarded });
      setCompleted(true);
      setCompleteError("");
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-challenge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    },
    onError: async () => {
      setCompleteError("Failed to complete challenge. Please try again.");
      completionRequested.current = false;
    },
  });

  useEffect(() => {
    if (dailyStatus && !session && !startError) {
      if (dailyStatus.completed) {
        setAlreadyCompleted(true);
      } else if (!startMutation.isPending) {
        startMutation.mutate();
      }
    }
  }, [dailyStatus]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || submitMutation.isPending || feedback || !session) return;
    const item = session.challenges[currentIndex];
    submitMutation.mutate({ challengeId: item.id, answer: userAnswer.trim() });
  };

  const triggerComplete = () => {
    if (completionRequested.current || completed) return;
    completionRequested.current = true;
    completeMutation.mutate();
  };

  const handleNext = () => {
    if (!session) return;
    if (currentIndex + 1 < session.challenges.length) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setFeedback(null);
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const currentChallenge = session?.challenges[currentIndex];
  const correctCount = results.filter(Boolean).length;
  const allDone = session && results.length === session.challenges.length;

  useEffect(() => {
    if (allDone && !completed && !completionRequested.current) {
      triggerComplete();
    }
  }, [allDone, completed]);

  const difficultyColor = (d: string) => {
    if (d === "Easy") return "bg-green-500/30 text-green-300";
    if (d === "Medium") return "bg-yellow-500/30 text-yellow-300";
    return "bg-red-500/30 text-red-300";
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case "speed_decrypt": return <Zap className="w-4 h-4" />;
      case "reverse_engineer": return <Target className="w-4 h-4" />;
      case "missing_letters": return <EyeOff className="w-4 h-4" />;
      case "blind_decrypt": return <Eye className="w-4 h-4" />;
      case "chain_decode": return <Link2 className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520]">
        <motion.div
          className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
          <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" data-testid="text-daily-already-done">
              Today's Challenge Complete
            </h2>
            <p className="text-purple-300/70 text-sm mb-2">
              You've already completed today's {dailyStatus?.typeName || "daily challenge"}.
            </p>
            <p className="text-purple-300/50 text-xs mb-6">
              Come back tomorrow for a new challenge!
            </p>
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 no-default-hover-elevate"
              onClick={() => setLocation("/app")}
              data-testid="button-back-from-daily"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Library
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (startError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
          <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-6 text-center">
            <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-white" data-testid="text-already-done">Challenge Complete</h2>
            <p className="text-purple-300/70 mb-6 text-sm">You've already completed today's daily challenge. Come back tomorrow for a new one!</p>
            <button
              className="w-full px-4 py-2 rounded-md border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
              onClick={() => setLocation("/app")}
              data-testid="button-back-to-app"
            >
              Back to Main
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (completed && reward) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
          <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-white" data-testid="text-complete-title">Daily Challenge Complete!</h2>
            <p className="text-purple-300/60 mb-6">
              {session?.typeName} - {session?.difficulty}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400" data-testid="text-final-correct">{correctCount}</div>
                <div className="text-xs text-purple-300/60">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400" data-testid="text-final-incorrect">{results.length - correctCount}</div>
                <div className="text-xs text-purple-300/60">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300" data-testid="text-final-total">{results.length}</div>
                <div className="text-xs text-purple-300/60">Total</div>
              </div>
            </div>

            <div className="bg-[#1e1145]/60 border border-purple-500/30 rounded-md p-4 mb-6">
              <p className="text-sm text-purple-300/70 mb-3">Rewards Earned</p>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-lg font-bold text-yellow-400" data-testid="text-reward-points">+{reward.points}</span>
                  <span className="text-xs text-purple-300/60">pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-bold text-yellow-400" data-testid="text-reward-coins">+{reward.coins}</span>
                  <span className="text-xs text-purple-300/60">coins</span>
                </div>
              </div>
            </div>

            <button
              className="w-full px-4 py-2 rounded-md border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
              onClick={() => setLocation("/app")}
              data-testid="button-back-to-app"
            >
              Back to Main
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-150px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-50 bg-[#1a0a2e]/90 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/app")}
              data-testid="button-back"
              className="text-purple-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-bold text-sm text-white" data-testid="text-challenge-type">
                {session?.typeName || "Daily Challenge"}
              </h1>
              <p className="text-xs text-purple-300/60">{session?.typeDescription || "Loading..."}</p>
            </div>
          </div>

          {session && (
            <div className="flex items-center gap-3">
              <Badge className={`${difficultyColor(session.difficulty)} border-0 no-default-hover-elevate no-default-active-elevate`}>
                {session.difficulty}
              </Badge>
              <span className="text-xs text-purple-300/60">
                {currentIndex + 1}/{session.totalCount}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 relative z-10">
        {!session ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {session.challenges.map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-1.5 rounded-full transition-colors ${
                    i < results.length
                      ? results[i]
                        ? "bg-green-400"
                        : "bg-red-400"
                      : i === currentIndex
                      ? "bg-purple-400"
                      : "bg-purple-500/20"
                  }`}
                  data-testid={`progress-bar-${i}`}
                />
              ))}
            </div>

            <div className="bg-gradient-to-r from-amber-600/20 via-orange-500/20 to-yellow-600/20 border border-amber-500/30 rounded-md p-3 mb-4 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {typeIcon(session.type)}
                <span className="text-sm font-medium text-amber-200">{session.typeName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-amber-200/70 flex items-center gap-1">
                  <Star className="w-3 h-3" /> {session.pointsReward} pts
                </span>
                <span className="text-xs text-amber-200/70 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {session.coinsReward} coins
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {allDone && !completed && (
                <motion.div
                  key="completing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-6 mb-4 text-center"
                >
                  {completeError ? (
                    <>
                      <X className="w-8 h-8 text-red-400 mx-auto mb-3" />
                      <p className="text-red-300 mb-3" data-testid="text-complete-error">{completeError}</p>
                      <button
                        onClick={() => triggerComplete()}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium"
                        data-testid="button-retry-complete"
                      >
                        Retry
                      </button>
                    </>
                  ) : (
                    <>
                      <motion.div
                        className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <p className="text-purple-300" data-testid="text-completing">Completing challenge...</p>
                    </>
                  )}
                </motion.div>
              )}
              {completed && reward && (
                <motion.div
                  key="reward"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-amber-600/20 via-orange-500/20 to-yellow-600/20 border border-amber-500/30 rounded-md p-6 mb-4 text-center"
                >
                  <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-yellow-400 mb-2" data-testid="text-challenge-complete">Challenge Complete!</h2>
                  <p className="text-amber-200/80 text-sm mb-4">Great work on today's challenge</p>
                  <div className="flex items-center justify-center gap-6 mb-4">
                    <div className="text-center">
                      <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-yellow-400">+{reward.points}</div>
                      <div className="text-xs text-purple-300/60">Points</div>
                    </div>
                    <div className="text-center">
                      <Coins className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-yellow-400">+{reward.coins}</div>
                      <div className="text-xs text-purple-300/60">Coins</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setLocation("/app")}
                    className="px-6 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium"
                    data-testid="button-back-to-dashboard"
                  >
                    Back to Dashboard
                  </button>
                </motion.div>
              )}
              {currentChallenge && !allDone && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-6 mb-4">
                    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        Challenge {currentChallenge.id}
                      </Badge>
                      {currentChallenge.hint && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-purple-300 hover:text-yellow-400"
                          onClick={() => setShowHint(!showHint)}
                          data-testid="button-hint"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-purple-300/80 mb-3" data-testid="text-instruction">
                      {currentChallenge.instruction}
                    </p>

                    {showHint && currentChallenge.hint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mb-3"
                      >
                        <p className="text-xs text-yellow-300" data-testid="text-hint">{currentChallenge.hint}</p>
                      </motion.div>
                    )}

                    <div className="mb-4">
                      <div className="font-mono text-lg sm:text-xl tracking-wider p-4 bg-[#1e1145]/60 border border-purple-500/30 rounded-md break-all text-white whitespace-pre-line" data-testid="text-challenge-display">
                        {currentChallenge.displayText}
                      </div>
                    </div>

                    {currentChallenge.partialReveal && (
                      <div className="mb-4">
                        <p className="text-xs text-purple-300/60 mb-1">Partial reveal:</p>
                        <div className="font-mono text-base tracking-widest p-3 bg-[#1e1145]/60 border border-purple-500/30 rounded-md text-yellow-300" data-testid="text-partial-reveal">
                          {currentChallenge.partialReveal}
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs text-purple-300/60 mb-1 block">
                          {session.type === "reverse_engineer" ? "Enter the shift number:" : "Your answer:"}
                        </label>
                        <Input
                          ref={inputRef}
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(
                            session.type === "reverse_engineer"
                              ? e.target.value.replace(/[^0-9]/g, "")
                              : e.target.value.toUpperCase()
                          )}
                          placeholder={session.type === "reverse_engineer" ? "Enter shift number..." : "Type your answer..."}
                          className="font-mono tracking-wider text-lg bg-[#1e1145]/60 border-purple-500/30 text-white placeholder:text-purple-300/40"
                          disabled={!!feedback}
                          data-testid="input-answer"
                        />
                      </div>

                      {!feedback ? (
                        <button
                          type="submit"
                          className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!userAnswer.trim() || submitMutation.isPending}
                          data-testid="button-submit-answer"
                        >
                          {submitMutation.isPending ? "Checking..." : "Submit Answer"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 font-medium transition-colors"
                          onClick={handleNext}
                          data-testid="button-next"
                        >
                          {currentIndex + 1 < session.challenges.length ? (
                            <span className="flex items-center justify-center gap-1">
                              Next Challenge <ChevronRight className="w-4 h-4" />
                            </span>
                          ) : (
                            "Finish Challenge"
                          )}
                        </button>
                      )}
                    </form>

                    <AnimatePresence>
                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
                            feedback.correct
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                          data-testid={`feedback-${feedback.correct ? "correct" : "wrong"}`}
                        >
                          {feedback.correct ? (
                            <>
                              <Check className="w-5 h-5 shrink-0" />
                              <span className="font-medium">Correct!</span>
                            </>
                          ) : (
                            <>
                              <X className="w-5 h-5 shrink-0" />
                              <div>
                                <span className="font-medium block">Incorrect</span>
                                {feedback.expected && (
                                  <span className="text-xs opacity-80">
                                    Expected: {feedback.expected}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-3 text-center">
                <Check className="w-4 h-4 mx-auto mb-1 text-green-400" />
                <div className="text-lg font-bold text-yellow-400" data-testid="text-correct-count">{correctCount}</div>
                <div className="text-[10px] text-purple-300/60">Correct</div>
              </div>
              <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-3 text-center">
                <X className="w-4 h-4 mx-auto mb-1 text-red-400" />
                <div className="text-lg font-bold text-yellow-400" data-testid="text-incorrect-count">{results.length - correctCount}</div>
                <div className="text-[10px] text-purple-300/60">Incorrect</div>
              </div>
              <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-3 text-center">
                <Target className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="text-lg font-bold text-yellow-400" data-testid="text-progress">{results.length}/{session?.totalCount || 0}</div>
                <div className="text-[10px] text-purple-300/60">Progress</div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
