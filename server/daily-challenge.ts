import { caesarCipher } from "./cipher-logic";

export type DailyChallengeType =
  | "speed_decrypt"
  | "reverse_engineer"
  | "missing_letters"
  | "blind_decrypt"
  | "chain_decode";

export type DailyDifficulty = "Easy" | "Medium" | "Hard";

export interface DailyChallengeInfo {
  type: DailyChallengeType;
  typeName: string;
  typeDescription: string;
  difficulty: DailyDifficulty;
  pointsReward: number;
  coinsReward: number;
  date: string;
}

export interface DailyChallengeData extends DailyChallengeInfo {
  challenges: DailyChallengeItem[];
}

export interface DailyChallengeItem {
  id: number;
  instruction: string;
  displayText: string;
  shift?: number;
  hint?: string;
  expectedAnswer: string;
  partialReveal?: string;
}

const CHALLENGE_TYPES: { type: DailyChallengeType; name: string; desc: string }[] = [
  { type: "speed_decrypt", name: "Speed Decrypt", desc: "Decode encrypted messages using the given shift" },
  { type: "reverse_engineer", name: "Reverse Engineer", desc: "Figure out the shift used to encrypt the message" },
  { type: "missing_letters", name: "Missing Letters", desc: "Fill in the missing letters of the decrypted message" },
  { type: "blind_decrypt", name: "Blind Decrypt", desc: "Decrypt the message without knowing the shift" },
  { type: "chain_decode", name: "Chain Decode", desc: "Solve a chain of short encrypted messages in sequence" },
];

const DIFFICULTIES: { diff: DailyDifficulty; points: number; coins: number }[] = [
  { diff: "Easy", points: 50, coins: 20 },
  { diff: "Medium", points: 100, coins: 40 },
  { diff: "Hard", points: 150, coins: 60 },
];

const SHORT_PHRASES = [
  "HELLO WORLD", "CARPE DIEM", "VENI VIDI VICI", "ET TU BRUTE",
  "SEIZE THE DAY", "FORTUNE FAVORS THE BOLD", "KNOWLEDGE IS POWER",
  "THE DIE IS CAST", "ALL ROADS LEAD TO ROME", "KEEP YOUR FRIENDS CLOSE",
  "LOOK BEFORE YOU LEAP", "PATIENCE IS A VIRTUE", "WISDOM BEGINS IN WONDER",
  "HISTORY REPEATS ITSELF", "ACTIONS SPEAK LOUDER THAN WORDS",
];

const MEDIUM_PHRASES = [
  "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
  "ROME WAS NOT BUILT IN A DAY",
  "EVERY CLOUD HAS A SILVER LINING",
  "A PENNY SAVED IS A PENNY EARNED",
  "THE PEN IS MIGHTIER THAN THE SWORD",
  "STRIKE WHILE THE IRON IS HOT",
  "CURIOSITY KILLED THE CAT",
  "THE UNEXAMINED LIFE IS NOT WORTH LIVING",
];

const HARD_PHRASES = [
  "SEIZE THE DAY, PUT NO TRUST IN TOMORROW.",
  "IN WAR, TRUTH IS THE FIRST CASUALTY.",
  "GIVE ME LIBERTY, OR GIVE ME DEATH!",
  "THOSE WHO FORGET HISTORY ARE DOOMED TO REPEAT IT.",
  "THE ONLY THING WE HAVE TO FEAR IS FEAR ITSELF.",
  "I CAME, I SAW, I CONQUERED.",
  "TO BE, OR NOT TO BE?",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPhrases(difficulty: DailyDifficulty, rng: () => number): string[] {
  const pool = difficulty === "Easy" ? SHORT_PHRASES : difficulty === "Medium" ? MEDIUM_PHRASES : HARD_PHRASES;
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled;
}

function getShiftForDifficulty(difficulty: DailyDifficulty, rng: () => number): number {
  if (difficulty === "Easy") return Math.floor(rng() * 5) + 1;
  if (difficulty === "Medium") return Math.floor(rng() * 12) + 3;
  return Math.floor(rng() * 20) + 5;
}

function createMissingLetters(plaintext: string, difficulty: DailyDifficulty, rng: () => number): string {
  const letters = plaintext.split("");
  const alphaIndices = letters.map((c, i) => /[A-Z]/.test(c) ? i : -1).filter(i => i !== -1);
  const removeRatio = difficulty === "Easy" ? 0.3 : difficulty === "Medium" ? 0.5 : 0.7;
  const removeCount = Math.floor(alphaIndices.length * removeRatio);
  const shuffled = [...alphaIndices].sort(() => rng() - 0.5);
  const toRemove = new Set(shuffled.slice(0, removeCount));
  return letters.map((c, i) => toRemove.has(i) ? "_" : c).join("");
}

export function getDailyChallengeInfo(dateStr?: string): DailyChallengeInfo {
  const today = dateStr || new Date().toISOString().split("T")[0];
  const seed = dateToSeed(today);
  const rng = seededRandom(seed);

  const typeIndex = Math.floor(rng() * CHALLENGE_TYPES.length);
  const diffIndex = Math.floor(rng() * DIFFICULTIES.length);

  const challengeType = CHALLENGE_TYPES[typeIndex];
  const difficulty = DIFFICULTIES[diffIndex];

  return {
    type: challengeType.type,
    typeName: challengeType.name,
    typeDescription: challengeType.desc,
    difficulty: difficulty.diff,
    pointsReward: difficulty.points,
    coinsReward: difficulty.coins,
    date: today,
  };
}

export function generateDailyChallenge(dateStr?: string): DailyChallengeData {
  const info = getDailyChallengeInfo(dateStr);
  const today = info.date;
  const seed = dateToSeed(today + "_challenge");
  const rng = seededRandom(seed);

  const phrases = getPhrases(info.difficulty, rng);
  const challenges: DailyChallengeItem[] = [];

  switch (info.type) {
    case "speed_decrypt": {
      const count = info.difficulty === "Easy" ? 3 : info.difficulty === "Medium" ? 4 : 5;
      for (let i = 0; i < count && i < phrases.length; i++) {
        const shift = getShiftForDifficulty(info.difficulty, rng);
        const ciphertext = caesarCipher.encrypt(phrases[i], { shift });
        challenges.push({
          id: i + 1,
          instruction: `Decrypt this message (Shift: ${shift})`,
          displayText: ciphertext,
          shift,
          expectedAnswer: phrases[i],
        });
      }
      break;
    }

    case "reverse_engineer": {
      const count = info.difficulty === "Easy" ? 3 : info.difficulty === "Medium" ? 4 : 5;
      for (let i = 0; i < count && i < phrases.length; i++) {
        const shift = getShiftForDifficulty(info.difficulty, rng);
        const ciphertext = caesarCipher.encrypt(phrases[i], { shift });
        challenges.push({
          id: i + 1,
          instruction: "What shift was used to encrypt this message?",
          displayText: `Original: ${phrases[i]}\nEncrypted: ${ciphertext}`,
          expectedAnswer: shift.toString(),
          hint: info.difficulty === "Easy" ? `The shift is between 1 and 5` : undefined,
        });
      }
      break;
    }

    case "missing_letters": {
      const count = info.difficulty === "Easy" ? 3 : info.difficulty === "Medium" ? 4 : 5;
      for (let i = 0; i < count && i < phrases.length; i++) {
        const shift = getShiftForDifficulty(info.difficulty, rng);
        const ciphertext = caesarCipher.encrypt(phrases[i], { shift });
        const partial = createMissingLetters(phrases[i], info.difficulty, rng);
        challenges.push({
          id: i + 1,
          instruction: `Decrypt and fill in the missing letters (Shift: ${shift})`,
          displayText: ciphertext,
          shift,
          partialReveal: partial,
          expectedAnswer: phrases[i],
        });
      }
      break;
    }

    case "blind_decrypt": {
      const count = info.difficulty === "Easy" ? 2 : info.difficulty === "Medium" ? 3 : 4;
      for (let i = 0; i < count && i < phrases.length; i++) {
        const shift = getShiftForDifficulty(info.difficulty, rng);
        const ciphertext = caesarCipher.encrypt(phrases[i], { shift });
        challenges.push({
          id: i + 1,
          instruction: "Decrypt this message — the shift is unknown!",
          displayText: ciphertext,
          expectedAnswer: phrases[i],
          hint: info.difficulty === "Easy" ? `Try shifts between 1 and 5` : info.difficulty === "Medium" ? "Try common shifts" : undefined,
        });
      }
      break;
    }

    case "chain_decode": {
      const shortPhrases = SHORT_PHRASES.sort(() => rng() - 0.5);
      const count = info.difficulty === "Easy" ? 4 : info.difficulty === "Medium" ? 5 : 6;
      for (let i = 0; i < count && i < shortPhrases.length; i++) {
        const shift = getShiftForDifficulty(info.difficulty, rng);
        const ciphertext = caesarCipher.encrypt(shortPhrases[i], { shift });
        challenges.push({
          id: i + 1,
          instruction: `Link ${i + 1}: Decrypt (Shift: ${shift})`,
          displayText: ciphertext,
          shift,
          expectedAnswer: shortPhrases[i],
        });
      }
      break;
    }
  }

  return { ...info, challenges };
}
