export type BossData = {
  name: string;
  maxHP: number;
  color: number;
  description: string;
};

export const BOSS_DEFINITIONS: BossData[] = [
  {
    name: "Moonlight Manticore Lyra",
    maxHP: 140,
    color: 0xffb3de,
    description: "Moon dash charges, stardust orbs, jump slams, moon shield under 40%."
  },
  {
    name: "Starwhirl Kraken Orion",
    maxHP: 180,
    color: 0x77d6ff,
    description: "Tide spins, diagonal surges, mist puddles, whirlpool surge under 40%."
  }
];
