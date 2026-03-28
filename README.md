# Marmalade: Tiny Guardian Boss Rush

A playful Phaser-powered mini boss rush built with Next.js. Charlotte and George test reflexes, combos, and math smarts as you balance movement, attacks, and educational pickups.

## Local setup

```bash
npm install
npm run dev    # start locally on http://localhost:3000
npm run build  # verify the production build
```

## Codex-only note

This repository was bootstrapped, coded, and documented exclusively with OpenAI Codex models (`openai-codex/gpt-5.1-codex-mini`, escalating to `openai-codex/gpt-5.1-codex-max` only when necessary) per project constraints.

## Playable hints

- Use keyboard (arrows + Z/X/C) or the on-screen touch controls.
- The bosses rotate between Charlotte (shield + toys) and George (spin + puddles).
- Follow the HUD word challenge: collect letter orbs in order to spell the featured word for MP and score boosts while avoiding words that start with the highlighted dodge letter.
- Pick numbers ≥ the displayed target to keep combos healthy, then line up your score with the math gate equation before you run through it; matching the sum keeps combos rolling, missing it scrapes HP.
