'use client';
import { useCallback, useEffect, useState } from 'react'
import { createLogger } from '@/lib/logs/console/logger'
import { fetchAgentsFromApi } from './agents'
import { ToolbarBlock } from '../sidebar/components/toolbar/components/toolbar-block/toolbar-block';

const logger = createLogger('AgentsSection')

export function AgentsSection({ userPermissions }: any) {
    const [agents, setAgents] = useState<any[]>([])
    const [activeAgentId, setActiveAgentId] = useState<number | null>(null)
    const fetchAgents = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const data = await fetchAgentsFromApi(token)
                setAgents(data?.data ?? [])
            }
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
    const agentList = Array.isArray(agents) && agents.length > 0 ? agents : [];
    return (
        <>
            {agentList.length > 0 &&
                <div className='mb-2 rounded-[8px] border bg-background p-3'>
                    <div className='flex flex-col gap-1 max-h-32 overflow-y-auto'>
                        <div className='flex flex-col gap-1 max-h-32 overflow-y-auto'>
                            {/* {agentList.map((agent) => (
                                <div key={agent.type}>
                                    <ToolbarBlock
                                        key={agent.id}
                                        config={agent.config}
                                        disabled={!userPermissions.canEdit}
                                    />
                                </div>
                            ))} */}
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

                                    {activeAgentId === agent.id && (
                                        <div className='absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary' />
                                    )}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>
            }
        </>

    )
}