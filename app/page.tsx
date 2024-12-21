import { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";

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
    <div className="animated-background">
      <div className="min-h-screen flex flex-col items-center justify-center p-2 relative">
        <div className="w-full max-w-[1200px] flex flex-col items-center">
          <div className="mb-4">
            <Image
              src="https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/676724d7148175f658d6927b_Sun_Locke_XL.svg"
              alt="Sun Locke Logo"
              width={144}
              height={32}
              priority
            />
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
