import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { embed, generateText } from "ai"
import { headers } from "next/headers"
import { getProviderWithDecryptedKey } from "@/db/queries/ai-provider"
import { auth } from "@/lib/auth"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user!.id

  const { id } = await params
  const provider = await getProviderWithDecryptedKey(id, userId)
  if (!provider) {
    return Response.json({ error: "Not found" }, { status: 404 })
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

    return Response.json({ ok: true })
  } catch (e) {
    let message = "Unknown error"
    if (e instanceof Error) {
      message = e.message
    } else if (e !== null && typeof e === "object") {
      const err = e as Record<string, unknown>
      message = (err.message as string) || (err.error as string) || message
    } else if (typeof e === "string") {
      message = e
    }
    // Remove any character outside printable ASCII range
    const sanitized = message.replace(/[^\x00-\x7F]/g, "?").trim()
    return Response.json({ error: sanitized || "Unknown error" }, { status: 400 })
  }
}
