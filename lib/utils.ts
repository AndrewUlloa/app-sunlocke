import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4.5)
}

export async function splitAndSummarizeText(text: string, apiKey: string): Promise<string> {
  // Split text into roughly equal halves
  const midpoint = Math.floor(text.length / 2)
  const firstHalf = text.slice(0, midpoint)
  const secondHalf = text.slice(midpoint)

  // Create the summarization prompt
  const summarizationPrompt = `As an executive assistant, create a detailed but concise summary of the following text, focusing on key points, action items, and important details. Keep the summary clear and professional:\n\n`

  // Process each half in parallel
  const [summary1, summary2] = await Promise.all([
    summarizeText(firstHalf, apiKey, summarizationPrompt),
    summarizeText(secondHalf, apiKey, summarizationPrompt)
  ])

  // Combine summaries
  return `${summary1}\n\n${summary2}`
}

async function summarizeText(text: string, apiKey: string, prompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a highly efficient executive assistant skilled at creating clear, concise summaries while preserving key information."
          },
          {
            role: "user",
            content: prompt + text
          }
        ],
        temperature: 0.7,
        max_tokens: 2000, // Ensure each summary stays well under the 6000 TPM limit
      })
    })

    if (!response.ok) {
      throw new Error(`Summarization failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error during summarization:', error)
    throw error
  }
}
