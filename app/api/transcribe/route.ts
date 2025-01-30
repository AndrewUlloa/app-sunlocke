import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "edge"

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
    const audioFiles = formData.getAll("audio") as File[]
    const prompt = formData.get("prompt") as string | null

    if (!audioFiles.length) {
      console.error("No audio files in request form data")
      return NextResponse.json(
        { error: "No audio files provided" },
        { status: 400 }
      )
    }

    console.log(`Received transcription request for ${audioFiles.length} files with prompt:`, prompt)

    // Process files sequentially to maintain order
    let combinedText = ""
    const results = []

    for (const audioFile of audioFiles) {
      const transcriptionFormData = new FormData()
      transcriptionFormData.append("file", audioFile)
      transcriptionFormData.append("model", "distil-whisper-large-v3-en")
      transcriptionFormData.append("response_format", "json")

      if (prompt) {
        transcriptionFormData.append("prompt", prompt)
      }

      console.log(`Processing file: ${audioFile.name}`)
      const response = await fetch(TRANSCRIPTION_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: transcriptionFormData,
      })

      if (!response.ok) {
        console.error(
          `Groq API response not OK for ${audioFile.name}:`,
          response.status,
          response.statusText
        )
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Transcription failed for ${audioFile.name}`)
      }

      const data = await response.json()
      
      // Add a newline between consecutive transcriptions
      if (combinedText) {
        combinedText += "\n\n"
      }
      combinedText += data.text

      results.push({
        filename: audioFile.name,
        text: data.text,
      })
    }

    console.log("All transcriptions completed")
    return NextResponse.json({ 
      results,
      combinedText // Include the combined text in the response
    })
  } catch (error) {
    console.error("Transcription error:", error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during transcription"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

