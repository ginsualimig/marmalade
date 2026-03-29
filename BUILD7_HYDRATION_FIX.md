# BUILD7_HYDRATION_FIX

## Root cause
`app/page.tsx` previously ran `getInitialState()` during rendering, which called `Math.random()` and localStorage access. On the server this produced one set of seeded data (defaults, a randomly generated opening question, etc.), while the client re-ran the same logic during hydration and could read persisted preferences/power levels. The differing random/localStorage results caused React to detect mismatched markup and log hydration errors even before the user interacted with the app.

## Fix
1. Capture the server-generated initial state and serialize it into the HTML via a `<script>` before the `<main>` block. The client `useState` initializer now first tries to reuse that serialized snapshot, so the markup that React renders on the client matches what the server emitted.
2. After the app mounts, a new one-time `useEffect` rehydrates the UI by calling `getInitialState()` on the client, updating every piece of state (settings, battle data, sounds, saved progress, power levels, etc.) and reading real localStorage values. A ref guards the effect so it only runs once (even under Strict Mode), and subsequent effects that persist preferences (e.g., `saveSoundPreferences`) wait until rehydration completes to avoid overwriting stored values with defaults.
3. Sound and power-level states now start from deterministic defaults; they are populated with actual persisted data inside the rehydration effect, preventing any client-only localStorage reads from running before hydration.

This keeps the existing Build 6 behavior intact while ensuring the initial markup is identical on both server and client, eliminating the hydration mismatch.

## Testing
- `npm run build` ✅
