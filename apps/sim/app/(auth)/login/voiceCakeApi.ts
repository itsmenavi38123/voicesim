import { voiceSimBaseUrl } from '@/lib/utils'

const TOKENS_KEY = 'tokens'

type Tokens = {
  access_token: string
  refresh_token: string
}

export const voiceCakeApi = async (payload: any) => {
  try {
    const response = await fetch(`${voiceSimBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: payload.email,
        password: payload.password,
      }),
    })
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }
    const data = await response.json()
    if (data?.data?.access_token && data?.data?.refresh_token) {
      saveTokens({
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
      })
    }
    return data
  } catch (error) {
    console.error('[fetchAgentsFromApi] Error fetching agents:', error)
  }
}

/** Save tokens */
function saveTokens(tokens: Tokens) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
}

/** Get tokens */
function getTokens(): Tokens | null {
  const stored = localStorage.getItem(TOKENS_KEY)
  return stored ? (JSON.parse(stored) as Tokens) : null
}

/** Clear tokens */
function clearTokens() {
  localStorage.removeItem(TOKENS_KEY)
}

async function refreshTokens(refresh_token: string): Promise<Tokens | null> {
  try {
    const response = await fetch(
      `https://voicecakedevelop-hrfygverfwe8g4bj.canadacentral-01.azurewebsites.net/api/v1/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      }
    )

    if (!response.ok) throw new Error(`Refresh failed: ${response.status}`)

    const data = await response.json()

    if (data?.data?.access_token && data?.data?.refresh_token) {
      const tokens: Tokens = {
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
      }
      saveTokens(tokens)
      return tokens
    }

    return null
  } catch (error) {
    console.error('[refreshTokens] Error:', error)
    return null
  }
}

export async function fetchAgentsFromApi(): Promise<any | null> {
  let tokens = getTokens()
  const url = `${voiceSimBaseUrl}/agents/`

  if (!tokens) {
    return null
  }

  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401 && tokens.refresh_token) {
    const newTokens = await refreshTokens(tokens.refresh_token)
    if (newTokens) {
      tokens = newTokens
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      })
    } else {
      clearTokens()
      return null
    }
  }
  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}`)
  }
  return response.json()
}
