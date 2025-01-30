import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "edge"

// Validate environment variables
const envSchema = z.object({
  CLOUDFLARE_API_TOKEN: z.string().min(1, "Cloudflare API token must be set"),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "Cloudflare Account ID must be set"),
})

interface WhisperResponse {
  result: {
    text: string
    language: string
    duration: number
  }
  success: boolean
  errors: Array<{
    code: number
    message: string
  }>
}

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function transcribeWithRetry(
  audioFile: File, 
  base64Audio: string, 
  prompt: string | null,
  apiToken: string,
  accountId: string,
  retryCount = 0
): Promise<WhisperResponse> {
  const whisperEndpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/openai/whisper-large-v3-turbo`
  
  try {
    const requestBody = {
      audio: base64Audio,
      task: "transcribe",
      language: "en",
      vad_filter: "true",
      ...(prompt && { initial_prompt: prompt }),
    }

    console.log(`Processing file: ${audioFile.name} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
    const response = await fetch(whisperEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`Whisper API error response:`, errorData)
      
      // Check if error is retryable
      const isNetworkError = errorData.errors?.[0]?.code === 6001
      const canRetry = retryCount < MAX_RETRIES && isNetworkError
      
      if (canRetry) {
        console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`)
        await wait(RETRY_DELAY)
        return transcribeWithRetry(audioFile, base64Audio, prompt, apiToken, accountId, retryCount + 1)
      }
      
      throw new Error(
        `Transcription failed for ${audioFile.name}. Status: ${response.status}. ${
          errorData.errors?.[0]?.message || errorData.error?.message || 'Unknown error'
        }`
      )
    }

    const data = await response.json() as WhisperResponse
    if (!data.success) {
      throw new Error(`API returned unsuccessful response: ${data.errors?.[0]?.message || 'Unknown error'}`)
    }

    return data
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Request failed, retrying in ${RETRY_DELAY/1000} seconds...`)
      await wait(RETRY_DELAY)
      return transcribeWithRetry(audioFile, base64Audio, prompt, apiToken, accountId, retryCount + 1)
    }
    throw error
  }
}

export async function POST(req: NextRequest) {
  console.log("POST /api/whisper called")

  // Validate environment variables at runtime
  const envParseResult = envSchema.safeParse(process.env)
  if (!envParseResult.success) {
    console.error("Environment validation failed:", envParseResult.error)
    return NextResponse.json(
      { error: "Missing required environment variables" },
      { status: 500 }
    )
  }

  const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = envParseResult.data

  try {
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

    let combinedText = ""
    const results = []

    for (const audioFile of audioFiles) {
      try {
        // Convert File to ArrayBuffer
        const arrayBuffer = await audioFile.arrayBuffer()
        const base64Audio = Buffer.from(arrayBuffer).toString('base64')

        const data = await transcribeWithRetry(
          audioFile, 
          base64Audio, 
          prompt, 
          CLOUDFLARE_API_TOKEN, 
          CLOUDFLARE_ACCOUNT_ID
        )
        const transcriptionText = data.result.text

        if (combinedText) {
          combinedText += "\n\n"
        }
        combinedText += transcriptionText

        results.push({
          filename: audioFile.name,
          text: transcriptionText,
          duration: data.result.duration,
          language: data.result.language,
        })

        console.log(`Successfully transcribed ${audioFile.name} (${transcriptionText.split(/\s+/).length} words)`)
      } catch (error) {
        console.error(`Failed to transcribe ${audioFile.name}:`, error)
        // Check if the file size might be too large
        const fileSizeMB = audioFile.size / (1024 * 1024)
        if (fileSizeMB > 25) {
          throw new Error(`File ${audioFile.name} is ${fileSizeMB.toFixed(1)}MB. Cloudflare Whisper has a 25MB limit per file.`)
        }
        throw error
      }
    }

    console.log("All transcriptions completed successfully")
    return NextResponse.json({ 
      results,
      combinedText
    })
  } catch (error) {
    console.error("Transcription error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
} 