import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, AlertCircle, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const { login, language, setLanguage } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (login(email, password)) {
      navigate('/dashboard');
    } else {
      setError(language === 'th' 
        ? 'อีเมลไม่ถูกต้อง กรุณาใช้อีเมลทดสอบด้านล่าง' 
        : 'Invalid email. Please use one of the demo accounts below.');
    }
    setIsLoading(false);
  };

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
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
          © 2024 VA Workflow System
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

          {/* Test account */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === 'th' ? 'บัญชีทดสอบ' : 'Test Account'}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'th' 
                  ? 'คลิกเพื่อเติมข้อมูลอัตโนมัติ' 
                  : 'Click to auto-fill credentials'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => handleDemoLogin('thitichot@dit.daikin.co.jp', '075727')}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-accent-foreground/20 transition-colors"
              >
                <p className="font-medium text-sm text-foreground">Admin — Thitichot</p>
                <p className="text-xs text-muted-foreground">thitichot@dit.daikin.co.jp</p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
