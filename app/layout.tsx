import "@/styles/globals.css";

export const metadata = {
  title: "Marmalade: Boss Rush",
  description: "Placeholder Asian fantasy boss rush game for 4-8 year olds."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
