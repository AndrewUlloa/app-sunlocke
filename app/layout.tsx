import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

// Tobias fonts
const tobiasLight = localFont({
  src: "./fonts/Tobias-Light.woff",
  variable: "--font-tobias-light",
  preload: true,
  display: "swap",
});

const tobiasRegular = localFont({
  src: "./fonts/Tobias-Regular.woff",
  variable: "--font-tobias-regular",
  preload: true,
  display: "swap",
});

const tobiasMedium = localFont({
  src: "./fonts/Tobias-Medium.woff",
  variable: "--font-tobias-medium",
  preload: true,
  display: "swap",
});

const tobiasSemiBold = localFont({
  src: "./fonts/Tobias-SemiBold.woff",
  variable: "--font-tobias-semibold",
  preload: true,
  display: "swap",
});

// Eudoxus Sans fonts
const eudoxusSansRegular = localFont({
  src: "./fonts/EudoxusSans-Regular.woff",
  variable: "--font-eudoxus-sans-regular",
  preload: true,
  display: "swap",
});

const eudoxusSansMedium = localFont({
  src: "./fonts/EudoxusSans-Medium.woff",
  variable: "--font-eudoxus-sans-medium",
  preload: true,
  display: "swap",
});

const eudoxusSansBold = localFont({
  src: "./fonts/EudoxusSans-Bold.woff",
  variable: "--font-eudoxus-sans-bold",
  preload: true,
  display: "swap",
});

// Geist fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  preload: true,
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sun Locke",
  description: "Sun Locke",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = [
    tobiasLight.variable,
    tobiasRegular.variable,
    tobiasMedium.variable,
    tobiasSemiBold.variable,
    eudoxusSansRegular.variable,
    eudoxusSansMedium.variable,
    eudoxusSansBold.variable,
    geistSans.variable,
    geistMono.variable,
  ].join(' ');

  return (
    <html lang="en">
      <body className={`${fontVariables} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
