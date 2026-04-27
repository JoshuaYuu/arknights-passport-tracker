import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthFormProps {
  onLoginSuccess: () => void;
}

export function AuthForm({ onLoginSuccess }: AuthFormProps) {
  const { login, register, forgotPassword } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username, password);
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || '登录失败');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(username, email, password);
    if (result.success) {
      setSuccess('注册成功！请登录');
      setView('login');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setError(result.error || '注册失败');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }

    setLoading(true);
    setError('');

    const result = await forgotPassword(email);
    if (result.success) {
      setSuccess(result.message || '重置码已发送');
    } else {
      setError(result.error || '找回密码失败');
    }
    setLoading(false);
  };

  if (view === 'register') {
    return (
      <div className="space-y-4">
        <div>
          <Label>用户名</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="输入用户名" />
        </div>
        <div>
          <Label>邮箱</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入邮箱（用于找回密码）" />
        </div>
        <div>
          <Label>密码</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" />
        </div>
        <div>
          <Label>确认密码</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-emerald-500">{success}</p>}
        <Button onClick={handleRegister} className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          注册
        </Button>
        <Button variant="ghost" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="w-full">
          已有账号？去登录
        </Button>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <div className="space-y-4">
        <div>
          <Label>邮箱地址</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入注册时的邮箱" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <div className="p-3 rounded text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
            {success}
          </div>
        )}
        <Button onClick={handleForgotPassword} className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          找回密码
        </Button>
        <Button variant="ghost" onClick={() => { setView('login'); setError(''); setSuccess(''); setEmail(''); }} className="w-full">
          返回登录
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>用户名</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="输入用户名" />
      </div>
      <div>
        <Label>密码</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleLogin} className="w-full" disabled={loading || !username}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
        登录
      </Button>
      <div className="flex flex-col gap-2">
        <Button variant="ghost" onClick={() => { setView('register'); setError(''); }} className="w-full">
          没有账号？去注册
        </Button>
        <Button variant="ghost" onClick={() => { setView('forgot'); setError(''); }} className="w-full text-slate-500">
          忘记密码？
        </Button>
      </div>
    </div>
  );
}
