import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces, Caveat } from "next/font/google";
import "./globals.css";
import { LifeDataProvider } from "@/contexts/LifeDataContext";
import { themeInitScript } from "@/utils/themes";
import ServiceWorker from "@/components/ServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Your Life In Weeks",
  description: "Visualize your life as a calendar of weeks with important events and milestones",
  applicationName: "Your Life In Weeks",
  appleWebApp: { capable: true, title: "Life in Weeks", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f7f0e1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the theme script below sets data-theme on
    // <html> before hydration, which React would otherwise flag as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${caveat.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ServiceWorker />
        <LifeDataProvider>
          {children}
        </LifeDataProvider>
      </body>
    </html>
  );
}
