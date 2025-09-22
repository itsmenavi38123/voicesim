import { voiceSimBaseUrl } from "@/lib/utils";

export const voiceCakeApi = async (payload: any) => {
    try {
        const response = await fetch(`${voiceSimBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: payload.email,
                password: payload.password,
            }),
        });
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`)
        }
        const data = await response.json()
        if (data?.data?.access_token) {
            localStorage.setItem('token', data?.data?.access_token);
        }
        return data;
    } catch (error) {
        console.error('[fetchAgentsFromApi] Error fetching agents:', error);
    }
}