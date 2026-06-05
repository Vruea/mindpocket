import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { embed, generateText } from "ai"
import { headers } from "next/headers"
import { getProviderWithDecryptedKey } from "@/db/queries/ai-provider"
import { auth } from "@/lib/auth"

// Build a safe ASCII-only error message from any error
function safeErrorMsg(e: unknown): string {
  try {
    let msg = "Unknown error"
    if (typeof e === "string") return e.replace(/[^\x20-\x7E]/g, "?")
    if (e instanceof Error) {
      // Access message safely - it may throw if the Error object is corrupted
      try { msg = e.message || msg } catch { msg = "Error (message inaccessible)" }
    }
    return msg.replace(/[^\x20-\x7E]/g, "?")
  } catch {
    return "Unknown error"
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user!.id

  const { id } = await params
  const provider = await getProviderWithDecryptedKey(id, userId)
  if (!provider) {
    return new Response("Not found", { status: 404 })
  }
  try {
    const client = createOpenAICompatible({
      name: provider.name.replace(/[^\x20-\x7E]/g, "_"),
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    })

    if (provider.type === "chat") {
      await generateText({
        model: client.chatModel(provider.modelId),
        prompt: "Hi",
      })
    } else {
      await embed({
        model: client.embeddingModel(provider.modelId),
        value: "test",
      })
    }

    return new Response("OK", { status: 200 })
  } catch (e) {
    const msg = safeErrorMsg(e)
    // Build JSON manually to avoid any automatic serialization issues
    const body = '{"error":"' + msg + '"}'
    return new Response(body, {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    })
  }
}
