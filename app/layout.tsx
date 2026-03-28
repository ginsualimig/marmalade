import "@/styles/globals.css";

export const metadata = {
  title: "Marmalade: Mythic Monster Quiz Showdown",
  description: "Kid-friendly web game where spelling and maths answers stop Moonlight Manticore Lyra and Starwhirl Kraken Orion."
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
