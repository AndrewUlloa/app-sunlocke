import Image from "next/image";

export function Header() {
  return (
    <section className="w-full max-w-[1192px] h-[76px] flex flex-row items-center justify-center py-6 mx-auto">
        <a href="https://www.sunlocke.com" className="flex items-center justify-center gap-[4px]">
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
    </section>
  );
}