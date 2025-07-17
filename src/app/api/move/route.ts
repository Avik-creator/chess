import { streamText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export const runtime = "edge"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  const { legalMoves, currentBoard, color, userColor, model } = await req.json()

  let aiModel

  // Select the appropriate model based on the request
  if (model.startsWith("gemini")) {
    aiModel = google(model)
  } else {
    // Default to Groq models
    aiModel = groq(model)
  }

  const stream = streamText({
    model: aiModel,
    prompt: `
      You are a chess grandmaster playing as ${color}. The user is playing as ${userColor}.
      It is ${color}'s turn to move.
      
      Current board (FEN): ${currentBoard}
      Legal moves for ${color} (UCI): ${legalMoves.join(", ")}
      
      You must respond with one of the provided UCI move strings, and nothing else. 
      Do NOT use algebraic notation like e5, Nxe5, exf6, etc. 
      For example, if the move is pawn from e7 to e5, respond with 'e7e5'. 
      If the move is knight from g8 to f6, respond with 'g8f6'. 
      Do not include any explanation, prefix, or extra text. 
      Only output the move string itself.
    `,
    system: "Choose only from the provided legal moves. Respond with UCI notation only.",
  })

  return stream.toTextStreamResponse({
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
