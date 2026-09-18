import { ThemeHydrator } from "@/components/theme-provider";
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
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <Script id="randoranx-palette" strategy="beforeInteractive">
          {`try{var p=localStorage.getItem("randoranx-palette");if(p==="arcade"||p==="pine"||p==="daylight"||p==="midnight"){document.documentElement.setAttribute("data-palette",p);document.documentElement.classList.toggle("dark",p!=="daylight");}}catch(e){}`}
        </Script>
        <ThemeHydrator />
        {children}
      </body>
    </html>
  );
}
