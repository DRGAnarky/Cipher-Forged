import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarDisplay } from "@/components/avatar-display";
import { SigilIcon } from "@/components/sigil-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { AVATARS, FRAMES, TITLE_LIST } from "@/lib/sigils";
import {
  ArrowLeft,
  Coins,
  Star,
  Flame,
  Trophy,
  Lock,
  Check,
  Palette,
  Shield,
  User as UserIcon,
  Target,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [achievementFilter, setAchievementFilter] = useState<"unlocked" | "locked">("unlocked");

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/me"],
    enabled: isAuthenticated,
  });

  const { data: achievementsData } = useQuery<any[]>({
    queryKey: ["/api/achievements"],
    enabled: isAuthenticated,
  });

  const { data: profileData } = useQuery<any>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const selectTitleMutation = useMutation({
    mutationFn: (titleId: number) =>
      apiRequest("POST", "/api/profile/select-title", { titleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  const selectAvatarMutation = useMutation({
    mutationFn: (avatarId: number) =>
      apiRequest("POST", "/api/profile/select-avatar", { avatarId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  const selectFrameMutation = useMutation({
    mutationFn: (frameId: number) =>
      apiRequest("POST", "/api/profile/select-frame", { frameId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

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

  const achievements = achievementsData || [];
  const unlockedAchievements = achievements.filter((a: any) => a.unlockedAt);
  const lockedAchievements = achievements.filter((a: any) => !a.unlockedAt);
  const unlockedTitles = profileData?.unlockedTitles || [1];
  const unlockedAvatars = profileData?.unlockedAvatars || [1, 2, 3, 4, 5];
  const unlockedFrames = profileData?.unlockedFrames || [1];
  const selectedTitle = TITLE_LIST.find((t) => t.id === profile?.chosenTitleId) || TITLE_LIST[0];

  const totalCorrect = profile?.totalCorrect ?? 0;
  const totalIncorrect = profile?.totalIncorrect ?? 0;
  const totalAttempts = totalCorrect + totalIncorrect;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] text-white relative overflow-hidden">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-800/5 rounded-full blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-50 bg-[#1a0a2e]/90 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/app")}
              data-testid="button-back"
              className="text-white hover:bg-purple-500/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-md bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 font-bold text-sm">CF</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-5 relative z-10 pb-12">
        <div className="text-center pt-2 pb-1">
          <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">Your Profile</h1>
          <p className="text-sm text-purple-300/70 mt-1">Track your progress and achievements</p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-pink-600/80 via-purple-600/80 to-violet-600/80 p-5 border border-purple-400/30" data-testid="card-user-info">
          <div className="flex items-center gap-4 flex-wrap">
            <AvatarDisplay
              avatarId={profile?.chosenAvatarId || 1}
              frameId={profile?.chosenFrameId || 1}
              size={72}
              profileImageUrl={user?.profileImageUrl}
            />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white" data-testid="text-profile-name">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-white/70" data-testid="text-profile-email">
                {(user as any)?.email || selectedTitle.name}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {(user as any)?.isAdmin && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400" data-testid="badge-admin">
                    Admin
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-400/20 text-purple-200" data-testid="text-profile-title">
                  {selectedTitle.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="achievements">
          <TabsList className="grid w-full grid-cols-2 bg-[#1e1145]/80 border border-purple-500/20">
            <TabsTrigger value="achievements" data-testid="tab-achievements" className="data-[state=active]:bg-purple-600/40 data-[state=active]:text-white text-purple-300">
              <Trophy className="w-4 h-4 mr-1.5" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="cosmetics" data-testid="tab-cosmetics" className="data-[state=active]:bg-purple-600/40 data-[state=active]:text-white text-purple-300">
              <Palette className="w-4 h-4 mr-1.5" />
              Cosmetics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAchievementFilter("unlocked")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  achievementFilter === "unlocked"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-[#1e1145]/60 text-purple-300/70 border border-purple-500/20"
                }`}
                data-testid="filter-unlocked"
              >
                Unlocked ({unlockedAchievements.length})
              </button>
              <button
                onClick={() => setAchievementFilter("locked")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  achievementFilter === "locked"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-[#1e1145]/60 text-purple-300/70 border border-purple-500/20"
                }`}
                data-testid="filter-locked"
              >
                Locked ({lockedAchievements.length})
              </button>
            </div>

            {achievementFilter === "unlocked" && (
              <div className="space-y-3">
                {unlockedAchievements.length === 0 && (
                  <div className="text-center py-8 text-purple-300/50 text-sm">No achievements unlocked yet</div>
                )}
                {unlockedAchievements.map((a: any, i: number) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="rounded-xl bg-[#1e1145]/80 border border-purple-500/20 p-4" data-testid={`achievement-${a.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <SigilIcon sigilId={a.sigilId} size={24} className="text-purple-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm text-white">{a.title}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400">
                              Unlocked
                            </span>
                          </div>
                          <p className="text-xs text-purple-300/60 mt-0.5">{a.description}</p>
                          <p className="text-[10px] text-purple-400/70 mt-1">
                            <Check className="w-3 h-3 inline mr-1" />
                            {a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {achievementFilter === "locked" && (
              <div className="space-y-3">
                {lockedAchievements.length === 0 && (
                  <div className="text-center py-8 text-purple-300/50 text-sm">All achievements unlocked!</div>
                )}
                {lockedAchievements.map((a: any) => (
                  <div key={a.id} className="rounded-xl bg-[#1e1145]/50 border border-purple-500/10 p-4 opacity-70" data-testid={`achievement-locked-${a.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-lg bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-purple-400/50" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-purple-200/80">{a.title}</h4>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400/60 mt-1">
                          {a.difficulty}
                        </span>
                        <p className="text-xs text-purple-300/40 mt-1 italic">
                          Hint: {a.hint}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cosmetics" className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold text-purple-300/70 mb-3">Titles</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {TITLE_LIST.map((title) => {
                  const isUnlocked = unlockedTitles.includes(title.id);
                  const isSelected = profile?.chosenTitleId === title.id;
                  return (
                    <button
                      key={title.id}
                      disabled={!isUnlocked}
                      onClick={() => selectTitleMutation.mutate(title.id)}
                      data-testid={`button-title-${title.id}`}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        isSelected
                          ? "bg-purple-600/50 border-purple-400/40 text-white"
                          : isUnlocked
                          ? "bg-[#1e1145]/60 border-purple-500/20 text-purple-300 hover:bg-purple-500/20"
                          : "bg-[#1e1145]/30 border-purple-500/10 text-purple-400/40 cursor-not-allowed"
                      }`}
                    >
                      {!isUnlocked && <Lock className="w-3 h-3 inline mr-1" />}
                      {title.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-purple-300/70 mb-3">Avatars</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {[1, 2, 3, 4, 5].map((id) => {
                  const isUnlocked = unlockedAvatars.includes(id);
                  const isSelected = profile?.chosenAvatarId === id;
                  return (
                    <button
                      key={id}
                      disabled={!isUnlocked}
                      onClick={() => selectAvatarMutation.mutate(id)}
                      className={`relative rounded-full transition-all ${
                        isSelected
                          ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-[#1a0a2e]"
                          : ""
                      } ${!isUnlocked ? "opacity-30" : "cursor-pointer"}`}
                      data-testid={`button-avatar-${id}`}
                    >
                      <img
                        src={AVATARS[id]}
                        alt={`Avatar ${id}`}
                        className="w-14 h-14 rounded-full overflow-hidden object-cover"
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-purple-400/50" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-purple-300/70 mb-3">Frames</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {[1, 2, 3, 4, 5].map((id) => {
                  const isUnlocked = unlockedFrames.includes(id);
                  const isSelected = profile?.chosenFrameId === id;
                  return (
                    <button
                      key={id}
                      disabled={!isUnlocked}
                      onClick={() => selectFrameMutation.mutate(id)}
                      className={`relative transition-all ${
                        isSelected
                          ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-[#1a0a2e] rounded-full"
                          : ""
                      } ${!isUnlocked ? "opacity-30" : "cursor-pointer"}`}
                      data-testid={`button-frame-${id}`}
                    >
                      <AvatarDisplay
                        avatarId={profile?.chosenAvatarId || 1}
                        frameId={id}
                        size={56}
                        profileImageUrl={user?.profileImageUrl}
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-purple-400/50" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Stats</h2>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-700/60 to-indigo-800/60 border border-purple-500/20 p-5" data-testid="card-total-points">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300/80 font-medium">Total Points</p>
                <p className="text-4xl font-bold text-yellow-400 mt-1" data-testid="text-points-value">{profile?.points ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-amber-600/60 to-orange-700/60 border border-orange-500/20 p-5" data-testid="card-coins">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-200/80 font-medium">Coins</p>
                <p className="text-4xl font-bold text-yellow-400 mt-1" data-testid="text-coins-value">{profile?.coins ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-teal-600/60 to-emerald-700/60 border border-teal-500/20 p-5" data-testid="card-accuracy">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-200/80 font-medium">Accuracy</p>
                <p className="text-4xl font-bold text-yellow-400 mt-1" data-testid="text-accuracy-value">{accuracy}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-teal-300" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
