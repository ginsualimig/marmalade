"use client";

import PhaserGame from "@/components/PhaserGame";

const sendTouchCommand = (type: string, payload?: unknown) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("marmalade-touch", { detail: { type, payload } }));
};

const touchButtons = [
  { label: "⬅️ Run", type: "move-start", payload: { direction: "left" }, isMovement: true },
  { label: "Run ➡️", type: "move-start", payload: { direction: "right" }, isMovement: true },
  { label: "🦘 Jump", type: "jump", isMovement: false },
  { label: "✨ Slash", type: "light-attack", isMovement: false },
  { label: "💥 Slam", type: "heavy-attack", isMovement: false },
  { label: "🐉 Dragon", type: "dragon-special", isMovement: false }
];

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto py-6 px-4 space-y-5">
      <section className="kid-card p-6">
        <h1 className="text-4xl md:text-5xl font-black tracking-wide text-center text-white">Marmalade: Tiny Guardian</h1>
        <p className="mt-3 text-center text-base md:text-lg text-white/90">
          Colorful boss adventure for kids: collect letters to spell words, grab numbers to solve math gates, and unleash fun attacks.
        </p>
      </section>

      <section className="kid-frame p-3 md:p-4">
        <PhaserGame />
      </section>

      <section className="grid md:grid-cols-2 gap-4 text-white">
        <article className="kid-card p-4 space-y-2">
          <h2 className="text-xl font-extrabold text-white">How to win ⭐</h2>
          <ul className="list-disc list-inside space-y-1 text-white/95">
            <li>Move + jump, then use Slash / Slam / Dragon.</li>
            <li>Collect letters in order to spell the target word.</li>
            <li>Pick numbers that are greater than or equal to the number rule.</li>
            <li>Use Math Bank to pass the glowing math gate.</li>
            <li>Beat Charlotte, then George.</li>
          </ul>
        </article>
        <article className="kid-card p-4 space-y-2">
          <h2 className="text-xl font-extrabold text-white">Touch controls 🎮</h2>
          <p className="text-white/90">Hold Run buttons. Tap action buttons.</p>
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
