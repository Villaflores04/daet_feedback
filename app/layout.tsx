import type { Metadata } from "next";
import { Footer, Nav } from "@/components/Nav";
import { SetupBanner } from "@/components/SetupBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAET Pulse — tourist sentiment desk",
  description: "High-end public feedback and sentiment dashboard for tourism spots in Daet, Camarines Norte."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <SetupBanner />
        <Nav />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
