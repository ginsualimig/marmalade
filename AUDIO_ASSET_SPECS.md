# Audio Asset Specifications – Marmalade Game

## Overview

This document specifies the audio assets required for Lane 5 (Audio & Coach Voice) implementation. All assets should be **production-ready**, normalized to loudness standards, and formatted for seamless Web Audio API integration.

---

## 1. BACKGROUND MUSIC LOOP

### Keeper's Theme Baseline

**Musical Parameters:**
- **Key:** C Major
- **Tempo:** 110 BPM (equivalent to 545ms per quarter note)
- **Time Signature:** 4/4
- **Duration:** 8–16 bars (16–32 seconds for natural loop)
- **Instrumentation:** Warm piano + ukulele (or similar warm acoustic blend)

**Vibe:**
- Calm, inviting, encouraging
- Never stressful or dramatic
- Background presence—not attention-grabbing during gameplay
- Loops seamlessly (fade-out at end must be subtle)

**Technical Specs:**
- **Format:** MP3 or AAC (m4a), 128 kbps bitrate minimum
- **Sample Rate:** 48 kHz
- **Loudness Target:** -18 LUFS (quiet enough to not distract during speech/SFX)
- **Fade:** 0.5s gentle fade-out before loop point to avoid clicks
- **File Path:** `/public/audio/music/keepers-theme-loop.m4a`
- **File Size:** ~100–150 KB for 30-second loop

**Composition Notes:**
- Use C, D, E, F, G, A, B scale degrees (no chromatic notes outside C Major)
- Avoid triplets or swing feel; keep it steady and grounded
- Piano plays melody in mid-range (C4–B4); ukulele adds harmonic warmth
- Bass notes on quarter notes at C3 or G3 for grounding
- Example bars:
  ```
  Bar 1: C-E-G | D-F-A | E-G-B | C-E-G (simple arpeggios)
  ```

---

## 2. SOUND EFFECTS (SFX)

### 2.1 Correct Answer

**Audio Signature:**
- **Frequency Range:** 800–1200 Hz (bright, upper-mid presence)
- **Frequency Characteristics:** Two-harmonic structure:
  - Primary: 1000 Hz (sine wave, clean)
  - Secondary: 1600 Hz (12 dB quieter, adds shimmer)
- **Loudness Target:** -8 LUFS (satisfying, audible, not loud)
- **Duration:** 0.4 seconds
- **Character:** Bright, harmonic, ascending sweep (like a "ding" or bell chime)
- **Emotional Intent:** "That's right! You got it!"

**Pitch Contour:**
```
1000 Hz → 1200 Hz (upward sweep over 0.4s)
1600 Hz → 1800 Hz (harmonic follows)
Attack: instant | Release: 0.05s exponential fade
```

**Production Approach (if recording):**
- Sine wave + harmonic sine blend
- Slight distortion/saturation optional (1–2 dB) for character
- No reverb; dry tone is fine (reverb adds in Web Audio if desired)

**File Path:** `/public/audio/sfx/correct-answer.m4a`
**File Size:** ~20–30 KB

---

### 2.2 Wrong Answer

**Audio Signature:**
- **Frequency Range:** 300–500 Hz (warm, lower-mid presence)
- **Frequency Characteristics:** Warm bongo-like tone:
  - Primary: 400 Hz (triangle or warm sawtooth)
  - Optional secondary: 200 Hz (bass support, -6 dB)
- **Loudness Target:** -10 LUFS (audible but softer than correct, not harsh)
- **Duration:** 0.35 seconds
- **Character:** Warm, descending bend (like a gentle bongo "thunk")
- **Emotional Intent:** "It's okay, try again. You're learning."

**Pitch Contour:**
```
400 Hz → 250 Hz (downward bend over 0.35s)
200 Hz supporting baseline (optional, for warmth)
Attack: instant | Release: 0.05s exponential fade
```

**Production Approach:**
- Triangle wave (warmer than sine) or light sawtooth
- Downward bend should feel gentle, not abrupt
- No metallic quality; avoid harsh overtones

**File Path:** `/public/audio/sfx/wrong-answer.m4a`
**File Size:** ~20–30 KB

---

### 2.3 State-Change SFX

#### Whoosh (Phase Transition)

**Use Case:** When entering a new level/boss phase

- **Frequency Range:** 600–350 Hz (descending sawtooth "sweep")
- **Duration:** 0.22 seconds
- **Loudness Target:** -12 LUFS
- **Character:** Fast, whooshing, directional (like air moving)
- **Pitch Contour:** 600 Hz → 250 Hz downward slide
- **File Path:** `/public/audio/sfx/whoosh-transition.m4a`

#### Shimmer (Power Level Up)

**Use Case:** When player levels up or unlocks new ability

- **Frequency Range:** 1200–1600 Hz (ascending shimmer)
- **Duration:** 0.28 seconds
- **Loudness Target:** -11 LUFS
- **Character:** Glittering, ascending, magical
- **Pitch Contour:** 1200 Hz → 1600 Hz upward sweep; add harmonic at 2400 Hz (quiet)
- **File Path:** `/public/audio/sfx/shimmer-powerup.m4a`

#### Lock-In Thunk (Boss Attack Wind-Up)

**Use Case:** Boss preparing to attack; signals urgency

- **Frequency Range:** 220–270 Hz (low, percussive)
- **Duration:** 0.18 seconds
- **Loudness Target:** -9 LUFS (slightly louder to command attention)
- **Character:** Deep, resonant thunk with subtle upward pitch rise
- **Pitch Contour:** 220 Hz → 270 Hz upward (like tension building)
- **File Path:** `/public/audio/sfx/boss-lockinthunk.m4a`

---

## 3. COACH VOICE

### Voice Character Brief

**Persona:**
- Warm adult mentor (uncle/aunt energy)
- Age: 35–55 years old
- Accent: Neutral, warm, clear diction
- Tempo: Slightly slower than normal speech (relaxed, deliberate)
- Tone: Encouraging, never condescending or patronizing

**Loudness Specification:**
- **Target:** -14 LUFS (integrated loudness)
- **True Peak:** -1.0 dBTP (no clipping)
- **Loudness Range (LRA):** 5–8 LU
- **Post-Production Requirement:** Normalize all voice clips to -14 LUFS using ITU-R BS.1770 loudness metering

**Technical Delivery:**
- **Format:** AAC (m4a) at 128 kbps, 48 kHz sample rate
- **Naming:** `coach-voice-{cue-name}.m4a`
- **Delivery Format:** Individual files per cue (don't concatenate into one file)

### Voice Cues

#### 1. **Encouragement**
**Text:** "Great effort! Let's keep going."
- **Duration:** 1.8 seconds
- **Pause After:** 500 ms (brief pause before next question)
- **Emotional Intent:** 
  - Acknowledge genuine effort; notice the work done
  - Like a coach seeing a player try hard, even if result wasn't perfect
  - Warmth + forward momentum ("Let's")
  - **Delivery:** Upbeat but grounded, not overly enthusiastic
- **File:** `/public/audio/coach-voice/encouragement.m4a`

#### 2. **Correction**
**Text:** "That's okay—let's try again. You've got this."
- **Duration:** 2.0 seconds
- **Pause After:** 800 ms (slightly longer, allow moment to recalibrate)
- **Emotional Intent:**
  - Normalize the mistake (it's okay)
  - Redirect gently ("let's try again")
  - Belief in capability ("You've got this")
  - **Delivery:** Slow, deliberate, reassuring. Like uncle/aunt saying "You can do hard things."
  - **Tone Safety:** Absolutely NO shame, frustration, or "I'm disappointed" undertone
- **File:** `/public/audio/coach-voice/correction.m4a`

#### 3. **Celebration**
**Text:** "YES! Fantastic!"
- **Duration:** 1.2 seconds
- **Pause After:** 300 ms (quick reset to next question)
- **Emotional Intent:**
  - Genuine joy and celebration
  - Like proud parent/mentor cheering success
  - Real emotion, not forced or sarcastic
  - **Delivery:** High energy, genuine surprise/delight
  - **Timing:** Brief "YES!" (0.4s), then "Fantastic!" (0.8s)
- **File:** `/public/audio/coach-voice/celebration.m4a`

#### 4. **Warmth**
**Text:** "You're doing amazing."
- **Duration:** 1.6 seconds
- **Pause After:** 600 ms (calming pause, builds confidence)
- **Emotional Intent:**
  - Simple, tender affirmation
  - Slow, deliberate delivery
  - Like someone saying "I see you, you're doing great"
  - Builds confidence for next challenge
  - **Delivery:** Warm, genuine, with slight pause between words: "You're... doing... amazing."
- **File:** `/public/audio/coach-voice/warmth.m4a`

---

## 4. DYNAMIC MIXING REQUIREMENTS

### Loudness Baseline
- **Music bed:** -18 LUFS (background, non-intrusive)
- **SFX correct:** -8 LUFS (satisfying, clear)
- **SFX wrong:** -10 LUFS (softer, constructive)
- **SFX state-change:** -9 to -12 LUFS (attention-getting but not jarring)
- **Coach voice:** -14 LUFS (clear, warm, centered)

### Ducking Hierarchy

**Priority Order (highest to lowest):**
1. **SFX** (short, critical feedback)
2. **Coach Voice** (learning/encouragement)
3. **Music** (background support)
4. **Ambient** (not implemented yet)

**Ducking Rules:**
- When **SFX plays**: Music ducks by 7 dB (0.2 relative gain), voice silent (0.6 gain)
- When **Voice plays**: Music ducks by 5 dB (0.31 relative gain)
- When only **Music plays**: Full mix level

**Implementation in Web Audio:**
All ducking handled in `lib/game/audio.ts` via `applyDucking()` and `updateMixLevels()` functions. No manual mixing needed in production audio files.

---

## 5. FILE ORGANIZATION

```
/public/audio/
├── music/
│   └── keepers-theme-loop.m4a
├── sfx/
│   ├── correct-answer.m4a
│   ├── wrong-answer.m4a
│   ├── whoosh-transition.m4a
│   ├── shimmer-powerup.m4a
│   └── boss-lockinthunk.m4a
└── coach-voice/
    ├── encouragement.m4a
    ├── correction.m4a
    ├── celebration.m4a
    └── warmth.m4a
```

---

## 6. RECORDING & PRODUCTION CHECKLIST

### Pre-Recording
- [ ] Book studio time (2–3 hours for all voice cues)
- [ ] Prepare voice talent with scripts + emotional intent cues
- [ ] Ensure quiet room (background noise < -80 dB)
- [ ] Use condenser microphone (Neumann, Shure, Sennheiser quality)

### Recording Session
- [ ] Do 2–3 takes of each cue for director to choose best
- [ ] Record each cue separately (don't daisy-chain)
- [ ] Leave 2–3 second silence before/after each take (for cleanup)

### Post-Production
- [ ] **Normalize loudness** to -14 LUFS ITU-R BS.1770 (use LUFS meter plugin)
- [ ] **Remove room noise** (spectral subtraction or gate)
- [ ] **EQ:** Add slight high-pass (80 Hz) to remove rumble; slight presence boost (2–4 kHz) for warmth
- [ ] **Compression:** Light ratio (2:1), attack 10 ms, release 100 ms (smooth, not squashed)
- [ ] **No reverb** (dry, intimate delivery preferred; Web Audio can add if needed)
- [ ] Export as AAC m4a, 128 kbps, 48 kHz

### SFX Production
- [ ] Generate or source each SFX clip per spec
- [ ] Apply gain normalization to match LUFS targets
- [ ] Ensure zero clipping (True Peak < -1 dBTP)
- [ ] Export as AAC m4a

### Music Production
- [ ] Compose/arrange Keeper's theme in C Major
- [ ] Record live piano + ukulele (or high-quality synthesis)
- [ ] Mix to -18 LUFS, loop seamlessly
- [ ] Do 2–3 variations (A, B, C) for future replayability
- [ ] Export as AAC m4a, 128 kbps

---

## 7. QUALITY GATES

### Audio Drives Emotion
- ✅ Correct answer SFX is **satisfying**: bright, uplifting, makes child *want* to get another right
- ✅ Wrong answer SFX is **constructive**: warm, never harsh; feels like gentle redirection
- ✅ Coach voice is **warm, never shame**: always supportive; child feels "seen" and believed in
- ✅ Music loop is **calm and inviting**: no anxiety; creates safe, encouraging space

### Technical Quality
- ✅ All assets delivered at target loudness (no manual gain adjustment in code)
- ✅ No clipping or distortion (True Peak < -1 dBTP)
- ✅ Seamless looping (music bed), zero clicks/pops
- ✅ Cross-browser compatible (AAC m4a supported on all modern browsers)

---

## 8. DELIVERY TIMELINE

| Milestone | Deadline | Owner |
|-----------|----------|-------|
| Voice casting finalized | [TBD] | Audio Director |
| SFX specs refined | [TBD] | Game Design |
| Recording session booked | [TBD] | Producer |
| Voice recordings completed | [TBD] | Voice Talent + Engineer |
| SFX generation/sourcing | [TBD] | Sound Designer |
| Music composition/recording | [TBD] | Composer |
| Post-production & normalization | [TBD] | Audio Engineer |
| All assets delivered & tested | [TBD] | QA + Integration |
| Lane 5 deployment | [TBD] | Release Manager |

---

## 9. TESTING CHECKLIST (QA)

- [ ] Music bed loops without click or gap
- [ ] Correct answer SFX plays on right answer (bright, satisfying)
- [ ] Wrong answer SFX plays on wrong answer (warm, constructive)
- [ ] Coach voice cues trigger contextually (encouragement, correction, celebration, warmth)
- [ ] Loudness hierarchy respected (SFX loud enough, voice clear, music doesn't drown speech)
- [ ] Ducking works: Music quiets during SFX/voice
- [ ] No simultaneous SFX clipping
- [ ] Cross-browser (Chrome, Safari, Firefox) audio playback successful
- [ ] Mobile (iOS Safari, Android Chrome) audio unlocks properly
- [ ] Parent can disable audio via settings toggle
- [ ] Audio doesn't autoplay (respects browser policies)

---

## 10. FUTURE ENHANCEMENTS

- **Boss-specific music variations** (Lyra theme vs. Orion theme)
- **Ambient background layer** (subtle wind, distant magic, etc.)
- **Victory fanfare** (celebratory music for boss defeat)
- **Defeat/game-over musical cue** (minor-key reworking of theme)
- **Combo milestone SFX** (5-combo, 10-combo, 25-combo special sounds)
- **Mobile haptics** (vibration on correct/boss attack for tactile feedback)

---

**Status:** Ready for audio production  
**Integration:** `lib/game/audio.ts` + `app/page.tsx` hooks  
**Quality Gate:** Audio drives emotion; correct answer is satisfying; coach voice never shames.
