import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { ProfileProvider } from "@/context/ProfileContext";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Spelling Master",
  description: "Learn to spell and pronounce words with fun practice!",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
