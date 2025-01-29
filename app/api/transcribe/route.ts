import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validate environment variables with Zod
const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "Groq API key must be set"),
})
const { GROQ_API_KEY } = envSchema.parse(process.env)

const TRANSCRIPTION_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"

export async function POST(req: NextRequest) {
  console.log("POST /api/transcribe called")

  if (!GROQ_API_KEY) {
    console.error("Groq API key is not set")
    return NextResponse.json(
      { error: "Groq API key is not set" },
      { status: 500 }
    )
  }

  try {
    // For multipart form data, parse with formData()
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null
    const prompt = formData.get("prompt") as string | null

    if (!audioFile) {
      console.error("No audio file in request form data")
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    console.log("Received transcription request:", audioFile.name, prompt)

    const transcriptionFormData = new FormData()
    transcriptionFormData.append("file", audioFile)
    transcriptionFormData.append("model", "distil-whisper-large-v3-en")
    transcriptionFormData.append("response_format", "json")

    if (prompt) {
      transcriptionFormData.append("prompt", prompt)
    }

    console.log("Sending request to Groq API")
    const response = await fetch(TRANSCRIPTION_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: transcriptionFormData,
    })

    if (!response.ok) {
      console.error(
        "Groq API response not OK:",
        response.status,
        response.statusText
      )
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Transcription failed")
    }

    // The entire transcription is returned from Groq in `data.text`
    const data = await response.json()
    console.log("Transcription result received")

    // Return the full transcription as a single string
    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error("Transcription error:", error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during transcription"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

