import "@/styles/globals.css";

export const metadata = {
  title: "Marmalade: Quiz Boss Battle",
  description: "Kid-friendly web game where spelling and maths answers power boss battles against Charlotte and George."
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
