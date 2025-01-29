import { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { LanguagesIcon } from "@/components/ui/languages";

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
        <section id="Header" className="w-full h-[76px] flex flex-row justify-between items-center py-6">
          <div className="flex-1 flex justify-start">
            <LanguagesIcon />
          </div>
          <div className="flex-1 flex justify-center">
            <a 
              href="https://www.sunlocke.com/en-us" 
              aria-current="page" 
              className="flex items-center justify-center m-5 gap-1"
            >
              <Image
                src="https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/672971cc952da991c5eaddb4_android-chrome-512x512.png"
                alt="Sun Locke Logo"
                width={36}
                height={36}
                priority
                unoptimized
              />
              <div className="text-[28px] leading-[125%] font-tobiasSemiBold tracking-[-0.04em]">
                Sun Locke
              </div>
            </a>
          </div>
          <div className="flex-1" /> {/* Empty div for symmetrical spacing */}
        </section>
        <div className="flex-1 w-full flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </AnimatedBackground>
  );
}
