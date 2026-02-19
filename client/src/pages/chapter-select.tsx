import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Lock,
  ChevronRight,
} from "lucide-react";

import characterCaesar from "@/assets/images/character-caesar.png";
import characterEzra from "@/assets/images/character-ezra.png";
import characterBellaso from "@/assets/images/character-bellaso.png";
import sceneCaesar from "@/assets/images/scene-caesar.png";
import sceneEzra from "@/assets/images/scene-ezra.png";
import sceneBellaso from "@/assets/images/scene-bellaso.png";

const CHARACTER_IMAGES: Record<string, string> = {
  "1": characterCaesar,
  "2": characterEzra,
  "3": characterBellaso,
};

const SCENE_IMAGES: Record<string, string> = {
  "1": sceneCaesar,
  "2": sceneEzra,
  "3": sceneBellaso,
};

const CIPHER_NAMES: Record<string, string> = {
  "1": "Caesar Cipher",
  "2": "Atbash Cipher",
  "3": "Vigenere Cipher",
};

const CIPHER_MENTORS: Record<string, string> = {
  "1": "Caesar",
  "2": "Ezra",
  "3": "Bellaso",
};

const CIPHER_COLORS: Record<string, { accent: string; border: string; bg: string }> = {
  "1": { accent: "text-red-300", border: "border-red-500/30", bg: "bg-red-500/10" },
  "2": { accent: "text-amber-300", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  "3": { accent: "text-blue-300", border: "border-blue-500/30", bg: "bg-blue-500/10" },
};

export default function ChapterSelectPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ cipherId: string }>();
  const cipherId = params.cipherId || "1";

  const { data: chaptersData, isLoading } = useQuery<any>({
    queryKey: ["/api/story", cipherId, "chapters"],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (authLoading || isLoading) {
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

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const chapters = chaptersData?.chapters || [];
  const sceneImage = SCENE_IMAGES[cipherId] || SCENE_IMAGES["1"];
  const characterImage = CHARACTER_IMAGES[cipherId] || CHARACTER_IMAGES["1"];
  const mentor = CIPHER_MENTORS[cipherId] || "Caesar";
  const cipherName = CIPHER_NAMES[cipherId] || "Caesar Cipher";
  const colors = CIPHER_COLORS[cipherId] || CIPHER_COLORS["1"];

  const completedCount = chapters.filter((ch: any) => ch.isComplete).length;
  const totalCount = chapters.length;

  const firstIncomplete = chapters.find((ch: any) => !ch.isComplete);
  const currentChapter = firstIncomplete?.chapterNumber || (totalCount > 0 ? totalCount : 1);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${sceneImage})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0d0520]/80 via-[#0d0520]/90 to-[#0d0520]" />

      <header className="sticky top-0 z-50 bg-[#0d0520]/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 p-3">
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
              <h1 className="font-bold text-sm text-white" data-testid="text-cipher-name">
                {cipherName}
              </h1>
              <p className="text-xs text-purple-300/60">
                {completedCount}/{totalCount} chapters complete
              </p>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            <BookOpen className="w-3 h-3 mr-1" />
            Story Mode
          </Badge>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto p-4 sm:p-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className={`rounded-md overflow-hidden ${colors.border} border-2 shadow-xl mb-4`}>
            <img
              src={characterImage}
              alt={mentor}
              className="w-28 h-36 sm:w-36 sm:h-48 object-cover object-top"
              data-testid="img-mentor"
            />
          </div>
          <h2 className={`text-xl font-bold ${colors.accent}`} data-testid="text-mentor-name">
            {mentor}'s Tutorial
          </h2>
          <p className="text-sm text-purple-300/60 mt-1 text-center">
            {totalCount > 0 && completedCount === totalCount
              ? "All chapters complete! You've mastered this cipher."
              : `Complete all ${totalCount} chapters to unlock Endless Mode`}
          </p>
        </motion.div>

        <div className="space-y-2">
          {chapters.map((ch: any, index: number) => {
            const isComplete = ch.isComplete;
            const isCurrent = ch.chapterNumber === currentChapter;
            const isLocked = ch.chapterNumber > currentChapter && !isComplete;

            return (
              <motion.button
                key={ch.chapterNumber}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (!isLocked) {
                    setLocation(`/story/${cipherId}/${ch.chapterNumber}`);
                  }
                }}
                disabled={isLocked}
                className={`w-full text-left p-4 rounded-md border backdrop-blur-sm transition-all flex items-center gap-3 ${
                  isComplete
                    ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/15"
                    : isCurrent
                    ? `${colors.bg} ${colors.border} hover:bg-purple-500/20`
                    : isLocked
                    ? "bg-[#0d0520]/60 border-purple-500/10 opacity-50 cursor-not-allowed"
                    : "bg-[#0d0520]/60 border-purple-500/20 hover:bg-purple-500/10"
                }`}
                data-testid={`chapter-${ch.chapterNumber}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isComplete
                    ? "bg-green-500/20"
                    : isCurrent
                    ? `${colors.bg}`
                    : "bg-purple-500/10"
                }`}>
                  {isComplete ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-purple-500/40" />
                  ) : (
                    <span className={`text-sm font-bold ${isCurrent ? colors.accent : "text-purple-400"}`}>
                      {ch.chapterNumber}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${
                      isComplete ? "text-green-300" : isLocked ? "text-purple-400/50" : "text-white"
                    }`}>
                      Chapter {ch.chapterNumber}
                    </span>
                    {isCurrent && !isComplete && (
                      <Badge className={`${colors.bg} ${colors.accent} ${colors.border} text-[10px] py-0`}>
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    isComplete ? "text-green-400/60" : isLocked ? "text-purple-400/30" : "text-purple-300/60"
                  }`}>
                    {ch.chapterTitle || `Chapter ${ch.chapterNumber}`}
                  </p>
                  {!isLocked && (
                    <p className="text-[10px] text-purple-400/40 mt-0.5">
                      {ch.completedSteps}/{ch.stepCount} steps
                    </p>
                  )}
                </div>

                {!isLocked && (
                  <ChevronRight className={`w-4 h-4 shrink-0 ${
                    isComplete ? "text-green-500/40" : "text-purple-500/40"
                  }`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
