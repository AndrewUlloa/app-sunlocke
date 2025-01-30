import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { estimateTokens, splitAndSummarizeText } from "@/lib/utils"

export const runtime = "edge"

const requestBodySchema = z.object({
  transcription: z.string(),
})

// Validate environment variables
const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "Groq API key must be set"),
})

const TOKEN_LIMIT = 6000

export async function POST(req: NextRequest) {
  console.log("POST /api/extract called")

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

  // Parse the JSON request body and validate
  let body
  try {
    body = await req.json()
  } catch (error) {
    console.error("Invalid JSON body:", error)
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
  }

  const parseResult = requestBodySchema.safeParse(body)
  if (!parseResult.success) {
    console.error("Body validation error:", parseResult.error.errors)
    return NextResponse.json({ error: parseResult.error.flatten().fieldErrors }, { status: 400 })
  }

  // Extract the validated transcription
  const { transcription } = parseResult.data
  console.log("Transcription to process:", transcription.slice(0, 50), "...")

  try {
    // Check if we need to summarize first
    const estimatedTokens = estimateTokens(transcription)
    console.log("Estimated tokens:", estimatedTokens)

    let textToProcess = transcription
    let usedSummary = false

    if (estimatedTokens > TOKEN_LIMIT) {
      console.log("Token limit exceeded, generating summary first...")
      textToProcess = await splitAndSummarizeText(transcription, GROQ_API_KEY)
      usedSummary = true
      console.log("Summary generated, new token count:", estimateTokens(textToProcess))
    }

    // Attempt Groq Chat Completion
    console.log("Sending request to Groq API")

    const chatCompletion = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Extract actionable items from the ${usedSummary ? 'summarized' : ''} transcription provided, tailored to the specific context of the discussion, such as a meeting, sales call, or marketing consult. Align actionable items with expected business outcomes for each type of context.

Steps:
1. Identify Context: Determine the type of context (e.g., meeting, sales call, marketing consult) from the transcription.
2. Extract Key Information: Identify relevant points that can be transformed into actionable items considering the specific business goals associated with the context.
3. Define Actionable Tasks: Formulate clear, concise, and actionable tasks that are aligned with business objectives relevant to each context.

Output Format:
Output the actionable items in a list format. Each item should detail the task, the specific context, and the business outcome addressed by the action.

Notes:
- Ensure items are contextually informed by the conversation.
- Tailor items to suit the specific nature of each setting (e.g., strategic action plans for meetings, follow-up actions in sales calls).
- Adapt the tasks based on typical outcomes expected in meetings, sales calls, or consultative sessions.${usedSummary ? '\n\nNote: This analysis is based on a summarized version of the original transcription.' : ''}`,
          },
          {
            role: "user",
            content: textToProcess,
          },
        ],
        model: "deepseek-r1-distill-llama-70b",
        temperature: 1,
        top_p: 1,
        stream: false,
      }),
    })

    if (!chatCompletion.ok) {
      const errorData = await chatCompletion.json()
      throw new Error(errorData.error?.message || "Failed to extract actionable items")
    }

    const data = await chatCompletion.json()
    return NextResponse.json({ 
      actionableItems: data.choices[0].message.content,
      usedSummary
    })
  } catch (error) {
    console.error("Groq API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    )
  }
}

