import "@/styles/globals.css";

export const metadata = {
  title: "Marmalade: Bad Guy Quiz Showdown",
  description: "Kid-friendly web game where spelling and maths answers stop Queen Mischief Charlotte and Captain Chaos George."
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
