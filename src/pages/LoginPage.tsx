import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { authApi, setAuthToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Mail, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const { login, language, setLanguage, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Authenticate via backend API
      const result = await authApi.login(email, password);
      if (result.success && result.data) {
        setAuthToken(result.data.token);
        setCurrentUser({
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          nameTh: result.data.user.nameTh,
          role: result.data.user.role as any,
          department: result.data.user.department,
          departmentTh: result.data.user.departmentTh,
          plant: result.data.user.plant,
        });
        navigate('/');
      } else {
        setError(
          language === 'th'
            ? result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
            : result.error || 'Invalid email or password'
        );
      }
    } catch {
      setError(
        language === 'th'
          ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่'
          : 'Cannot connect to server. Please try again.'
      );
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-12"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">VA</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Workflow</h1>
              <p className="text-primary-foreground/70 text-sm">Approval System</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
            {language === 'th' 
              ? 'ระบบอนุมัติ VA Proposal\nดิจิทัลเต็มรูปแบบ' 
              : 'Digitize Your\nVA Proposal Workflow'}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            {language === 'th'
              ? 'จัดการคำขอ VA, การอนุมัติ และบันทึกตรวจสอบได้อย่างมีประสิทธิภาพในที่เดียว'
              : 'Streamline VA requests, approvals, and audit trails in one integrated platform.'}
          </p>
          <div className="flex gap-4 text-primary-foreground/60 text-sm">
            <span>✓ Sequential & Parallel Approval</span>
            <span>✓ PDF/Excel Export</span>
          </div>
        </div>

        <div className="text-primary-foreground/50 text-sm">
          © 2026 VA Workflow System
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Language toggle */}
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
            >
              {language === 'en' ? '🇹🇭 ภาษาไทย' : '🇺🇸 English'}
            </Button>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {language === 'th' 
                ? 'เข้าสู่ระบบเพื่อจัดการ VA Proposals' 
                : 'Access your VA Proposal workflow dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive-light text-destructive text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {language === 'th' ? 'อีเมล' : 'Email'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === 'th' ? 'รหัสผ่าน' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              size="xl" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading 
                ? (language === 'th' ? 'กำลังเข้าสู่ระบบ...' : 'Signing in...') 
                : (language === 'th' ? 'เข้าสู่ระบบ' : 'Sign In')}
              {!isLoading && <ChevronRight size={20} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
