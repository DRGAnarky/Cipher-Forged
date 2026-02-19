import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "THIS IS A SECRET MESSAGE",
  "WELCOME TO THE FORGE",
  "BREAK THE CODE WITHIN",
  "KNOWLEDGE IS YOUR WEAPON",
  "THE CIPHER AWAITS YOU",
  "DECODE THE HIDDEN TRUTH",
  "SECRETS LIE IN LETTERS",
  "EVERY CODE HAS A KEY",
  "TRUST NO UNVERIFIED TEXT",
  "THE TRUTH IS ENCRYPTED",
  "ONLY THE WISE SURVIVE",
  "CRACK THE ANCIENT CODE",
  "POWER THROUGH KNOWLEDGE",
  "SILENCE HIDES THE ANSWER",
  "SHIFT YOUR PERSPECTIVE",
  "PATTERNS REVEAL SECRETS",
  "FORGE YOUR OWN PATH",
  "DECIPHER YOUR DESTINY",
  "LETTERS HOLD THE POWER",
  "NOTHING IS AS IT SEEMS",
  "SEEK AND YOU WILL FIND",
  "THE KEY UNLOCKS ALL",
  "WORDS ARE YOUR SHIELD",
  "MASTER THE HIDDEN ARTS",
  "CODES RULE THE WORLD",
  "THINK BEFORE YOU SHIFT",
  "SHADOWS SPEAK IN CODE",
  "UNRAVEL THE MYSTERY",
  "VICTORY THROUGH CIPHER",
  "THE FORGE NEVER SLEEPS",
  "READ BETWEEN THE LINES",
  "ENCRYPT YOUR THOUGHTS",
  "LEGENDS ARE BORN HERE",
  "SHARPEN YOUR MIND DAILY",
  "A CIPHER NEVER LIES",
  "FIND THE HIDDEN PATTERN",
  "DECODE OR BE DECODED",
  "WISDOM FORGED IN FIRE",
  "THE ALPHABET IS A TOOL",
  "CHALLENGE ACCEPTED AGENT",
  "NO CODE IS UNBREAKABLE",
  "EVERY LETTER MATTERS",
  "EYES SEE WHAT MINDS MISS",
  "BORN TO BREAK CIPHERS",
  "THE MESSAGE IS THE KEY",
  "LIGHT REVEALS THE PATH",
  "GUARD YOUR SECRETS WELL",
  "CIPHERS SHAPE HISTORY",
  "ENTER THE CRYPTIC REALM",
  "YOUR JOURNEY BEGINS NOW",
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function caesarEncrypt(text: string, shift: number): string {
  return text
    .split("")
    .map((ch) => {
      if (ch === " ") return " ";
      const code = ch.charCodeAt(0) - 65;
      return String.fromCharCode(((code + shift) % 26) + 65);
    })
    .join("");
}

function pickRandom(): { plain: string; cipher: string } {
  const idx = Math.floor(Math.random() * MESSAGES.length);
  const plain = MESSAGES[idx];
  const shift = Math.floor(Math.random() * 20) + 3;
  return { plain, cipher: caesarEncrypt(plain, shift) };
}

export function DecryptAnimation({ onComplete }: { onComplete: () => void }) {
  const chosen = useMemo(() => pickRandom(), []);
  const [displayText, setDisplayText] = useState(chosen.cipher);
  const [phase, setPhase] = useState<"cipher" | "morphing" | "done">("cipher");
  const [progress, setProgress] = useState(0);
  const hasStarted = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const timer = setTimeout(() => {
      setPhase("morphing");
      let frame = 0;
      const totalFrames = 40;

      const interval = setInterval(() => {
        frame++;
        const pct = frame / totalFrames;
        setProgress(pct);

        const result = chosen.plain
          .split("")
          .map((targetChar, i) => {
            if (targetChar === " ") return " ";
            if (pct > (i / chosen.plain.length) * 0.8 + 0.2) {
              return targetChar;
            }
            return CHARS[Math.floor(Math.random() * 26)];
          })
          .join("");

        setDisplayText(result);

        if (frame >= totalFrames) {
          clearInterval(interval);
          setDisplayText(chosen.plain);
          setPhase("done");
          setTimeout(() => onCompleteRef.current(), 800);
        }
      }, 60);
    }, 1200);

    return () => clearTimeout(timer);
  }, [chosen]);

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className="font-mono text-2xl sm:text-3xl md:text-4xl tracking-widest text-center leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {displayText.split("").map((char, i) => (
          <motion.span
            key={i}
            className={
              phase === "done"
                ? "text-primary font-bold"
                : phase === "morphing"
                  ? "text-foreground/80"
                  : "text-muted-foreground"
            }
            animate={
              phase === "morphing"
                ? { opacity: [0.5, 1, 0.5] }
                : {}
            }
            transition={{ duration: 0.15, repeat: phase === "morphing" ? Infinity : 0 }}
          >
            {char}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        className="w-64 h-1 bg-muted rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "morphing" ? 1 : 0 }}
      >
        <motion.div
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>

      <AnimatePresence>
        {phase === "done" && (
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Decryption complete
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
