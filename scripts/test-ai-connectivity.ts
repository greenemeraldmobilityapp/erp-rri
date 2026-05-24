import 'dotenv/config'
import { createNvidiaClient, AI_MODELS } from '../src/lib/ai/client'

const models = [
  { name: 'NegoAgent', model: AI_MODELS.NEGO_AGENT },
  { name: 'DataAgent', model: AI_MODELS.DATA_AGENT },
  { name: 'VisionAgent', model: AI_MODELS.VISION_AGENT },
]

async function testModel(label: string, modelId: string, stream: boolean = false) {
  const client = createNvidiaClient()
  const start = Date.now()
  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: 'Answer in one short sentence in Indonesian.' },
        { role: 'user', content: 'Halo, apa kabar? Balas 1 kata saja.' },
      ],
      temperature: 0.5,
      max_tokens: 50,
      stream,
    })

    const content = stream
      ? 'streaming response'
      : ((response as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content ?? 'empty')
    const elapsed = Date.now() - start
    console.log(`✅ ${label.padEnd(15)} ${modelId.padEnd(42)} ${elapsed}ms  "${content?.substring(0, 60)}"`)
    return true
  } catch (err) {
    const elapsed = Date.now() - start
    console.log(`❌ ${label.padEnd(15)} ${modelId.padEnd(42)} ${elapsed}ms  ${err instanceof Error ? err.message : 'unknown error'}`)
    return false
  }
}

async function main() {
  console.log('')
  console.log('='.repeat(100))
  console.log('  NVIDIA NIM Connectivity Test')
  console.log('='.repeat(100))
  console.log(`  Base URL: ${process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'}`)
  console.log(`  API Key:  ${process.env.NVIDIA_API_KEY ? `${process.env.NVIDIA_API_KEY.substring(0, 12)}...` : 'NOT SET'}`)
  console.log('='.repeat(100))
  console.log('')

  const results: boolean[] = []
  for (const { name, model } of models) {
    const ok = await testModel(name, model, false)
    results.push(ok)
  }

  console.log('')
  console.log('='.repeat(100))
  const passed = results.filter(Boolean).length
  console.log(`  Result: ${passed}/${results.length} models responded successfully`)
  console.log('='.repeat(100))
  console.log('')
}

main().catch(console.error)
