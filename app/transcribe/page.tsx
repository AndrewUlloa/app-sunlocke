import { Metadata } from "next"
import { TranscriptionForm } from "@/components/transcription-form"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Header } from "@/components/ui/header"

export const metadata: Metadata = {
  title: "Audio Transcription - Sun Locke",
  description: "Transcribe your audio files and extract actionable items",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.sunlocke.com/transcribe",
    title: "Audio Transcription - Sun Locke",
    description: "Transcribe your audio files and extract actionable items",
    siteName: "Sun Locke",
    images: [
      {
        url: 'https://cdn.prod.website-files.com/6729490eec7b4529805b89b0/679c463ae979ac4ba80ff672_Open%20Graph%20Image%20EN_US_AI_Companion_v2.png',
        width: 1200,
        height: 630,
        alt: 'Sun Locke',
      },
    ],
  },
}



export default function TranscribePage() {
  return (
    <AnimatedBackground>
      <div className="min-h-[100dvh] container mx-auto flex flex-col justify-center">
        <Header />
        <div className="flex-1 w-full flex items-center justify-center">
          <TranscriptionForm />
        </div>
      </div>
    </AnimatedBackground>
  )
}

