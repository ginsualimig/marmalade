# Character Creation & Customization System

## Overview
Complete character creation flow for Marmalade game. Players create a hero at startup, customize appearance, and carry that character through battles.

## Files Created

### `/lib/game/characterState.ts`
Core character state management:
- **Types:**
  - `CharacterState`: name, gender (boy/girl), appearance customization
  - `AppearanceCategory`: hat, shirt, pants, shoes
  - `AppearanceOption`: emoji, label, id for each option

- **Appearance Options (5 per category):**
  - Hats: Wizard Hat, Crown, Cowboy, Beanie, Top Hat
  - Shirts: Star, Heart, Sparkle, Rainbow, Dragon
  - Pants: Blue Jeans, Purple, Rainbow, Sparkle, Striped
  - Shoes: Sneakers, Boots, Fancy, Magic Slippers, Rocket

- **Key Functions:**
  - `createCharacter(name, gender)` — Initialize new character with default look
  - `updateCharacterAppearance(character, category, optionId)` — Change appearance
  - `saveCharacter(character)` — Persist to localStorage
  - `loadCharacter()` — Restore from localStorage
  - `clearCharacter()` — Delete saved character
  - `getAppearanceEmoji(category, optionId)` — Retrieve emoji for display

## Files Modified

### `app/page.tsx`
- **Imports:** Added character state functions and types
- **Screen type:** Extended from `"title" | "battle" | "summary"` to include `"character-creation"`
- **Component state:**
  - `character: CharacterState | null` — current saved character
  - `charNameInput`, `charGender`, `charAppearance` — temp state during creation

- **New functions:**
  - `completeCharacterCreation()` — Finalize character, save, move to title
  - `editCharacter()` — Switch back to creation screen with loaded character

- **UI changes:**
  - Character creation screen (conditional on first load)
  - Character preview card on title screen (shows name + appearance)
  - Character display in battle (replaces default hero portrait)
  - Edit button to customize character later

### `styles/globals.css`
New CSS sections:
- `.character-creation-card` — Main form container
- `.char-form` — Layout for name, gender, appearance sections
- `.text-input` — Name input styling
- `.gender-buttons` — Boy/girl selection
- `.appearance-preview` — Live preview of character emoji stack
- `.appearance-category`, `.appearance-options`, `.appearance-btn` — Option selectors
- `.character-intro-card` — Title screen display
- `.character-battle-display`, `.char-battle-emojis` — Battle screen integration

## Game Flow

### First Launch
1. **Character Creation Screen**
   - User enters hero name (optional, defaults to "Hero")
   - Selects gender (boy/girl)
   - Picks appearance for each category (hat, shirt, pants, shoes)
   - Live emoji preview updates as selections change
   - "Create My Hero" button saves and moves to title

2. **Title Screen** (post-creation)
   - Character preview card shows name + 4 emoji layers (hat/shirt/pants/shoes)
   - "Edit Character" button allows customization later
   - Age band, learning level, and mode selection proceed as normal

3. **Battle Screen**
   - Left sprite shows character's custom appearance (emoji stack instead of default portrait)
   - Character name displays under sprite
   - All combat mechanics unchanged

### Persistence
- Character saved to `localStorage` under key `"marmalade-character"`
- Loaded on app startup; if present, skips creation screen
- Can be edited anytime from title screen
- No auto-delete; persists across sessions

## Customization & Extension Points

### Adding New Appearance Options
1. Update `APPEARANCE_OPTIONS` in `characterState.ts`
2. Add new `AppearanceOption` to any category (hat, shirt, pants, shoes)
3. Styles auto-adapt to new buttons

### Changing Default Appearance
In `characterState.ts`, modify `getDefaultAppearance()` to pick different defaults per gender or category.

### Styling Tweaks
- Character emoji sizes: adjust `.preview-emojis`, `.char-battle-emojis` font-sizes
- Button colors: modify `.appearance-btn`, `.gender-btn` backgrounds/borders
- Form width: change `max-width` on `.character-creation-card`

## Integration Notes

### For Battle Integration
- Character state is passed via React state to battle screen
- Battle component conditionally renders character emojis or default hero sprite:
  ```tsx
  {character ? (
    <div className="character-battle-display">
      {/* emoji stack */}
    </div>
  ) : (
    <div className="hero-portrait">...</div>
  )}
  ```

### For Resume / Checkpoint
- Character state is **not** saved in battle progress
- When resuming a battle, the same character persists in app state
- To link character to specific runs, store `character.id` in `RunSummary` (future enhancement)

### No Backend Required
- All state is client-side (localStorage)
- No API calls needed
- Works offline

## Testing Checklist

- [ ] First load shows character creation screen
- [ ] Name input accepts text (max 30 chars)
- [ ] Gender buttons toggle and select correctly
- [ ] Appearance options update preview emoji
- [ ] "Create My Hero" saves and navigates to title
- [ ] Title screen shows character card with correct emojis & name
- [ ] Battle screen displays character instead of default hero
- [ ] Character name shows under hero sprite
- [ ] Edit button returns to creation screen with current values
- [ ] Character persists after page refresh
- [ ] localStorage stores valid JSON

## Code Quality
- ✅ Self-contained in `characterState.ts`
- ✅ TypeScript-typed
- ✅ No external dependencies
- ✅ Follows existing code style (camelCase, React hooks, functional components)
- ✅ Builds without errors
