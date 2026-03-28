# Character Creation — Quick Reference

## Summary of Changes

### New Files
1. **`lib/game/characterState.ts`** (4.0 KB)
   - Character state management, persistence, appearance options
   - Exports: types, functions, appearance presets

### Modified Files
1. **`app/page.tsx`** — Added character flow
   - Imports character functions
   - Screen type includes "character-creation"
   - Component state for character + form inputs
   - Character display on title & battle screens
   
2. **`styles/globals.css`** — Added character CSS (~220 lines)
   - Form styling (name input, gender buttons, appearance grid)
   - Character preview & display styles
   - Battle screen character sprite styling

## Key Integration Points

### State Flow
```
Initial Load
  ├─ localStorage has character?
  │  ├─ Yes → load it, skip to title screen
  │  └─ No → show character creation
  └─ Create Character
     ├─ Name + Gender (required)
     ├─ Appearance (5 options × 4 categories = 20 combinations)
     └─ Save to localStorage, show title screen
```

### Rendering
- **Title**: Character card with name + 4 emoji layers
- **Battle**: Character emoji stack in left sprite area (replaces default hero portrait)
- **Edit**: Button on title screen → back to creation with pre-filled form

## Storage
- **Key**: `marmalade-character`
- **Format**: JSON `{ name, gender, appearance: { hat, shirt, pants, shoes } }`
- **Scope**: localStorage (browser, no backend)

## No Deploy Required
✓ Build passes without errors
✓ All changes client-side only
✓ Ready to test in dev mode (`npm run dev`)

## Testing
Run `npm run dev`, visit localhost:3000:
1. Should show character creation screen
2. Create a character (any name, pick appearance)
3. Should land on title with character preview
4. Start a battle → character emoji shows on left
5. Refresh page → character persists
6. Click "Edit Character" → modify and save
