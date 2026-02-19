import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BookOpen,
  Check,
  X,
  Trophy,
  Lock,
  Unlock,
  MessageCircle,
  ChevronRight,
} from "lucide-react";

import characterCaesar from "@/assets/images/character-caesar.png";
import characterEzra from "@/assets/images/character-ezra.png";
import characterBellaso from "@/assets/images/character-bellaso.png";
import sceneCaesar from "@/assets/images/scene-caesar.png";
import sceneEzra from "@/assets/images/scene-ezra.png";
import sceneBellaso from "@/assets/images/scene-bellaso.png";

const CHARACTER_IMAGES: Record<string, string> = {
  caesar: characterCaesar,
  ezra: characterEzra,
  bellaso: characterBellaso,
};

const SCENE_IMAGES: Record<string, string> = {
  caesar: sceneCaesar,
  ezra: sceneEzra,
  bellaso: sceneBellaso,
};

const CHARACTER_COLORS: Record<string, { accent: string; glow: string; border: string }> = {
  caesar: { accent: "text-red-300", glow: "shadow-red-900/40", border: "border-red-500/30" },
  ezra: { accent: "text-amber-300", glow: "shadow-amber-900/40", border: "border-amber-500/30" },
  bellaso: { accent: "text-blue-300", glow: "shadow-blue-900/40", border: "border-blue-500/30" },
};

function CharacterPortrait({ avatarId, size = "md" }: { avatarId: string; size?: "sm" | "md" | "lg" }) {
  const img = CHARACTER_IMAGES[avatarId] || CHARACTER_IMAGES.caesar;
  const colors = CHARACTER_COLORS[avatarId] || CHARACTER_COLORS.caesar;
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-24 h-24",
  };
  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden ${colors.border} border-2 shrink-0 shadow-lg ${colors.glow} bg-[#0d0520]`}
      data-testid={`portrait-${avatarId}`}
    >
      <img src={img} alt={avatarId} className="w-full h-full object-cover object-top" />
    </div>
  );
}

function DialogueBubble({
  line,
  index,
  avatarId,
}: {
  line: { speaker: string; text: string; isUser?: boolean };
  index: number;
  avatarId: string;
}) {
  const isUser = line.isUser;
  const colors = CHARACTER_COLORS[avatarId] || CHARACTER_COLORS.caesar;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      data-testid={`dialogue-line-${index}`}
    >
      {!isUser && <CharacterPortrait avatarId={avatarId} size="sm" />}
      <div
        className={`max-w-[85%] backdrop-blur-sm ${
          isUser
            ? "bg-purple-600/30 border-purple-500/30 rounded-tl-lg rounded-bl-lg rounded-br-lg"
            : "bg-[#0d0520]/80 border-purple-500/20 rounded-tr-lg rounded-br-lg rounded-bl-lg"
        } border p-3`}
      >
        {!isUser && (
          <p className={`text-[10px] font-bold ${colors.accent} mb-1 uppercase tracking-wider`}>
            {line.speaker}
          </p>
        )}
        <p className="text-sm text-purple-100 leading-relaxed">{line.text}</p>
      </div>
    </motion.div>
  );
}

export default function StoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ cipherId: string; chapter: string }>();
  const cipherId = parseInt(params.cipherId || "1");
  const chapter = parseInt(params.chapter || "1");

  const [currentStep, setCurrentStep] = useState(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [chapterComplete, setChapterComplete] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showReaction, setShowReaction] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogueEndRef = useRef<HTMLDivElement>(null);
  const progressTimestamp = useRef(0);

  useEffect(() => {
    setCurrentStep(1);
    setUserAnswer("");
    setFeedback(null);
    setChapterComplete(false);
    setSelectedChoice(null);
    setShowReaction(false);
    setShowTask(false);
    setProgressLoaded(false);
    progressTimestamp.current = 0;
  }, [cipherId, chapter]);

  const { data: storyData, isLoading: storyLoading } = useQuery<any>({
    queryKey: ["/api/story", cipherId, chapter],
    enabled: isAuthenticated,
  });

  const { data: progressData, dataUpdatedAt } = useQuery<any>({
    queryKey: ["/api/story", cipherId, chapter, "progress"],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const submitMutation = useMutation({
    mutationFn: (answer: string) =>
      apiRequest(
        "POST",
        `/api/story/${cipherId}/${chapter}/${currentStep}/submit`,
        { answer }
      ),
    onSuccess: async (res) => {
      const data = await res.json();
      if (data.correct) {
        setFeedback("correct");
        queryClient.invalidateQueries({
          queryKey: ["/api/story", cipherId, chapter, "progress"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/story", String(cipherId), "chapters"],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
        queryClient.invalidateQueries({ queryKey: ["/api/story/completions"] });

        setTimeout(() => {
          const totalSteps = storyData?.steps?.length || 0;
          if (totalSteps > 0 && currentStep >= totalSteps) {
            setChapterComplete(true);
          } else {
            setCurrentStep((s) => s + 1);
            setUserAnswer("");
            setFeedback(null);
            setSelectedChoice(null);
            setShowReaction(false);
            setShowTask(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }, 1500);
      } else {
        setFeedback("wrong");
        setTimeout(() => {
          setFeedback(null);
        }, 2000);
      }
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!progressData || !storyData) return;
    if (progressLoaded) return;
    setProgressLoaded(true);
    const totalSteps = storyData?.steps?.length || 0;
    if (progressData.currentStep && totalSteps > 0) {
      if (progressData.currentStep > totalSteps) {
        setChapterComplete(true);
      } else {
        setCurrentStep(progressData.currentStep);
      }
    }
  }, [progressData, storyData, progressLoaded]);

  const steps = storyData?.steps || [];
  const step = steps.find((s: any) => s.stepNumber === currentStep);

  useEffect(() => {
    setSelectedChoice(null);
    setShowReaction(false);
    setShowTask(false);
  }, [currentStep]);

  useEffect(() => {
    if (step && (!step.responseChoices || step.responseChoices.length === 0)) {
      setShowTask(true);
    }
    if (step && step.stepType === "dialogue_only") {
      setShowTask(false);
    }
  }, [step]);

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setShowReaction(true);
    setTimeout(() => {
      setShowTask(true);
      setTimeout(() => {
        dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 300);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || submitMutation.isPending || feedback) return;
    submitMutation.mutate(userAnswer.trim());
  };

  if (authLoading || storyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0520]">
        <motion.div
          className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const progressPct = ((currentStep - 1) / Math.max(steps.length, 1)) * 100;
  const selectedChoiceObj = step?.responseChoices?.find(
    (c: any) => c.id === selectedChoice
  );
  const cipherName = storyData?.cipherName || "Unknown";
  const isVigenere = cipherName.toLowerCase().includes("vigen");
  const isAtbash = cipherName.toLowerCase().includes("atbash");
  const avatarId = step?.speakerAvatar || "caesar";
  const sceneImage = SCENE_IMAGES[avatarId] || SCENE_IMAGES.caesar;
  const characterImage = CHARACTER_IMAGES[avatarId] || CHARACTER_IMAGES.caesar;
  const colors = CHARACTER_COLORS[avatarId] || CHARACTER_COLORS.caesar;

  if (chapterComplete) {
    const isLastChapter = chapter >= 10;
    const nextChapter = chapter + 1;

    return (
      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${sceneImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0520] via-[#0d0520]/80 to-[#0d0520]/60" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-[#0d0520]/90 backdrop-blur-md border border-purple-500/20 rounded-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <CharacterPortrait avatarId={avatarId} size="lg" />
              </div>
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2 text-white" data-testid="text-chapter-complete">
                Chapter {chapter} Complete!
              </h2>
              <p className="text-purple-300/60 mb-2 text-sm">
                {step?.speaker || "Your mentor"} has taught you well.
              </p>
              {isLastChapter ? (
                <p className="text-green-400 mb-6 text-sm font-medium">
                  You've completed all chapters for {cipherName}! Endless Mode is now unlocked.
                </p>
              ) : (
                <p className="text-purple-300/60 mb-6 text-sm">
                  Ready for Chapter {nextChapter}?
                </p>
              )}
              <div className="space-y-2">
                {!isLastChapter && (
                  <button
                    className="w-full px-4 py-2.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-colors"
                    onClick={() => setLocation(`/story/${cipherId}/${nextChapter}`)}
                    data-testid="button-next-chapter"
                  >
                    <ChevronRight className="w-4 h-4 inline mr-1" />
                    Next Chapter
                  </button>
                )}
                <button
                  className="w-full px-4 py-2.5 rounded-md border border-purple-500/30 text-purple-200 hover:bg-purple-500/20 font-medium transition-colors"
                  onClick={() => setLocation(`/story/${cipherId}/chapters`)}
                  data-testid="button-back-to-chapters"
                >
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Chapter Select
                </button>
                <button
                  className="w-full px-4 py-2.5 rounded-md text-purple-400/60 hover:text-purple-300 text-sm font-medium transition-colors"
                  onClick={() => setLocation("/app")}
                  data-testid="button-back-to-library"
                >
                  Back to Library
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url(${sceneImage})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-[#0d0520] via-[#0d0520]/70 to-[#0d0520]/40" />

      <header className="sticky top-0 z-50 bg-[#0d0520]/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation(`/story/${cipherId}/chapters`)}
              data-testid="button-back"
              className="text-purple-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CharacterPortrait avatarId={avatarId} size="sm" />
              <div>
                <h1 className="font-bold text-sm text-white" data-testid="text-story-title">
                  {step?.speaker || "Story"}'s Tutorial
                </h1>
                <p className="text-xs text-purple-300/60">
                  Step {currentStep}/{steps.length}
                </p>
              </div>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            <BookOpen className="w-3 h-3 mr-1" />
            {cipherName}
          </Badge>
        </div>
        <div className="max-w-2xl mx-auto px-3 pb-2">
          <Progress value={progressPct} className="h-1" />
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto p-4 sm:p-6 pb-32">
        <AnimatePresence mode="wait">
          {step ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mb-6"
              >
                <div className={`relative rounded-md overflow-hidden border ${colors.border} shadow-xl ${colors.glow}`}>
                  <img
                    src={characterImage}
                    alt={step.speaker || avatarId}
                    className="w-32 h-40 sm:w-40 sm:h-52 object-cover object-top"
                    data-testid="img-character"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0d0520] to-transparent h-12" />
                  <div className="absolute bottom-1 inset-x-0 text-center">
                    <span className={`text-xs font-bold ${colors.accent} uppercase tracking-wider`}>
                      {step.speaker}
                    </span>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-3 mb-6">
                {step.dialogueLines?.map((line: any, i: number) => (
                  <DialogueBubble
                    key={i}
                    line={line}
                    index={i}
                    avatarId={step.speakerAvatar || "caesar"}
                  />
                ))}
              </div>

              {!selectedChoice && step.responseChoices && step.responseChoices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (step.dialogueLines?.length || 3) * 0.12 + 0.2 }}
                  className="mb-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                    <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                      Your Response
                    </p>
                  </div>
                  <div className="space-y-2">
                    {step.responseChoices.map((choice: any, i: number) => (
                      <motion.button
                        key={choice.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleChoiceSelect(choice.id)}
                        className="w-full text-left p-3 rounded-md border border-purple-500/20 bg-[#0d0520]/70 backdrop-blur-sm hover:bg-purple-600/20 hover:border-purple-500/40 transition-all text-sm text-purple-200 flex items-center gap-2"
                        data-testid={`choice-${choice.id}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                          <span className="text-purple-400 font-bold text-xs">{String.fromCharCode(65 + i)}</span>
                        </span>
                        <span className="flex-1">{choice.text}</span>
                        <ChevronRight className="w-4 h-4 text-purple-500/40" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {showReaction && selectedChoiceObj && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <DialogueBubble
                    line={{
                      speaker: step.speaker,
                      text: selectedChoiceObj.reaction,
                    }}
                    index={0}
                    avatarId={step.speakerAvatar || "caesar"}
                  />
                </motion.div>
              )}

              {showTask && step.stepType !== "dialogue_only" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-[#0d0520]/90 backdrop-blur-md border border-purple-500/20 rounded-md p-5"
                >
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-300 border-amber-500/30">
                      {step.taskType === "encrypt" ? (
                        <><Lock className="w-3 h-3 mr-1" /> Encrypt</>
                      ) : (
                        <><Unlock className="w-3 h-3 mr-1" /> Decrypt</>
                      )}
                    </Badge>
                    {!isAtbash && !isVigenere && step.taskShift > 0 && (
                      <span className="text-xs text-purple-300/60">
                        Shift: {step.taskShift}
                      </span>
                    )}
                    {isVigenere && step.taskKeyword && (
                      <span className="text-xs text-purple-300/60">
                        Keyword: <span className="font-mono text-amber-300">{step.taskKeyword}</span>
                      </span>
                    )}
                    {isAtbash && (
                      <span className="text-xs text-purple-300/60">
                        A=Z, B=Y, C=X...
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-purple-300/60 mb-1.5">
                      {step.taskType === "encrypt"
                        ? "Encrypt this message:"
                        : "Decrypt this message:"}
                    </p>
                    <div
                      className="font-mono text-lg sm:text-xl tracking-widest p-4 bg-[#1a0a2e]/60 border border-purple-500/30 rounded-md text-white text-center"
                      data-testid="text-task"
                    >
                      {step.taskType === "encrypt"
                        ? step.taskPlaintext
                        : step.taskCiphertext}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                      ref={inputRef}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value.toUpperCase())}
                      placeholder="Type your answer..."
                      className="font-mono tracking-wider text-center text-lg bg-[#1a0a2e]/60 border-purple-500/30 text-white placeholder:text-purple-300/40"
                      disabled={!!feedback}
                      data-testid="input-story-answer"
                    />
                    <button
                      type="submit"
                      className="w-full px-4 py-2.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        !userAnswer.trim() || submitMutation.isPending || !!feedback
                      }
                      data-testid="button-submit-story"
                    >
                      {submitMutation.isPending ? "Checking..." : "Submit Answer"}
                    </button>
                  </form>

                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`mt-3 p-3 rounded-md flex items-center gap-2 ${
                          feedback === "correct"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                        data-testid={`story-feedback-${feedback}`}
                      >
                        {feedback === "correct" ? (
                          <>
                            <Check className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm">
                              Correct! +10 points. Continuing...
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm">Not quite. Try again!</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              <div ref={dialogueEndRef} />
            </motion.div>
          ) : (
            <div className="bg-[#0d0520]/90 backdrop-blur-md border border-purple-500/20 rounded-md p-6 text-center">
              <p className="text-purple-300/60">No story content available yet.</p>
              <button
                className="mt-4 px-4 py-2.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-colors"
                onClick={() => setLocation("/app")}
              >
                Back to Library
              </button>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
