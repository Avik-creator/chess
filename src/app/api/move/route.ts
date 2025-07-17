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

// Function to call Stockfish API
async function getStockfishMove(fen: string, depth: number): Promise<string> {
  try {
    const response = await fetch("https://chess-api.com/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fen: fen,
        depth: depth,
        variants: 1,
        maxThinkingTime: 50,
      }),
    })

    if (!response.ok) {
      throw new Error(`Stockfish API error: ${response.status}`)
    }

    const data = await response.json()
    
    // The API returns the move in UCI format (e.g., "e2e4")
    if (data.move) {
      return data.move
    } else {
      throw new Error("No move returned from Stockfish API")
    }
  } catch (error) {
    console.error("Stockfish API error:", error)
    throw error
  }
}

export async function POST(req: Request) {
  const { legalMoves, currentBoard, color, userColor, model } = await req.json()

  // Check if this is a Stockfish request
  if (model.startsWith("stockfish-17")) {
    try {
      // Extract depth from model ID (e.g., "stockfish-17-depth-12" -> 12)
      const depthMatch = model.match(/depth-(\d+)/)
      const depth = depthMatch ? parseInt(depthMatch[1]) : 12
      
      const move = await getStockfishMove(currentBoard, depth)
      
      // Return the move as a text stream to match the existing interface
      return new Response(move, {
        headers: {
          "Content-Type": "text/plain",
        },
      })
    } catch (error) {
      console.error("Stockfish move error:", error)
      return new Response("error", {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }
  }

  // Original LLM logic for non-Stockfish models
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
