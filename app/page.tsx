import { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: 'https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/6752962dceb9162ce9abfa3e_Open%20Graph%20Image%20EN-US_v3.png',
        width: 1200,
        height: 630,
        alt: 'Sun Locke',
      },
    ],
  },
};

export default function Home() {
  return (
    <AnimatedBackground>
      <div className="min-h-[100dvh] container mx-auto flex flex-col justify-center">
        <Header />
        <div className="flex-1 w-full flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </AnimatedBackground>
  );
}
