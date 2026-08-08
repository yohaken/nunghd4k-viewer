import type { Metadata } from "next";
import { Poppins, Sarabun } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NUNGHD4K Viewer",
  description: "ดูหนังออนไลน์ HD 4K พากย์ไทย ซับไทย",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${poppins.variable} ${sarabun.variable} overflow-x-hidden`}>
      <body className="min-h-screen antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
