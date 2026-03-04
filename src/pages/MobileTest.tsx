import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/PageLayout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function MobileTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTests = async () => {
    setTestResults([])
    setError(null)

    try {
      // 测试 1: 检查 Supabase 连接
      addResult('测试 1: 检查 Supabase 连接...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        addResult(`❌ 认证失败: ${authError.message}`)
      } else {
        addResult(`✅ 认证成功: ${user?.email || '未登录'}`)
      }

      // 测试 2: 查询会话表
      addResult('测试 2: 查询视频分析会话表...')
      const { data: sessions, error: queryError } = await supabase
        .from('video_analysis_sessions')
        .select('id, status, created_at')
        .limit(5)

      if (queryError) {
        addResult(`❌ 查询失败: ${queryError.message}`)
        addResult(`错误代码: ${queryError.code}`)
        addResult(`错误详情: ${JSON.stringify(queryError.details)}`)
        setError(queryError.message)
      } else {
        addResult(`✅ 查询成功: 找到 ${sessions?.length || 0} 个会话`)
        sessions?.forEach((s, i) => {
          addResult(`  会话 ${i + 1}: ${s.id.substring(0, 8)}... (${s.status})`)
        })
      }

      // 测试 3: 检查浏览器信息
      addResult('测试 3: 浏览器信息')
      addResult(`User Agent: ${navigator.userAgent}`)
      addResult(`平台: ${navigator.platform}`)
      addResult(`在线状态: ${navigator.onLine ? '在线' : '离线'}`)

      // 测试 4: 检查存储
      addResult('测试 4: 检查本地存储')
      try {
        localStorage.setItem('test', 'test')
        localStorage.removeItem('test')
        addResult('✅ localStorage 可用')
      } catch (e) {
        addResult(`❌ localStorage 不可用: ${e}`)
      }

    } catch (e: any) {
      addResult(`❌ 测试过程出错: ${e.message}`)
      setError(e.message)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">手机端诊断测试</h1>
          <Button onClick={runTests}>重新测试</Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold mb-2">测试结果：</h2>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">正在运行测试...</p>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {testResults.map((result, i) => (
                <div key={i} className="text-foreground">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p>这个页面用于诊断手机端的问题。</p>
          <p>如果看到错误，请截图发给开发者。</p>
        </div>
      </div>
    </PageLayout>
  )
}
