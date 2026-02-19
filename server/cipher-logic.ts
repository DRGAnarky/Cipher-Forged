export interface CipherModule {
  encrypt(input: string, options: CipherOptions): string;
  decrypt(input: string, options: CipherOptions): string;
  generateChallenge(difficulty?: number): Challenge;
  checkAnswer(expected: string, userAnswer: string): boolean;
}

export interface CipherOptions {
  shift?: number;
  keyword?: string;
}

export interface Challenge {
  type: "encrypt" | "decrypt";
  plaintext: string;
  ciphertext: string;
  shift: number;
  keyword?: string;
  hasPunctuation: boolean;
  cipherType: string;
}

const PHRASES = [
  "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
  "KNOWLEDGE IS POWER",
  "FORTUNE FAVORS THE BOLD",
  "ALL ROADS LEAD TO ROME",
  "ET TU BRUTE",
  "VENI VIDI VICI",
  "CARPE DIEM",
  "THE DIE IS CAST",
  "BEWARE THE IDES OF MARCH",
  "ALEA IACTA EST",
  "HISTORY REPEATS ITSELF",
  "ROME WAS NOT BUILT IN A DAY",
  "ACTIONS SPEAK LOUDER THAN WORDS",
  "EVERY CLOUD HAS A SILVER LINING",
  "A PENNY SAVED IS A PENNY EARNED",
  "KEEP YOUR FRIENDS CLOSE",
  "THE PEN IS MIGHTIER THAN THE SWORD",
  "CURIOSITY KILLED THE CAT",
  "LOOK BEFORE YOU LEAP",
  "STRIKE WHILE THE IRON IS HOT",
  "SEIZE THE DAY, PUT NO TRUST IN TOMORROW.",
  "IN WAR, TRUTH IS THE FIRST CASUALTY.",
  "GIVE ME LIBERTY, OR GIVE ME DEATH!",
  "THOSE WHO FORGET HISTORY ARE DOOMED TO REPEAT IT.",
  "THE ONLY THING WE HAVE TO FEAR IS FEAR ITSELF.",
  "I CAME, I SAW, I CONQUERED.",
  "THE UNEXAMINED LIFE IS NOT WORTH LIVING.",
  "TO BE, OR NOT TO BE?",
  "PATIENCE IS A VIRTUE.",
  "WISDOM BEGINS IN WONDER.",
];

const VIGENERE_KEYWORDS = [
  "CIPHER", "FORGE", "SECRET", "HIDDEN", "QUEST",
  "RAVEN", "STORM", "BLADE", "CROWN", "FLAME",
  "NIGHT", "STONE", "EAGLE", "IRON", "GOLD",
];

function caesarShift(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
  }
  return char;
}

function normalizeAnswer(s: string): string {
  return s.toUpperCase().replace(/[^A-Z]/g, "");
}

export const caesarCipher: CipherModule = {
  encrypt(input: string, options: CipherOptions): string {
    const shift = options.shift || 0;
    return input
      .toUpperCase()
      .split("")
      .map((c) => caesarShift(c, shift))
      .join("");
  },

  decrypt(input: string, options: CipherOptions): string {
    const shift = options.shift || 0;
    return input
      .toUpperCase()
      .split("")
      .map((c) => caesarShift(c, -shift))
      .join("");
  },

  generateChallenge(difficulty: number = 1): Challenge {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const shift = Math.floor(Math.random() * 25) + 1;
    const type: "encrypt" | "decrypt" = Math.random() > 0.5 ? "encrypt" : "decrypt";
    const ciphertext = caesarCipher.encrypt(phrase, { shift });
    const hasPunctuation = /[^A-Z\s]/.test(phrase);

    return { type, plaintext: phrase, ciphertext, shift, hasPunctuation, cipherType: "caesar" };
  },

  checkAnswer(expected: string, userAnswer: string): boolean {
    return normalizeAnswer(expected) === normalizeAnswer(userAnswer);
  },
};

export const atbashCipher: CipherModule = {
  encrypt(input: string, _options: CipherOptions): string {
    return input
      .toUpperCase()
      .split("")
      .map((c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(90 - (code - 65));
        }
        return c;
      })
      .join("");
  },

  decrypt(input: string, options: CipherOptions): string {
    return atbashCipher.encrypt(input, options);
  },

  generateChallenge(difficulty: number = 1): Challenge {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const type: "encrypt" | "decrypt" = Math.random() > 0.5 ? "encrypt" : "decrypt";
    const ciphertext = atbashCipher.encrypt(phrase, {});
    const hasPunctuation = /[^A-Z\s]/.test(phrase);

    return { type, plaintext: phrase, ciphertext, shift: 0, hasPunctuation, cipherType: "atbash" };
  },

  checkAnswer(expected: string, userAnswer: string): boolean {
    return normalizeAnswer(expected) === normalizeAnswer(userAnswer);
  },
};

export const vigenereCipher: CipherModule = {
  encrypt(input: string, options: CipherOptions): string {
    const keyword = (options.keyword || "KEY").toUpperCase();
    const text = input.toUpperCase();
    let keyIndex = 0;

    return text
      .split("")
      .map((c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          const shift = keyword.charCodeAt(keyIndex % keyword.length) - 65;
          keyIndex++;
          return String.fromCharCode(((code - 65 + shift) % 26) + 65);
        }
        return c;
      })
      .join("");
  },

  decrypt(input: string, options: CipherOptions): string {
    const keyword = (options.keyword || "KEY").toUpperCase();
    const text = input.toUpperCase();
    let keyIndex = 0;

    return text
      .split("")
      .map((c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          const shift = keyword.charCodeAt(keyIndex % keyword.length) - 65;
          keyIndex++;
          return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
        }
        return c;
      })
      .join("");
  },

  generateChallenge(difficulty: number = 1): Challenge {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const keyword = VIGENERE_KEYWORDS[Math.floor(Math.random() * VIGENERE_KEYWORDS.length)];
    const type: "encrypt" | "decrypt" = Math.random() > 0.5 ? "encrypt" : "decrypt";
    const ciphertext = vigenereCipher.encrypt(phrase, { keyword });
    const hasPunctuation = /[^A-Z\s]/.test(phrase);

    return { type, plaintext: phrase, ciphertext, shift: 0, keyword, hasPunctuation, cipherType: "vigenere" };
  },

  checkAnswer(expected: string, userAnswer: string): boolean {
    return normalizeAnswer(expected) === normalizeAnswer(userAnswer);
  },
};

export function getCipherModule(cipherName: string): CipherModule {
  const name = cipherName.toLowerCase();
  if (name.includes("atbash")) return atbashCipher;
  if (name.includes("vigen")) return vigenereCipher;
  return caesarCipher;
}
