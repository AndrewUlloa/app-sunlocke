import Image from "next/image";
import { LanguagesIcon } from "@/components/ui/languages";

export function Header() {
  return (
    <section className="w-full max-w-[1192px] h-[76px] flex flex-row justify-between items-center py-6 mx-auto">
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
  );
} 