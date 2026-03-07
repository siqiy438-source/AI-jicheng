import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type LineStatus = 'normal' | 'degraded' | 'down' | 'unknown'

export interface LineStatusMap {
  [lineId: string]: { status: LineStatus; latencyMs?: number | null }
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 分钟缓存

// 模块级缓存，跨组件实例共享，避免同一页面多次探测
let cachedStatuses: LineStatusMap | null = null
let cacheTimestamp: number | null = null

export function useLineStatus() {
  const [statuses, setStatuses] = useState<LineStatusMap>(cachedStatuses ?? {})
  const [loading, setLoading] = useState(!cachedStatuses)
  const fetchedRef = useRef(false)

  const fetchStatuses = useCallback(async (force = false) => {
    const now = Date.now()
    if (!force && cachedStatuses && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS) {
      setStatuses(cachedStatuses)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('line-health-check')
      if (error) throw error

      const map: LineStatusMap = {}
      for (const item of (data?.results ?? []) as { id: string; status: LineStatus; latencyMs: number | null }[]) {
        map[item.id] = { status: item.status, latencyMs: item.latencyMs }
      }

      cachedStatuses = map
      cacheTimestamp = Date.now()
      setStatuses(map)
    } catch (err) {
      console.warn('[useLineStatus] 健康检测失败', err)
      // 失败时保持当前状态（unknown 或上次缓存结果）
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchStatuses()
    }
  }, [fetchStatuses])

  return {
    statuses,
    loading,
    refresh: () => fetchStatuses(true),
  }
}
