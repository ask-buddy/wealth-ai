import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Playfair_Display,
  JetBrains_Mono,
  Play,
} from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const play = Play({
  variable: "--font-play",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AngelWealth | Private Wealth & Asset",
  description:
    "Executive private wealth aggregator for High-Net-Worth Individuals. Instant, zero-database in-memory multi-document intelligence powered by Gemini 3.8 Flash.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${play.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-[#f5dfe6] selection:text-[#5e1929]">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
