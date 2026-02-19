export interface CipherModule {
  encrypt(input: string, options: { shift: number }): string;
  decrypt(input: string, options: { shift: number }): string;
  generateChallenge(difficulty?: number): {
    type: "encrypt" | "decrypt";
    plaintext: string;
    ciphertext: string;
    shift: number;
    hasPunctuation: boolean;
  };
  checkAnswer(expected: string, userAnswer: string): boolean;
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
  "SEIZE THE DAY, PUT NO TRUST IN TOMORROW",
  "IN WAR, TRUTH IS THE FIRST CASUALTY",
  "GIVE ME LIBERTY, OR GIVE ME DEATH!",
  "THOSE WHO FORGET HISTORY ARE DOOMED TO REPEAT IT.",
  "THE ONLY THING WE HAVE TO FEAR IS FEAR ITSELF.",
  "I CAME, I SAW, I CONQUERED.",
  "THE UNEXAMINED LIFE IS NOT WORTH LIVING.",
  "TO BE, OR NOT TO BE?",
  "PATIENCE IS A VIRTUE.",
  "WISDOM BEGINS IN WONDER.",
];

function caesarShift(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
  }
  return char;
}

export const caesarCipher: CipherModule = {
  encrypt(input: string, options: { shift: number }): string {
    const normalized = input.toUpperCase();
    return normalized
      .split("")
      .map((c) => caesarShift(c, options.shift))
      .join("");
  },

  decrypt(input: string, options: { shift: number }): string {
    const normalized = input.toUpperCase();
    return normalized
      .split("")
      .map((c) => caesarShift(c, -options.shift))
      .join("");
  },

  generateChallenge(difficulty: number = 1) {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const shift = Math.floor(Math.random() * 25) + 1;
    const type = Math.random() > 0.5 ? "encrypt" : "decrypt";
    const ciphertext = caesarCipher.encrypt(phrase, { shift });
    const hasPunctuation = /[^A-Z\s]/.test(phrase);

    return {
      type: type as "encrypt" | "decrypt",
      plaintext: phrase,
      ciphertext,
      shift,
      hasPunctuation,
    };
  },

  checkAnswer(expected: string, userAnswer: string): boolean {
    const normalize = (s: string) => s.toUpperCase().trim();
    return normalize(expected) === normalize(userAnswer);
  },
};
