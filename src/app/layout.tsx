import { ThemeHydrator } from "@/components/theme-provider";
import { LIGHT_PALETTE_IDS, PALETTE_IDS } from "@/lib/theme";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RandoRanx",
  description:
    "Rate movies or games in Ranx, compare them in Tourney, and keep a printable watchlist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-palette="midnight"
      className={`${geistSans.variable} ${geistMono.variable} dark min-h-dvh antialiased`}
    >
      <body className="min-h-dvh bg-background">
        <Script id="randoranx-palette" strategy="beforeInteractive">
          {`try{var p=localStorage.getItem("randoranx-palette");var ids=${JSON.stringify(PALETTE_IDS)};var light=${JSON.stringify(LIGHT_PALETTE_IDS)};if(ids.indexOf(p)>=0){document.documentElement.setAttribute("data-palette",p);document.documentElement.classList.toggle("dark",light.indexOf(p)<0);}}catch(e){}`}
        </Script>
        <ThemeHydrator />
        {children}
      </body>
    </html>
  );
}
