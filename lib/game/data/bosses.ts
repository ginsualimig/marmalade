export type BossData = {
  name: string;
  maxHP: number;
  color: number;
  description: string;
};

export const BOSS_DEFINITIONS: BossData[] = [
  {
    name: "Charlotte",
    maxHP: 140,
    color: 0xffb3de,
    description: "Dash charges, toy throws, jump slams, shield phase under 40%."
  },
  {
    name: "George",
    maxHP: 180,
    color: 0x77d6ff,
    description: "Tantrum spin, diagonal charges, drool puddles, meltdown under 40%."
  }
];
