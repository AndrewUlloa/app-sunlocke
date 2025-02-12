import Image from "next/image"

export function Logo() {
  return (
    <a href="https://app.sunlocke.com/" className="flex items-center gap-2">
      <Image
        src="https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/672971cc952da991c5eaddb4_android-chrome-512x512.png"
        alt="Sun Locke Logo"
        width={24}
        height={24}
        priority
        unoptimized
        className="h-6 w-6"
      />
      <span className="hidden md:inline-block text-md font-tobias font-semibold text-text-color tracking-[-0.04em] no-underline">
        Sun Locke
      </span>
    </a>
  )
}

