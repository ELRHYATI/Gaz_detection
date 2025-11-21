import { useEffect, useState } from 'react'
import { subscribeMetrics, getCurrentMetrics, type ApmMetrics } from '../utils/apm'

export const useApmMetrics = (): ApmMetrics => {
  const [state, setState] = useState<ApmMetrics>(getCurrentMetrics())
  useEffect(() => {
    const unsub = subscribeMetrics((m) => setState(m))
    return () => unsub()
  }, [])
  return state
}

export default useApmMetrics