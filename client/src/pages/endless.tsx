import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  X,
  Zap,
  Flame,
  Target,
  Trophy,
} from "lucide-react";

interface ChallengeDisplay {
  type: "encrypt" | "decrypt";
  text: string;
  shift: number;
  keyword?: string | null;
  hasPunctuation: boolean;
  cipherType?: string;
}

export default function EndlessPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ cipherId: string }>();
  const cipherId = parseInt(params.cipherId || "1");

  const [challenge, setChallenge] = useState<ChallengeDisplay | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ result: "correct" | "wrong"; expected?: string } | null>(null);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
    total: 0,
  });
  const [sessionEnded, setSessionEnded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: ciphersData } = useQuery<any>({
    queryKey: ["/api/ciphers"],
    enabled: isAuthenticated,
  });

  const cipherName =
    ciphersData?.find((c: any) => c.id === cipherId)?.name || "Caesar Cipher";

  const generateChallengeMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/game/endless/generate`, { cipherId }),
    onSuccess: async (res) => {
      const data = await res.json();
      setChallenge(data);
      setUserAnswer("");
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (answer: string) =>
      apiRequest("POST", `/api/game/endless/submit`, {
        cipherId,
        answer,
      }),
    onSuccess: async (res) => {
      const data = await res.json();
      setFeedback({
        result: data.correct ? "correct" : "wrong",
        expected: data.correct ? undefined : data.expectedAnswer,
      });
      setStats({
        correct: data.sessionCorrect,
        incorrect: data.sessionIncorrect,
        streak: data.currentStreak,
        bestStreak: data.bestStreak,
        total: data.sessionTotal,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });

      setTimeout(() => {
        generateChallengeMutation.mutate();
      }, 1200);
    },
  });

  useEffect(() => {
    if (isAuthenticated && !challenge) {
      generateChallengeMutation.mutate();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || submitMutation.isPending || feedback) return;
    submitMutation.mutate(userAnswer.trim());
  };

  const handleEndSession = () => {
    setSessionEnded(true);
  };

  if (authLoading) {
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

  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-white">Session Complete</h2>
            <p className="text-purple-300/60 mb-6">
              Great work on {cipherName}!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400" data-testid="text-final-correct">
                  {stats.correct}
                </div>
                <div className="text-xs text-purple-300/60">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400" data-testid="text-final-incorrect">
                  {stats.incorrect}
                </div>
                <div className="text-xs text-purple-300/60">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400" data-testid="text-final-streak">
                  {stats.bestStreak}
                </div>
                <div className="text-xs text-purple-300/60">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400" data-testid="text-final-total">
                  {stats.total}
                </div>
                <div className="text-xs text-purple-300/60">Total</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-md border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
                onClick={() => setLocation("/app")}
                data-testid="button-back-to-app"
              >
                Back
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-medium transition-colors"
                onClick={() => {
                  setSessionEnded(false);
                  setStats({
                    correct: 0,
                    incorrect: 0,
                    streak: 0,
                    bestStreak: 0,
                    total: 0,
                  });
                  generateChallengeMutation.mutate();
                }}
                data-testid="button-play-again"
              >
                Play Again
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-150px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

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
              <h1 className="font-bold text-sm text-white">Endless Mode</h1>
              <p className="text-xs text-purple-300/60">{cipherName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-yellow-400" data-testid="text-correct-count">{stats.correct}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-yellow-400" data-testid="text-current-streak">{stats.streak}</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleEndSession} data-testid="button-end-session" className="border-purple-500/30 text-purple-300">
              End
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 relative z-10">
        <AnimatePresence mode="wait">
          {challenge ? (
            <motion.div
              key={`${stats.total}-${challenge.shift}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-6 mb-6">
                <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {challenge.type === "encrypt" ? "Encrypt" : "Decrypt"}
                  </Badge>
                  <span className="text-sm text-purple-300/60" data-testid="text-cipher-hint">
                    {challenge.cipherType === "vigenere" && challenge.keyword
                      ? `Keyword: ${challenge.keyword}`
                      : challenge.cipherType === "atbash"
                        ? "A↔Z  B↔Y  C↔X ..."
                        : `Shift: ${challenge.shift}`}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-purple-300/60 mb-1">
                    {challenge.type === "encrypt"
                      ? "Encrypt this plaintext:"
                      : "Decrypt this ciphertext:"}
                  </p>
                  <div className="font-mono text-lg sm:text-xl tracking-wider p-4 bg-[#1e1145]/60 border border-purple-500/30 rounded-md break-all text-white" data-testid="text-challenge">
                    {challenge.text}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-purple-300/60 mb-1 block">
                      Your answer:
                    </label>
                    <Input
                      ref={inputRef}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value.toUpperCase())}
                      placeholder="Type your answer..."
                      className="font-mono tracking-wider text-lg bg-[#1e1145]/60 border-purple-500/30 text-white placeholder:text-purple-300/40"
                      disabled={!!feedback}
                      data-testid="input-answer"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!userAnswer.trim() || submitMutation.isPending || !!feedback}
                    data-testid="button-submit-answer"
                  >
                    {submitMutation.isPending ? "Checking..." : "Submit Answer"}
                  </button>
                </form>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
                        feedback.result === "correct"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                      data-testid={`feedback-${feedback.result}`}
                    >
                      {feedback.result === "correct" ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Correct! +10 points</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5" />
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

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Correct", value: stats.correct, icon: Check, color: "text-green-400" },
                  { label: "Wrong", value: stats.incorrect, icon: X, color: "text-red-400" },
                  { label: "Streak", value: stats.streak, icon: Flame, color: "text-orange-500" },
                  { label: "Best", value: stats.bestStreak, icon: Zap, color: "text-yellow-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-3 text-center">
                    <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                    <div className="text-lg font-bold text-yellow-400">{stat.value}</div>
                    <div className="text-[10px] text-purple-300/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <motion.div
                className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
