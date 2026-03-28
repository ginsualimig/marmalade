"use client";

import PhaserGame from "@/components/PhaserGame";

const sendTouchCommand = (type: string, payload?: unknown) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("marmalade-touch", { detail: { type, payload } }));
};

const touchButtons = [
  { label: "Left", type: "move-start", payload: { direction: "left" }, isMovement: true },
  { label: "Right", type: "move-start", payload: { direction: "right" }, isMovement: true },
  { label: "Jump", type: "jump", isMovement: false },
  { label: "Slash", type: "light-attack", isMovement: false },
  { label: "Slam", type: "heavy-attack", isMovement: false },
  { label: "Dragon", type: "dragon-special", isMovement: false }
];

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <section className="rounded-3xl border border-white/20 bg-white/5 p-6 shadow-2xl shadow-purple-900/40">
        <h1 className="text-4xl font-semibold tracking-wide text-center text-white">Marmalade: Tiny Guardian</h1>
        <p className="mt-2 text-center text-sm text-white/70">
          Play a short boss-rush where Charlotte and George test your reflexes and basic math/letter smarts.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4">
        <PhaserGame />
      </section>

      <section className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-semibold text-white">Gameplay Notes</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Use keyboard or touch buttons for move, jump, slash, slam, and dragon special.</li>
            <li>HP/MP bars show vitality while combo + score track momentum.</li>
            <li>Educational hazards: dodge letters, grab collection orbs, trigger math gates, compare numbers.</li>
            <li>Bosss swap through Charlotte (shield & toys) then George (spin & puddles).</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-semibold text-white">Touch Controls</h2>
          <p className="text-white/60">Hold a move button to keep running; tap the attacks to trigger.</p>
          <div className="touch-controls">
            {touchButtons.map((button) => (
              <button
                key={`${button.type}-${button.label}`}
                onPointerDown={() => sendTouchCommand(button.type, button.payload)}
                onPointerUp={() => {
                  if (button.isMovement) {
                    sendTouchCommand("move-stop", button.payload);
                  }
                }}
              >
                {button.label}
              </button>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
