'use client'
import { useCallback, useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import Image from 'next/image'
import { createLogger } from '@/lib/logs/console/logger'
import { fetchAgentsFromApi } from '@/app/(auth)/login/voiceCakeApi'
import { ToolbarBlock } from '../sidebar/components/toolbar/components/toolbar-block/toolbar-block'

const logger = createLogger('AgentsSection')

export function AgentsSection({ userPermissions }: any) {
  const [agents, setAgents] = useState<any[]>([])
  const [activeAgentId, setActiveAgentId] = useState<number | null>(null)
  const fetchAgents = useCallback(async () => {
    try {
      const data = await fetchAgentsFromApi()
      setAgents(data?.data ?? [])
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
  const agentList = Array.isArray(agents) && agents.length > 0 ? agents : []
  const agentConfigs = agentList.map((agent) => ({
    id: agent.id,
    config: {
      type: 'connectionBlock', // always connectionBlock
      name: agent.name,
      bgColor: '#4f46e5', // example same color for all
      icon: agent.avatar_url
        ? () => <Image src={agent.avatar_url} alt={agent.name} className='h-4 w-4 rounded-full' />
        : Bot, // fallback icon
    },
    disabled: !userPermissions.canEdit,
  }))
  return (
    <>
      {agentList.length > 0 && (
        <div className='mb-2 rounded-[8px] border bg-background p-3'>
          <div className='flex max-h-32 flex-col gap-1 overflow-y-auto'>
            <div className='flex max-h-32 flex-col gap-1 overflow-y-auto'>
              {agentConfigs.map(({ id, config, disabled }) => (
                <ToolbarBlock key={id} config={config} disabled={disabled} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
