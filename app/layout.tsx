import "@/styles/globals.css";
import "@/styles/animations.css";
import "@/styles/battle-viewport-overrides.css";
import "@/styles/character-visuals.css";

export const metadata = {
  title: "Marmalade: Keeper Quiz Challenge",
  description: "Kid-friendly web game where spelling and maths answers help learners defeat the Keeper of Patience in one focused storybook battle."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
