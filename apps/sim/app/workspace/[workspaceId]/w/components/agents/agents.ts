const API_URL = 'https://voicecakedevelop-hrfygverfwe8g4bj.canadacentral-01.azurewebsites.net/api/v1'

export async function fetchAgentsFromApi(token: string) {
    try {

        const response = await fetch(`${API_URL}/agents`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
        console.log(response, ">>>>>>>>>>>>>>>")
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
