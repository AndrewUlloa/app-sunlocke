import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Use edge runtime to handle large files without size limits
export const runtime = "edge"

// Configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const FETCH_TIMEOUT = 120000 // 2 minutes
const TRANSCRIPTION_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"

// Validate environment variables with Zod
const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "Groq API key must be set"),
})

class TranscriptionError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly responseText?: string
  ) {
    super(message)
    this.name = 'TranscriptionError'
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeout = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

async function retryableTranscriptionRequest(
  audioFile: File,
  prompt: string | null,
  apiKey: string,
  attempt = 1
): Promise<{ text: string }> {
  const transcriptionFormData = new FormData()
  transcriptionFormData.append("file", audioFile)
  transcriptionFormData.append("model", "distil-whisper-large-v3-en")
  transcriptionFormData.append("response_format", "json")

  if (prompt) {
    transcriptionFormData.append("prompt", prompt)
  }

  try {
    console.log(`Attempt ${attempt} - Processing file: ${audioFile.name} (${Math.round(audioFile.size / 1024 / 1024)}MB)`)
    
    const response = await fetchWithTimeout(
      TRANSCRIPTION_ENDPOINT,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: transcriptionFormData,
      }
    )

    // Log detailed response information
    console.log(`Response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const responseText = await response.text()
      console.error(`Error response body:`, responseText)
      
      // Check if we should retry
      if (attempt < MAX_RETRIES && (
        response.status === 502 || 
        response.status === 503 || 
        response.status === 504 ||
        response.status === 520 || // Add Cloudflare error
        response.status === 524 || // Timeout error
        response.status === 529 || // Rate limit error
        response.status === 499    // Client closed request
      )) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1) // Exponential backoff
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return retryableTranscriptionRequest(audioFile, prompt, apiKey, attempt + 1)
      }

      throw new TranscriptionError(
        `Transcription failed with status ${response.status} ${response.statusText}`,
        response.status,
        responseText
      )
    }

    const data = await response.json()
    return data
  } catch (error: unknown) {
    if (error instanceof TranscriptionError) {
      throw error
    }

    // Handle timeout and abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        console.log(`Request timed out, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return retryableTranscriptionRequest(audioFile, prompt, apiKey, attempt + 1)
      }
      throw new TranscriptionError('Request timed out after all retry attempts')
    }

    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
      console.log(`Error occurred, retrying in ${delay}ms...`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryableTranscriptionRequest(audioFile, prompt, apiKey, attempt + 1)
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new TranscriptionError(errorMessage)
  }
}

export async function POST(req: NextRequest) {
  console.log("POST /api/transcribe called")

  // Validate environment variables at runtime
  const envParseResult = envSchema.safeParse(process.env)
  if (!envParseResult.success) {
    console.error("Environment validation failed:", envParseResult.error)
    return NextResponse.json(
      { error: "Missing required environment variables" },
      { status: 500 }
    )
  }

  const { GROQ_API_KEY } = envParseResult.data

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
        const data = await retryableTranscriptionRequest(audioFile, prompt, GROQ_API_KEY)
        
        if (combinedText) {
          combinedText += "\n\n"
        }
        combinedText += data.text

        results.push({
          filename: audioFile.name,
          text: data.text,
        })
      } catch (error: unknown) {
        if (error instanceof TranscriptionError) {
          console.error(`Failed to transcribe ${audioFile.name}:`, {
            message: error.message,
            status: error.status,
            responseText: error.responseText
          })
        } else {
          console.error(`Failed to transcribe ${audioFile.name}:`, error)
        }
        throw error
      }
    }

    console.log("All transcriptions completed successfully")
    return NextResponse.json({ 
      results,
      combinedText
    })
  } catch (error: unknown) {
    console.error("Transcription error:", error)
    
    if (error instanceof TranscriptionError) {
      return NextResponse.json(
        { 
          error: error.message,
          status: error.status,
          details: error.responseText
        }, 
        { status: error.status || 500 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}

