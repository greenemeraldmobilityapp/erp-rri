import { StreamingChunk } from './agents/types'

export function parseSSELine(line: string): { key: string; value: string } | null {
  if (!line || line.startsWith(':')) return null
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) return null
  const key = line.slice(0, colonIndex).trim()
  const value = line.slice(colonIndex + 1).trim()
  return { key, value }
}

export function parseSSEData(data: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = data.split('\n')
  for (const line of lines) {
    const parsed = parseSSELine(line)
    if (parsed) {
      try {
        result[parsed.key] = JSON.parse(parsed.value)
      } catch {
        result[parsed.key] = parsed.value
      }
    }
  }
  return result
}

export function extractStreamingChunk(chunk: Record<string, unknown>): StreamingChunk {
  const choices = chunk.choices as Array<{
    delta?: {
      content?: string
      reasoning_content?: string
    }
  }> | undefined

  if (!choices || choices.length === 0) {
    return {}
  }

  const delta = choices[0]?.delta ?? {}
  return {
    reasoning_content: delta.reasoning_content,
    content: delta.content,
  }
}

export class StreamingAccumulator {
  private reasoning = ''
  private content = ''
  private done = false

  accumulate(chunk: StreamingChunk): { reasoning: string; content: string } {
    if (chunk.reasoning_content) {
      this.reasoning += chunk.reasoning_content
    }
    if (chunk.content) {
      this.content += chunk.content
    }
    if (chunk.done) {
      this.done = true
    }
    return { reasoning: this.reasoning, content: this.content }
  }

  getResult(): { reasoning: string; content: string; done: boolean } {
    return {
      reasoning: this.reasoning,
      content: this.content,
      done: this.done,
    }
  }

  isDone(): boolean {
    return this.done
  }
}

export function createReadableStream(generator: AsyncGenerator<StreamingChunk>): ReadableStream {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await generator.next()
        if (done) {
          controller.close()
          return
        }

        const text = JSON.stringify(value) + '\n'
        controller.enqueue(encoder.encode(text))
      } catch (err) {
        controller.error(err)
      }
    },
  })
}