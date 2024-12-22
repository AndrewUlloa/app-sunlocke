import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Tobias-Light.woff
const tobiasLight = localFont({
  src: "./fonts/Tobias-Light.woff",
  display: "swap",
  variable: "--font-tobias-light",
});

// Tobias-Regular.woff
const tobiasRegular = localFont({
  src: "./fonts/Tobias-Regular.woff",
  display: "swap",
  variable: "--font-tobias-regular",
});

// Tobias-Medium.woff
const tobiasMedium = localFont({
  src: "./fonts/Tobias-Medium.woff",
  display: "swap",
  variable: "--font-tobias-medium",
});

// Tobias-SemiBold.woff
const tobiasSemiBold = localFont({
  src: "./fonts/Tobias-SemiBold.woff",
  display: "swap",
  variable: "--font-tobias-semibold",
});

// EudoxusSans-Regular.woff
const eudoxusSansRegular = localFont({
  src: "./fonts/EudoxusSans-Regular.woff",
  display: "swap",
  variable: "--font-eudoxus-sans-regular",
});

// EudoxusSans-Medium.woff
const eudoxusSansMedium = localFont({
  src: "./fonts/EudoxusSans-Medium.woff",
  display: "swap",
  variable: "--font-eudoxus-sans-medium",
});

// EudoxusSans-Bold.woff
const eudoxusSansBold = localFont({
  src: "./fonts/EudoxusSans-Bold.woff",
  display: "swap",
  variable: "--font-eudoxus-sans-bold",
});

export const metadata: Metadata = {
  title: "Sun Locke",
  description: "Sun Locke",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
          className={`${tobiasLight.variable} ${tobiasRegular.variable} ${tobiasMedium.variable} ${tobiasSemiBold.variable} ${eudoxusSansRegular.variable} ${eudoxusSansMedium.variable} ${eudoxusSansBold.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}

      >
        {children}
      </body>
    </html>
  );
}
