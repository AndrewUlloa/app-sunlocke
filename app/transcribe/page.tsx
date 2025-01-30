"use client"

import { Metadata } from "next"
import { TranscriptionForm } from "@/components/transcription-form"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Header } from "@/components/ui/header"


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

