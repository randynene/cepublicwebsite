import { sendMessage } from '../../site/src/lib/ask/clara/client'
import {
  createMockTransport,
  MOCK_WORKSPACE_ID,
} from '../../site/src/lib/ask/clara/mock-transport'

async function main() {
  const mock = createMockTransport('single-to-squad')
  const events: string[] = []
  for await (const event of sendMessage(
    {
      workspace_id: MOCK_WORKSPACE_ID,
      session_token: 't',
      message: 'Hire one senior React engineer',
      message_id: 'm1',
      stream: true,
    },
    mock.transport,
  )) {
    if (event.type === 'token') events.push('token')
    else if (event.type === 'brief_update') events.push(`brief:${event.version}`)
    else events.push(event.type)
  }
  const tokens = events.filter((event) => event === 'token').length
  console.log(events.filter((event) => event !== 'token').join(','))
  console.log('tokenCount', tokens)
  if (tokens < 5) throw new Error('expected streamed tokens')
  if (!events.includes('brief:1')) throw new Error('expected brief_update v1')
  if (!events.includes('done')) throw new Error('expected done')
  console.log('smoke-mock-transport: OK')
}

main()
