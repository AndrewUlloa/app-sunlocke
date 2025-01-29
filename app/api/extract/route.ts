import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Groq } from "groq-sdk"

export const runtime = "edge"

// 1. Validate environment variables with Zod
const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "Groq API key must be set"),
})
const { GROQ_API_KEY } = envSchema.parse(process.env)

// 2. Initialize Groq with the validated API key
const groqClient = new Groq({
  apiKey: GROQ_API_KEY,
})

// 3. Define a Zod schema for the request body
const requestBodySchema = z.object({
  transcription: z
    .string({ required_error: "transcription is required" })
    .trim()
    .min(1, "Transcription must not be empty")
    .max(4000, "Transcription too long (max 4000 chars)"),
})

interface GroqError extends Error {
  response?: Response;
}

export async function POST(req: NextRequest) {
  console.log("POST /api/extract called")

  // 4. Parse the JSON request body and validate
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

  // 5. Extract the validated transcription
  const { transcription } = parseResult.data
  console.log("Transcription to process:", transcription.slice(0, 50), "...")

  try {
    // 6. Attempt Groq Chat Completion
    console.log("Sending request to Groq API")

    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Extract actionable items from the transcriptions provided, tailored to the specific context of the discussion, such as a meeting, sales call, or marketing consult. Align actionable items with expected business outcomes for each type of context.

Steps:
1. Identify Context: Determine the type of context (e.g., meeting, sales call, marketing consult) from the transcription.
2. Extract Key Information: Identify relevant points that can be transformed into actionable items considering the specific business goals associated with the context.
3. Define Actionable Tasks: Formulate clear, concise, and actionable tasks that are aligned with business objectives relevant to each context.

Output Format:
Output the actionable items in a list format. Each item should detail the task, the specific context, and the business outcome addressed by the action.

Notes:
- Ensure items are contextually informed by the conversation.
- Tailor items to suit the specific nature of each setting (e.g., strategic action plans for meetings, follow-up actions in sales calls).
- Adapt the tasks based on typical outcomes expected in meetings, sales calls, or consultative sessions.`,
        },
        {
          role: "user",
          content: transcription,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1,
      top_p: 1,
      stream: false,
    })

    const actionableItems = chatCompletion.choices[0]?.message?.content ?? ""
    console.log("Extraction result received, length:", actionableItems.length)

    return NextResponse.json({ actionableItems })
  } catch (error: unknown) {
    console.error("Groq API error:", error)

    // If error is from Groq API
    const groqError = error as GroqError
    if (groqError.response) {
      const errorText = await groqError.response.text()
      console.error("Groq API error response:", errorText)
    }

    return NextResponse.json({ error: "Error calling Groq API" }, { status: 500 })
  }
}

