'use client';
import { useCallback, useEffect, useState } from 'react'
import { createLogger } from '@/lib/logs/console/logger'
import { fetchAgentsFromApi } from './agents'

const logger = createLogger('AgentsSection')

export function AgentsSection() {
    const [agents, setAgents] = useState<any[]>([])
    const [activeAgentId, setActiveAgentId] = useState<number | null>(null)
    const fetchAgents = useCallback(async () => {
        try {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTgzNzk3ODAsInN1YiI6IjEiLCJ0eXBlIjoiYWNjZXNzIn0.ntWbeNRd8jcSpmKWsj3wkpqinQrAzKj6MmzSQdeI2AQ'
            console.log(token)
            const data = await fetchAgentsFromApi(token)
            // logger.info('Fetched agents from API', data)
            // setAgents(data)
        } catch (error) {
            logger.error('Fetch failed', error)
        }
    }, [])

    useEffect(() => {
        fetchAgents()
    }, [fetchAgents])

    const handleAgentSelect = useCallback((agent: any) => {
        setActiveAgentId(agent.id)
        console.log('Selected agent data:', agent)
        logger.info(`Selected agent: ${agent.id}`, agent)
    }, [])

    const dummyAgents = [
        {
            id: 1,
            name: 'Customer Support Bot',
            description: 'Handles customer inquiries',
            status: 'active',
            agent_type: 'TEXT',
            avatar_url: null,
            voice_provider: 'hume',
            voice_id: 'Soft Male Conversationalist',
            custom_instructions: 'Be helpful and professional',
            tool_ids: [],
            inbound_phone_number: null,
            total_sessions: 45,
            last_used: '2024-01-15T10:30:00Z',
            created_at: '2024-01-10T08:27:03Z'
        },
        {
            id: 2,
            name: 'Voice Assistant',
            description: 'Voice-based AI assistant',
            status: 'active',
            agent_type: 'SPEECH',
            avatar_url: null,
            voice_provider: 'hume',
            voice_id: 'Warm Female Assistant Voice',
            custom_instructions: 'Speak clearly and warmly',
            tool_ids: [1, 2],
            inbound_phone_number: '+1-555-0123',
            total_sessions: 23,
            last_used: '2024-01-14T15:45:00Z',
            created_at: '2024-01-12T18:35:01Z'
        },
        {
            id: 3,
            name: 'Sales Agent',
            description: 'Helps with sales inquiries',
            status: 'inactive',
            agent_type: 'TEXT',
            avatar_url: null,
            voice_provider: 'hume',
            voice_id: 'Professional Voice',
            custom_instructions: 'Focus on converting leads',
            tool_ids: [3],
            inbound_phone_number: null,
            total_sessions: 12,
            last_used: '2024-01-10T09:20:00Z',
            created_at: '2024-01-08T14:15:30Z'
        }
    ]

    const agentList = dummyAgents

    return (
        <div className='mb-2 rounded-[8px] border bg-background p-3'>
            <div className='flex flex-col gap-1 max-h-32 overflow-y-auto'>
                {agentList.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => handleAgentSelect(agent)}
                        className={`group relative flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-left transition-colors ${activeAgentId === agent.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/50'
                            }`}
                    >
                        <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-1.5'>
                                <span
                                    className={`h-2 w-2 rounded-full ${agent.status === 'active'
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                                        }`}
                                />
                                <span className='truncate font-medium text-sm'>
                                    {agent.name}
                                </span>

                            </div>
                        </div>

                        {/* Active indicator */}
                        {activeAgentId === agent.id && (
                            <div className='absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary' />
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}