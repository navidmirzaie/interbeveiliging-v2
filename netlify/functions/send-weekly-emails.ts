import { schedule } from '@netlify/functions'

const handler = async () => {
  const url = process.env.URL ?? 'http://localhost:3000'
  await fetch(`${url}/api/schedule/send-emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': process.env.CRON_SECRET ?? '',
    },
  })
  return { statusCode: 200 }
}

export default schedule('@hourly', handler)
