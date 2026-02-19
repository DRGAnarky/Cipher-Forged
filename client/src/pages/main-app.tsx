import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarDisplay } from "@/components/avatar-display";
import { DailyLoginModal } from "@/components/daily-login-modal";
import {
  Shield,
  Coins,
  Zap,
  Lock,
  Unlock,
  BookOpen,
  Swords,
  Trophy,
  User as UserIcon,
  LogOut,
  Check,
  Clock,
  Flame,
  Star,
  Menu,
  X,
  Home,
  Skull,
  Target,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export default function MainAppPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dailyModal, setDailyModal] = useState<{
    open: boolean;
    coins: number;
    streak: number;
    bonus: number;
  }>({ open: false, coins: 0, streak: 0, bonus: 0 });

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/me"],
    enabled: isAuthenticated,
  });

  const { data: ciphersData, isLoading: ciphersLoading } = useQuery<any>({
    queryKey: ["/api/ciphers"],
    enabled: isAuthenticated,
  });

  const { data: dailyInfo } = useQuery<any>({
    queryKey: ["/api/daily-challenge"],
    enabled: isAuthenticated,
  });

  const { data: storyCompletions } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/story/completions"],
    enabled: isAuthenticated,
  });

  const dailyClaimMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/daily/claim"),
    onSuccess: async (res) => {
      const data = await res.json();
      if (data.claimed) {
        setDailyModal({
          open: true,
          coins: data.coinsAwarded,
          streak: data.streakCount,
          bonus: data.streakBonus,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      }
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (args: { cipherId: number; method: string }) =>
      apiRequest("POST", `/api/ciphers/${args.cipherId}/unlock`, { method: args.method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ciphers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    },
  });

  useEffect(() => {
    if (isAuthenticated && profile && !dailyClaimMutation.isPending) {
      dailyClaimMutation.mutate();
    }
  }, [isAuthenticated, profile?.userId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || profileLoading) {
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

  const ciphers = ciphersData || [];
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] relative overflow-x-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-96 right-0 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-purple-700/15 blur-3xl rounded-full pointer-events-none" />

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#1a0a2e] border-r border-purple-500/20 z-50 flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between gap-2 p-4 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CF</span>
                  </div>
                  <span className="text-white font-bold text-lg">Cipher Forged</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-purple-300 hover:text-white transition-colors"
                  data-testid="button-close-drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    avatarId={profile?.chosenAvatarId || 1}
                    frameId={profile?.chosenFrameId || 1}
                    size={44}
                    profileImageUrl={user?.profileImageUrl}
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">{user?.firstName || "Agent"}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {profile?.coins ?? 0}
                      </span>
                      <span className="text-purple-300 text-xs flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {profile?.points ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-3 space-y-1">
                <button
                  onClick={() => { setDrawerOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-purple-200 hover:bg-purple-500/20 hover:text-white transition-colors"
                  data-testid="button-nav-main"
                >
                  <Home className="w-4 h-4" />
                  <span className="text-sm font-medium">Main</span>
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setLocation("/profile"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-purple-200 hover:bg-purple-500/20 hover:text-white transition-colors"
                  data-testid="button-profile"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Profile</span>
                </button>
                <a
                  href="/api/logout"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-purple-200 hover:bg-purple-500/20 hover:text-white transition-colors"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout / Switch Account</span>
                </a>
              </nav>

              <div className="p-4 border-t border-purple-500/20">
                <ThemeToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 bg-[#1a0a2e]/90 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-purple-300 hover:text-white transition-colors"
              data-testid="button-hamburger"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">CF</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight hidden sm:inline">Cipher Forged</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm" data-testid="text-coins">{profile?.coins ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 font-semibold text-sm" data-testid="text-points">{profile?.points ?? 0}</span>
            </div>
            {(profile?.streakCount ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-orange-400 font-medium text-sm" data-testid="text-streak">{profile?.streakCount}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <AvatarDisplay
              avatarId={profile?.chosenAvatarId || 1}
              frameId={profile?.chosenFrameId || 1}
              size={48}
              profileImageUrl={user?.profileImageUrl}
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white" data-testid="text-welcome">
                Welcome back, {user?.firstName || "Agent"}
              </h1>
              <p className="text-sm text-purple-300/70">Ready to forge some ciphers?</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-0 no-default-hover-elevate no-default-active-elevate">
                  <Target className="w-3 h-3 mr-1" />
                  Daily Challenge
                </Badge>
                <Badge className={`${dailyInfo?.difficulty === "Easy" ? "bg-green-500/30" : dailyInfo?.difficulty === "Medium" ? "bg-yellow-500/30" : "bg-red-500/30"} text-white border-0 no-default-hover-elevate no-default-active-elevate`}>
                  {dailyInfo?.difficulty || "..."}
                </Badge>
                {dailyInfo?.completed && (
                  <Badge className="bg-green-500/30 text-green-200 border-0 no-default-hover-elevate no-default-active-elevate">
                    <Check className="w-3 h-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mb-1" data-testid="text-daily-title">
                {dailyInfo?.typeName || "Daily Challenge"}
              </h3>
              <p className="text-white/80 text-sm mb-3" data-testid="text-daily-desc">
                {dailyInfo?.typeDescription || "Loading today's challenge..."}
              </p>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-sm" data-testid="text-daily-points">{dailyInfo?.pointsReward || 0} pts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-200" />
                  <span className="text-white font-semibold text-sm" data-testid="text-daily-coins">{dailyInfo?.coinsReward || 0} coins</span>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 font-semibold no-default-hover-elevate"
                onClick={() => setLocation("/daily-challenge")}
                disabled={dailyInfo?.completed}
                data-testid="button-daily-challenge"
              >
                {dailyInfo?.completed ? "Completed Today" : "Start Today's Challenge"}
                {!dailyInfo?.completed && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Choose Your Cipher</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ciphersLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-[#1e1145]/80 border border-purple-500/20 p-5 animate-pulse">
                    <div className="h-6 bg-purple-500/20 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-purple-500/20 rounded w-full mb-2" />
                    <div className="h-9 bg-purple-500/20 rounded w-full mt-4" />
                  </div>
                ))
              : ciphers.map((cipher: any, index: number) => (
                  <CipherCard
                    key={cipher.id}
                    cipher={cipher}
                    profile={profile}
                    index={index}
                    onUnlock={(method: string) =>
                      unlockMutation.mutate({ cipherId: cipher.id, method })
                    }
                    isUnlocking={unlockMutation.isPending}
                    onPlay={() => setLocation(`/endless/${cipher.id}`)}
                    onStory={() => setLocation(`/story/${cipher.id}/chapters`)}
                    storyComplete={!!(storyCompletions && storyCompletions[cipher.id])}
                  />
                ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Swords className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Game Modes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#1e1145]/80 border border-purple-500/20 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-md bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Endless Mode</h3>
                  <p className="text-xs text-purple-300/60">Infinite challenges, climb the streak</p>
                </div>
              </div>
              <p className="text-sm text-purple-300/70 mb-2">
                Complete a cipher's story to unlock Endless Mode for it. Solve as many challenges as you can and climb the streak.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {ciphers
                  .filter((c: any) => c.isUnlocked)
                  .map((c: any) => {
                    const isStoryDone = !!(storyCompletions && storyCompletions[c.id]);
                    return isStoryDone ? (
                      <Button
                        key={c.id}
                        variant="outline"
                        size="sm"
                        className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                        onClick={() => setLocation(`/endless/${c.id}`)}
                        data-testid={`button-endless-${c.id}`}
                      >
                        {c.name}
                      </Button>
                    ) : (
                      <Button
                        key={c.id}
                        variant="outline"
                        size="sm"
                        className="border-purple-500/10 text-purple-400/40 cursor-not-allowed"
                        disabled
                        data-testid={`button-endless-locked-${c.id}`}
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        {c.name}
                      </Button>
                    );
                  })}
                {ciphers.filter((c: any) => c.isUnlocked).length === 0 && (
                  <p className="text-xs text-purple-300/50">Unlock a cipher to play</p>
                )}
              </div>
              <p className="text-[10px] text-purple-400/40 mt-2">
                Complete each cipher's story tutorial to unlock its Endless Mode
              </p>
            </div>

            <div className="rounded-xl bg-[#1e1145]/80 border border-purple-500/20 p-5 relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-md bg-red-500/20 flex items-center justify-center">
                  <Skull className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white">Brutal Mode</h3>
                  <Badge className="bg-purple-500/30 text-purple-300 border-0 no-default-hover-elevate no-default-active-elevate">Coming Soon</Badge>
                </div>
              </div>
              <p className="text-sm text-purple-300/70 mb-3">
                One life. No hints. Maximum difficulty. Only the strongest codebreakers survive.
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                <p className="text-xs text-red-300/80 font-medium mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  Uses ALL released ciphers — study them before attempting!
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ciphers
                    .filter((c: any) => c.isReleased)
                    .map((c: any) => (
                      <span
                        key={c.id}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          c.isUnlocked
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                        data-testid={`brutal-cipher-${c.id}`}
                      >
                        {c.isUnlocked ? "\u2713" : "\u2717"} {c.name}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#1e1145]/80 border border-purple-500/20 p-5 relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-md bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white">Timed Mode</h3>
                  <Badge className="bg-purple-500/30 text-purple-300 border-0 no-default-hover-elevate no-default-active-elevate">Coming Soon</Badge>
                </div>
              </div>
              <p className="text-sm text-purple-300/70">
                Race against the clock to decode messages before time runs out.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-purple-500/20 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-purple-400/60 text-xs">&copy; 2027 Dead Rites Gaming</p>
        </div>
      </footer>

      <DailyLoginModal
        isOpen={dailyModal.open}
        onClose={() => setDailyModal((m) => ({ ...m, open: false }))}
        coinsAwarded={dailyModal.coins}
        streakCount={dailyModal.streak}
        streakBonus={dailyModal.bonus}
      />
    </div>
  );
}

function CipherCard({
  cipher,
  profile,
  index,
  onUnlock,
  isUnlocking,
  onPlay,
  onStory,
  storyComplete,
}: {
  cipher: any;
  profile: any;
  index: number;
  onUnlock: (method: string) => void;
  isUnlocking: boolean;
  onPlay: () => void;
  onStory: () => void;
  storyComplete: boolean;
}) {
  const isComingSoon = !cipher.isReleased;
  const isLocked = cipher.isReleased && !cipher.isUnlocked;
  const isUnlocked = cipher.isUnlocked;
  const canAfford = (profile?.coins ?? 0) >= cipher.baseUnlockCost;
  const hasToken = (profile?.freeUnlockTokens ?? 0) > 0;
  const endlessLocked = !storyComplete;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div
        className={`rounded-xl bg-[#1e1145]/80 border border-purple-500/20 p-5 ${isComingSoon ? "opacity-50" : ""}`}
        data-testid={`cipher-card-${cipher.id}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {isLocked && <Lock className="w-4 h-4 text-purple-400/60" />}
            {isUnlocked && <Unlock className="w-4 h-4 text-green-400" />}
            <h3 className="font-bold text-base text-white">{cipher.name}</h3>
          </div>
          {isComingSoon && (
            <Badge className="bg-purple-500/30 text-purple-300 border-0 no-default-hover-elevate no-default-active-elevate">Coming Soon</Badge>
          )}
          {isLocked && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 no-default-hover-elevate no-default-active-elevate">
              <Lock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          )}
          {isUnlocked && (
            <Badge className="bg-green-500/20 text-green-400 border-0 no-default-hover-elevate no-default-active-elevate">
              Available
            </Badge>
          )}
        </div>

        <p className="text-sm text-purple-300/70 mb-4 line-clamp-2">
          {cipher.description || "A classic substitution cipher"}
        </p>

        {isUnlocked && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 no-default-hover-elevate"
                onClick={onStory}
                data-testid={`button-story-${cipher.id}`}
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                {storyComplete ? "Story (Complete)" : "Story"}
              </Button>
              {storyComplete ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                  onClick={onPlay}
                  data-testid={`button-play-${cipher.id}`}
                >
                  <Swords className="w-3.5 h-3.5 mr-1.5" />
                  Endless
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-500/10 text-purple-400/40 cursor-not-allowed"
                  disabled
                  data-testid={`button-play-locked-${cipher.id}`}
                >
                  <Lock className="w-3 h-3 mr-1.5" />
                  Endless
                </Button>
              )}
            </div>
            {endlessLocked && (
              <p className="text-[10px] text-purple-400/50 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Complete all story chapters to unlock Endless Mode
              </p>
            )}
          </div>
        )}

        {isLocked && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 no-default-hover-elevate"
              onClick={() => onUnlock("coins")}
              disabled={!canAfford || isUnlocking}
              data-testid={`button-unlock-coins-${cipher.id}`}
            >
              <Coins className="w-3.5 h-3.5 mr-1.5" />
              {cipher.baseUnlockCost} Coins
            </Button>
            {hasToken && (
              <Button
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                onClick={() => onUnlock("token")}
                disabled={isUnlocking}
                data-testid={`button-unlock-token-${cipher.id}`}
              >
                Free Token
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
