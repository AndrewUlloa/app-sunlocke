import { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { AnimatedBackground } from "@/components/ui/animated-background";
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: 'https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/6752962dceb9162ce9abfa3e_Open%20Graph%20Image%20EN-US_v3.png', // Use your OG image URL here
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
      <div className="min-h-[100dvh] w-full flex flex-col items-center relative">
        <a href="https://www.sunlocke.com" className="absolute top-0 m-5 flex items-center gap-[3px]">
          <Image
            src="https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/676c5d394fac452876183d99_Sun_Locke_Logo-Black.svg"
            alt="Sun Locke Logo"
            width={36}
            height={36}
            priority
            unoptimized
          />
          <span className="text-[28px] font-tobiasSemiBold tracking-[-0.04em]">Sun Locke</span>
        </a>
        <div className="flex-1 w-full flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </AnimatedBackground>
  );
}
