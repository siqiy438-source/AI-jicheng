import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'

type AuthView = 'tabs' | 'forgot' | 'reset'
type AuthTab = 'signin' | 'signup'

function isRecoveryMode(search: string, hash: string) {
  const queryParams = new URLSearchParams(search)
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))

  return (
    queryParams.get('mode') === 'reset' ||
    queryParams.get('type') === 'recovery' ||
    hashParams.get('type') === 'recovery'
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = (location.state as { from?: string } | null)?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activeTab, setActiveTab] = useState<AuthTab>('signin')
  const [view, setView] = useState<AuthView>(() =>
    isRecoveryMode(location.search, location.hash) ? 'reset' : 'tabs'
  )
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, resetPasswordForEmail, updatePassword } = useAuth()

  useEffect(() => {
    if (isRecoveryMode(location.search, location.hash)) {
      setView('reset')
    }
  }, [location.search, location.hash])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast.error('登录失败', { description: error.message })
    } else {
      toast.success('登录成功')
      navigate(fromPath)
    }

    setLoading(false)
  }

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const targetEmail = forgotEmail.trim()
    const { error } = await resetPasswordForEmail(targetEmail)

    if (error) {
      toast.error('发送失败', { description: error.message })
    } else {
      toast.success('重置邮件已发送', { description: '请查收邮箱并点击邮件中的链接设置新密码。' })
      setEmail(targetEmail)
      setForgotEmail('')
      setActiveTab('signin')
      setView('tabs')
    }

    setLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error('密码至少 6 位')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setLoading(true)

    const { error } = await updatePassword(newPassword)

    if (error) {
      toast.error('重置失败', { description: error.message })
    } else {
      toast.success('密码已更新', { description: '你已重新登录，即将返回首页。' })
      setNewPassword('')
      setConfirmPassword('')
      navigate('/')
    }

    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      toast.error('注册失败', { description: error.message })
    } else {
      toast.success('注册成功', { description: '欢迎加入，已自动登录！' })
      navigate(fromPath)
    }

    setLoading(false)
  }

  return (
    <div className="app-shell flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">AI 创作平台</span>
        </div>

        <Card className="border-border/50 shadow-lg">
          {view === 'tabs' ? (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthTab)} className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">登录</TabsTrigger>
                  <TabsTrigger value="signup">注册</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-center">
                      登录你的账号，开始 AI 创作之旅
                    </CardDescription>
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">邮箱</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">密码</Label>
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => {
                            setForgotEmail(email)
                            setView('forgot')
                          }}
                        >
                          忘记密码？
                        </button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          登录中...
                        </>
                      ) : (
                        '登录'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-center">
                      创建新账号，解锁全部 AI 功能
                    </CardDescription>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">邮箱</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">密码</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="至少6位字符"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          注册中...
                        </>
                      ) : (
                        '注册'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          ) : null}

          {view === 'forgot' ? (
            <form onSubmit={handleSendResetEmail}>
              <CardHeader className="pb-4">
                <CardTitle className="text-center">找回密码</CardTitle>
                <CardDescription className="text-center">
                  输入注册邮箱，我们会发送重置密码链接。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">邮箱</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setView('tabs')} disabled={loading}>
                  返回
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    '发送重置邮件'
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : null}

          {view === 'reset' ? (
            <form onSubmit={handleUpdatePassword}>
              <CardHeader className="pb-4">
                <CardTitle className="text-center">设置新密码</CardTitle>
                <CardDescription className="text-center">
                  请输入新密码并确认，两次输入需一致。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="至少6位字符"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '确认修改密码'
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : null}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/" className="hover:text-primary transition-colors">
            ← 返回首页
          </Link>
        </p>

        {/* 备案号 */}
        <div className="text-center mt-8">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            黔ICP备2026001006号
          </a>
        </div>
      </div>
    </div>
  )
}
