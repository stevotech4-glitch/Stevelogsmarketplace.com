import React, { useState, useEffect } from 'react';
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
  Zap,
  KeyRound,
  X,
  ExternalLink
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

  const supportPhone = settings?.whatsappSupportNumber || '+2348149021844';
  const callPhone = settings?.callPhoneNumber || '08149021844';

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

  // Password Reset 3-Step Flow State
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [devResetCode, setDevResetCode] = useState<string | null>(null);

  // Google OAuth Flow State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [googleManualEmail, setGoogleManualEmail] = useState('');

  // Auto-initialize Google Identity Services if client ID is configured
  useEffect(() => {
    fetch('/api/auth/google/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg && cfg.configured && cfg.clientId) {
          setGoogleConfigured(true);
          const w = window as any;
          if (w.google?.accounts?.id) {
            try {
              w.google.accounts.id.initialize({
                client_id: cfg.clientId,
                callback: (resp: any) => {
                  if (resp.credential) {
                    handleGoogleJwtCredential(resp.credential);
                  }
                },
              });
            } catch (e) {
              console.warn('GIS init notice:', e);
            }
          }
        } else {
          setGoogleConfigured(false);
        }
      })
      .catch(() => setGoogleConfigured(false));
  }, []);

  const handleGoogleJwtCredential = async (credential: string) => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
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
      setErrorMessage(err.message || 'Google authentication error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Real Google OAuth Login / Signup
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      const configRes = await fetch('/api/auth/google/config').then((r) => r.json()).catch(() => null);
      if (configRes && configRes.configured && configRes.clientId) {
        const w = window as any;
        if (w.google?.accounts?.id) {
          try {
            w.google.accounts.id.initialize({
              client_id: configRes.clientId,
              callback: (resp: any) => {
                if (resp.credential) {
                  handleGoogleJwtCredential(resp.credential);
                }
              },
            });
            w.google.accounts.id.prompt((notification: any) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
                  configRes.clientId
                )}&redirect_uri=${encodeURIComponent(
                  configRes.redirectUri
                )}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account`;
                window.location.href = googleAuthUrl;
              }
            });
            return;
          } catch (gisErr) {
            console.warn('GIS prompt error:', gisErr);
          }
        }

        // Genuine Google OAuth 2.0 flow
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          configRes.clientId
        )}&redirect_uri=${encodeURIComponent(
          configRes.redirectUri
        )}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account`;
        window.location.href = googleAuthUrl;
        return;
      }

      // If Google Client ID is not configured in backend settings, show transparent modal
      setGoogleConfigured(false);
      setGoogleModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in check failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleManualGoogleAuth = async (emailToAuth: string) => {
    const cleanEmail = emailToAuth.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    setGoogleLoading(true);
    try {
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

      setGoogleModalOpen(false);
      setSuccessMessage('Signed in with Google! Entering marketplace...');
      setTimeout(() => {
        onAuthSuccess(data.customer, data.token);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Step 1: Request Password Reset Code
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetNotice(null);

    const emailToReset = (resetEmail || identifier).trim().toLowerCase();
    if (!emailToReset || !emailToReset.includes('@')) {
      setResetError('Please enter a valid registered email address.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToReset }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No customer account found with this email.');
      }

      setResetEmail(emailToReset);
      if (data.code) {
        setDevResetCode(data.code);
        setResetNotice(data.message || `Verification code: ${data.code}`);
      } else {
        setResetNotice(data.message || 'Verification code sent to your email.');
      }
      setResetStep(2);
    } catch (err: any) {
      setResetError(err.message || 'Failed to request reset code.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify 6-digit Code
  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetNotice(null);

    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setResetError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      setResetStep(3);
      setResetNotice('Code verified! Enter your new password below.');
    } catch (err: any) {
      setResetError(err.message || 'Verification failed.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 3: Complete Password Reset
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetNotice(null);

    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setForgotPasswordOpen(false);
      setSuccessMessage('Password reset successfully! All balances and records preserved. Please sign in.');
      setAuthMode('login');
      setIdentifier(resetEmail);
      setPassword('');
      // Reset flow state
      setResetStep(1);
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setDevResetCode(null);
    } catch (err: any) {
      setResetError(err.message || 'Password reset error.');
    } finally {
      setResetLoading(false);
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

      {/* 3-Step Password Reset Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0f1d3d] border border-blue-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setForgotPasswordOpen(false);
                setResetStep(1);
                setResetError(null);
                setResetNotice(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Customer Password Reset</h3>
                <p className="text-[11px] text-blue-200/70">
                  Step {resetStep} of 3 • {resetStep === 1 ? 'Verify Email' : resetStep === 2 ? 'Enter Code' : 'New Password'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="grid grid-cols-3 gap-1.5 py-1">
              <div className={`h-1.5 rounded-full ${resetStep >= 1 ? 'bg-amber-400' : 'bg-white/10'}`} />
              <div className={`h-1.5 rounded-full ${resetStep >= 2 ? 'bg-amber-400' : 'bg-white/10'}`} />
              <div className={`h-1.5 rounded-full ${resetStep >= 3 ? 'bg-amber-400' : 'bg-white/10'}`} />
            </div>

            {resetNotice && (
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{resetNotice}</span>
                  {devResetCode && resetStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setResetCode(devResetCode)}
                      className="block mt-1 font-mono font-bold text-amber-300 underline text-[11px] cursor-pointer"
                    >
                      Click here to auto-fill test code: {devResetCode}
                    </button>
                  )}
                </div>
              </div>
            )}

            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Step 1: Request Code by Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="space-y-3.5">
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Enter your registered account email. A 6-digit verification code will be generated to securely reset your password.
                </p>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={resetEmail || identifier}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Wallet balance, order history & account data are 100% preserved.</span>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{resetLoading ? 'Generating Code...' : 'Send Verification Code'}</span>
                </button>
              </form>
            )}

            {/* Step 2: Enter Verification Code */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyResetCode} className="space-y-3.5">
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Enter the 6-digit verification code sent to <strong className="text-amber-300 font-mono">{resetEmail}</strong>.
                </p>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-lg py-2.5 rounded-xl bg-black/40 border border-white/10 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || resetCode.length !== 6}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{resetLoading ? 'Verifying...' : 'Verify Code'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {resetStep === 3 && (
              <form onSubmit={handleCompleteReset} className="space-y-3.5">
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Enter your new password below. It must be at least 6 characters long.
                </p>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-lg"
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{resetLoading ? 'Updating Password...' : 'Save Password & Sign In'}</span>
                </button>
              </form>
            )}

            {/* Support Desk Direct Contact */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <p className="text-[11px] text-blue-200/70">Need instant human help with your account?</p>
              <a
                href={`https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  'Hello Stevelogs Support, I need help recovering my account password.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-1.5 font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat with Official WhatsApp Support ({supportPhone})</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Google Sign-In Assistance / Direct Auth Modal */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0f1d3d] border border-blue-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl relative">
            <button
              type="button"
              onClick={() => setGoogleModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </div>
              <div>
                <h3 className="text-base font-bold">Google Authentication</h3>
                <p className="text-[11px] text-blue-200/70">Fast Sign-In & Registration</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
              Google OAuth client ID is not yet connected in the environment. You can enter your Google account email below to authenticate immediately, or the admin can add credentials in <strong className="text-white">Admin Settings &rarr; Google OAuth</strong>.
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleManualGoogleAuth(googleManualEmail);
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Your Google Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={googleManualEmail}
                    onChange={(e) => setGoogleManualEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={googleLoading || !googleManualEmail.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-700" /> : <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                <span>{googleLoading ? 'Connecting...' : 'Continue with this Google Email'}</span>
              </button>
            </form>
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
