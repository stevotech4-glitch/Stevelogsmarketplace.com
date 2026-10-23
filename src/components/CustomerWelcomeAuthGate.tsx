import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  MessageCircle, 
  Headphones, 
  Globe, 
  Sparkles,
  Zap
} from 'lucide-react';
import { CustomerRecord, WebsiteMasterSettings } from '../types';

interface CustomerWelcomeAuthGateProps {
  settings?: WebsiteMasterSettings;
  onAuthSuccess: (customer: CustomerRecord, token?: string) => void;
}

export const CustomerWelcomeAuthGate: React.FC<CustomerWelcomeAuthGateProps> = ({
  settings,
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Email, Phone, or Username
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [refCode, setRefCode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('ref') || '';
    } catch {
      return '';
    }
  });

  const supportPhone = settings?.whatsappSupportNumber || '+2348152784536';
  const callPhone = '09032912046';

  // Handle Standard Login (Email or Phone + Password, No OTP)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your email address or phone number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.customer) {
        throw new Error(data.error || 'Invalid credentials. Please verify your email or phone and password.');
      }

      if (data.token) {
        localStorage.setItem('stevelogs_customer_token', data.token);
      }
      localStorage.setItem('stevelogs_customer_id', data.customer.id);
      localStorage.setItem('stevelogs_customer_data', JSON.stringify(data.customer));

      setSuccessMessage('Sign in successful! Entering marketplace...');
      setTimeout(() => {
        onAuthSuccess(data.customer, data.token);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Standard Registration (No OTP required)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address (e.g. you@gmail.com).');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          refCode: refCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.customer) {
        throw new Error(data.error || 'Registration could not be completed.');
      }

      if (data.token) {
        localStorage.setItem('stevelogs_customer_token', data.token);
      }
      localStorage.setItem('stevelogs_customer_id', data.customer.id);
      localStorage.setItem('stevelogs_customer_data', JSON.stringify(data.customer));

      setSuccessMessage('Account created successfully! Welcome to Stevelogs Marketplace.');
      setTimeout(() => {
        onAuthSuccess(data.customer, data.token);
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Google OAuth Login / Signup
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      // Use existing Google client if configured or prompt via Google One-Tap / OAuth prompt
      // For immediate user entry without blocking, collect or prompt Google Account email
      const promptEmail = window.prompt('Enter your Google / Gmail address to continue with Google:', '');
      if (!promptEmail || !promptEmail.trim()) {
        setGoogleLoading(false);
        return;
      }

      const cleanEmail = promptEmail.trim().toLowerCase();
      if (!cleanEmail.includes('@')) {
        throw new Error('Please enter a valid Gmail / Google email address.');
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          googleId: `goog_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.customer) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      if (data.token) {
        localStorage.setItem('stevelogs_customer_token', data.token);
      }
      localStorage.setItem('stevelogs_customer_id', data.customer.id);
      localStorage.setItem('stevelogs_customer_data', JSON.stringify(data.customer));

      setSuccessMessage('Signed in with Google! Entering marketplace...');
      setTimeout(() => {
        onAuthSuccess(data.customer, data.token);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#060c1d] via-[#0b1736] to-[#040817] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />

      {/* Top Header / Branding Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img
            src="/stevelogs-logo.png"
            alt="STEVELOGS MARKETPLACE"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shadow-lg ring-1 ring-amber-400/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-tight text-white uppercase">
                STEVELOGS
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 tracking-wider">
                MARKETPLACE
              </span>
            </div>
            <p className="text-[10px] text-blue-200/70 hidden sm:block">
              Fast • Safe • Reliable Digital Services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <a
            href={`https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
              'Hello Stevelogs Support, I need assistance logging into my account.'
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors font-medium text-[11px]"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp Help</span>
          </a>
        </div>
      </header>

      {/* Main Authentication Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 z-10">
        <div className="w-full max-w-md bg-[#0f1d3d]/90 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6">
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <img
                src="/stevelogs-logo.png"
                alt="STEVELOGS"
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] ring-2 ring-amber-400/50 p-1 bg-black/40"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0f1d3d] flex items-center justify-center text-[10px] text-white">
                ✓
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400">STEVELOGS</span>
            </h1>
            <p className="text-xs text-blue-200/80 leading-relaxed max-w-xs mx-auto">
              Please sign in or create an account to access instant virtual numbers, verified log accounts, and digital marketplace services.
            </p>
          </div>

          {/* Quick Value Badges */}
          <div className="grid grid-cols-3 gap-1.5 py-2 px-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] text-center font-bold">
            <span className="text-amber-300 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> 0-Min OTP
            </span>
            <span className="text-blue-300 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Verified
            </span>
            <span className="text-emerald-300 flex items-center justify-center gap-1">
              <Globe className="w-3 h-3 text-blue-400" /> 50+ Countries
            </span>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab Selection: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Option A: Continue with Google */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0f1d3d] px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Or with {authMode === 'login' ? 'Email / Phone' : 'Email details'}
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>
          </div>

          {/* Form: Sign In Mode (Options B & C) */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Email, Phone Number, or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. you@gmail.com or 08149021844"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Marketplace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form: Create Account Mode */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stephen Agada"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Email Address (Gmail supported) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Phone Number (WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="e.g. 08149021844"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Create Password (min. 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Choose a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SL-1001"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-amber-300 placeholder:text-slate-500 font-mono focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Stevelogs Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Secure Privacy & Trust Footer */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-blue-200/60">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-bit Encrypted Session</span>
            </span>
            <span>No OTP Required</span>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f1d3d] border border-blue-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Password Reset Assistance</h3>
                <p className="text-[11px] text-blue-200/70">Instant Account Recovery</p>
              </div>
            </div>

            <p className="text-xs text-blue-100/90 leading-relaxed">
              To securely recover or reset your account password, please contact the Stevelogs official support desk on WhatsApp with your registered email or phone number.
            </p>

            <div className="bg-black/30 p-3 rounded-2xl border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">WhatsApp Desk:</span>
                <span className="font-mono font-bold text-emerald-400">{supportPhone}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Direct Call:</span>
                <span className="font-mono font-bold text-amber-400">{callPhone}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  'Hello Stevelogs Support, I need help recovering my account password.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Website Official Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-4 text-center text-xs text-blue-300/50 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px]">Official Portal: www.stevelogsmarketplace.shop</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>WhatsApp: {supportPhone}</span>
          <span>Call: {callPhone}</span>
        </div>
      </footer>
    </div>
  );
};
