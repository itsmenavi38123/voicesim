import { voiceSimBaseUrl } from "@/lib/utils";

export async function fetchAgentsFromApi(token: string) {
    try {
        const response = await fetch(`${voiceSimBaseUrl}/agents/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`)
        }
        const data = await response.json()
        return data;
    } catch (error) {
        console.error('[fetchAgentsFromApi] Error fetching agents:', error)
        throw error
    }
}
