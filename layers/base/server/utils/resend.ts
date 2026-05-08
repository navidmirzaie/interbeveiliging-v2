import { Resend } from 'resend'

let _client: Resend | null = null

export function useResend(): Resend {
  if (!_client) {
    const { resendApiKey } = useRuntimeConfig()
    _client = new Resend(resendApiKey as string)
  }
  return _client
}
