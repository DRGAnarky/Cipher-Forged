import sigilBabyShift from "@/assets/sigils/sigil-baby-shift.png";
import sigilTutorial from "@/assets/sigils/sigil-tutorial.png";
import sigilCoin from "@/assets/sigils/sigil-coin.png";
import sigilStreak from "@/assets/sigils/sigil-streak.png";
import sigilTarget from "@/assets/sigils/sigil-target.png";
import sigilKeyboard from "@/assets/sigils/sigil-keyboard.png";
import sigilGrind from "@/assets/sigils/sigil-grind.png";
import sigilFlame from "@/assets/sigils/sigil-flame.png";
import sigilPunctuation from "@/assets/sigils/sigil-punctuation.png";
import sigilWallet from "@/assets/sigils/sigil-wallet.png";
import sigilToken from "@/assets/sigils/sigil-token.png";
import sigilRitual from "@/assets/sigils/sigil-ritual.png";
import sigilChain from "@/assets/sigils/sigil-chain.png";
import sigilFurnace from "@/assets/sigils/sigil-furnace.png";
import sigilPerfect from "@/assets/sigils/sigil-perfect.png";
import sigilArchitect from "@/assets/sigils/sigil-architect.png";
import sigilMoon from "@/assets/sigils/sigil-moon.png";
import sigilSpeedrun from "@/assets/sigils/sigil-speedrun.png";
import sigilCrown from "@/assets/sigils/sigil-crown.png";
import sigilAncient from "@/assets/sigils/sigil-ancient.png";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar4 from "@/assets/avatars/avatar-4.png";
import avatar5 from "@/assets/avatars/avatar-5.png";

import frame1 from "@/assets/frames/frame-1.png";
import frame2 from "@/assets/frames/frame-2.png";
import frame3 from "@/assets/frames/frame-3.png";
import frame4 from "@/assets/frames/frame-4.png";
import frame5 from "@/assets/frames/frame-5.png";

export const SIGILS: Record<string, string> = {
  "sigil-baby-shift": sigilBabyShift,
  "sigil-tutorial": sigilTutorial,
  "sigil-coin": sigilCoin,
  "sigil-streak": sigilStreak,
  "sigil-target": sigilTarget,
  "sigil-keyboard": sigilKeyboard,
  "sigil-grind": sigilGrind,
  "sigil-flame": sigilFlame,
  "sigil-punctuation": sigilPunctuation,
  "sigil-wallet": sigilWallet,
  "sigil-token": sigilToken,
  "sigil-ritual": sigilRitual,
  "sigil-chain": sigilChain,
  "sigil-furnace": sigilFurnace,
  "sigil-perfect": sigilPerfect,
  "sigil-architect": sigilArchitect,
  "sigil-moon": sigilMoon,
  "sigil-speedrun": sigilSpeedrun,
  "sigil-crown": sigilCrown,
  "sigil-ancient": sigilAncient,
};

export const AVATARS: Record<number, string> = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
};

export const FRAMES: Record<number, string> = {
  1: frame1,
  2: frame2,
  3: frame3,
  4: frame4,
  5: frame5,
};

export const TITLE_LIST = [
  { id: 1, name: "Fresh Cipher", condition: "default" },
  { id: 2, name: "Caesar's Apprentice", condition: "finish_caesar_ch1" },
  { id: 3, name: "Point Hunter", condition: "200_points" },
  { id: 4, name: "Streak Master", condition: "7_day_streak" },
  { id: 5, name: "Cipher Legend", condition: "1000_points" },
];
