import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { DecryptAnimation } from "@/components/decrypt-animation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, Lock, BookOpen, Calendar, Coins, LogOut } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function WelcomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [decryptDone, setDecryptDone] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !animationStarted) {
      setAnimationStarted(true);
    }
  }, [isAuthenticated, animationStarted]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a2e]">
        <motion.div
          className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0520] relative overflow-hidden text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -right-1/4 w-[700px] h-[700px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-purple-800/20 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          <span className="font-bold text-lg tracking-tight text-white">Cipher Forged</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div
              key="logged-out"
              className="text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                  <Lock className="w-10 h-10 text-purple-400" />
                </div>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3 text-white">
                Cipher <span className="text-purple-400">Forged</span>
              </h1>

              <motion.p
                className="text-purple-300/70 mb-8 text-base sm:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Master the Ancient Art of Cryptography
              </motion.p>

              <motion.div
                className="bg-[#1e1145]/60 border border-purple-500/20 rounded-md p-5 mb-6 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs text-purple-400/60 uppercase tracking-widest mb-2">Encrypted Message</p>
                <p className="font-mono text-lg sm:text-xl text-purple-200/80 tracking-widest">
                  XLMW MW E WIGVIX...
                </p>
              </motion.div>

              <motion.p
                className="text-purple-300/50 mb-6 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Sign in to unlock the message
              </motion.p>

              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <a href="/api/login">
                  <Button
                    size="lg"
                    variant="outline"
                    data-testid="button-login"
                    className="bg-white text-gray-800 border-white/20"
                  >
                    <SiGoogle className="w-4 h-4" style={{ color: "#4285F4" }} />
                    Sign in with Google
                  </Button>
                </a>
              </motion.div>

              <motion.div
                className="mt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-lg font-semibold text-purple-200 mb-6">Begin Your Journey</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                  {[
                    { icon: BookOpen, title: "Learn", desc: "Classic Ciphers" },
                    { icon: Calendar, title: "Daily", desc: "Challenges" },
                    { icon: Coins, title: "Earn", desc: "Points & Coins" },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="bg-[#1e1145]/80 border border-purple-500/20 rounded-md p-4 text-center"
                    >
                      <item.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="text-xs text-purple-300/50">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="logged-in"
              className="text-center max-w-xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h1
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Welcome, <span className="text-purple-400">{user?.firstName || "Agent"}</span>
              </motion.h1>

              <div className="mb-10">
                <DecryptAnimation onComplete={() => setDecryptDone(true)} />
              </div>

              <AnimatePresence>
                {decryptDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <a href="/app">
                      <Button
                        size="lg"
                        data-testid="button-enter-app"
                        className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                      >
                        Enter the Forge
                      </Button>
                    </a>
                    <a
                      href="/api/logout"
                      className="flex items-center gap-1.5 text-purple-400/60 hover:text-purple-300 text-xs transition-colors"
                      data-testid="link-switch-account"
                    >
                      <LogOut className="w-3 h-3" />
                      Switch Account
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
