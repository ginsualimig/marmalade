export type BossData = {
  name: string;
  maxHP: number;
  color: number;
  description: string;
};

export const BOSS_DEFINITIONS: BossData[] = [
  {
    name: "Queen Mischief Charlotte",
    maxHP: 140,
    color: 0xffb3de,
    description: "Toy dash charges, toy throws, jump slams, shield phase under 40%."
  },
  {
    name: "Captain Chaos George",
    maxHP: 180,
    color: 0x77d6ff,
    description: "Chaos spins, diagonal charges, goo puddles, meltdown under 40%."
  }
];
