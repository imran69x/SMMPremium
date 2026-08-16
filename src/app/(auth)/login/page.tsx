"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Zap } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import GlowingButton from '@/components/ui/GlowingButton';
import '../auth.css';

export default function AuthPage() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      router.push('/dashboard');
    } catch (err: any) {
      setLoginError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = userCredential.user;

      await updateProfile(user, { displayName: regName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: regName,
        role: 'customer',
        balance: 0,
        createdAt: new Date().toISOString()
      });

      router.push('/dashboard');
    } catch (err: any) {
      setRegError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError('');
    setRegError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Google User',
          role: 'customer',
          balance: 0,
          createdAt: new Date().toISOString()
        });
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      if (isActive) setRegError(err.message);
      else setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="auth-body">
      <div className={`auth-container ${isActive ? 'active' : ''}`}>
        
        {/* Login Form */}
        <div className="form-box login">
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="flex justify-center items-center gap-2 mb-2">
              <Zap className="h-6 w-6 text-[#FF6B00]" />
              <span className="font-bold text-xl tracking-tight text-slate-900">SMM<span className="text-[#FF6B00]">Premium</span></span>
            </div>
            <h1>Login</h1>
            
            {loginError && <div className="auth-error">{loginError}</div>}
            
            <div className="auth-input-box">
              <input type="email" placeholder="Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <Mail className="h-5 w-5" />
            </div>
            <div className="auth-input-box">
              <input type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              <Lock className="h-5 w-5" />
            </div>
            
            <div className="forgot-link">
              <a href="#">Forgot Password?</a>
            </div>
            
            <GlowingButton 
              color="#FF6B00" 
              bgColor="#ffffff"
              className="w-full h-12"
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </GlowingButton>
            
            <p>or login with social platforms</p>
            <div className="social-icons">
              <button type="button" onClick={handleGoogleSignIn} disabled={loading}><GoogleIcon /></button>
            </div>
          </form>
        </div>

        {/* Register Form */}
        <div className="form-box register">
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="flex justify-center items-center gap-2 mb-2">
              <Zap className="h-6 w-6 text-[#FF6B00]" />
              <span className="font-bold text-xl tracking-tight text-slate-900">SMM<span className="text-[#FF6B00]">Premium</span></span>
            </div>
            <h1>Registration</h1>

            {regError && <div className="auth-error">{regError}</div>}

            <div className="auth-input-box">
              <input type="text" placeholder="Username" required value={regName} onChange={e => setRegName(e.target.value)} />
              <User className="h-5 w-5" />
            </div>
            <div className="auth-input-box">
              <input type="email" placeholder="Email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              <Mail className="h-5 w-5" />
            </div>
            <div className="auth-input-box">
              <input type="password" placeholder="Password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              <Lock className="h-5 w-5" />
            </div>
            
            <GlowingButton 
              color="#FF6B00" 
              bgColor="#ffffff"
              className="w-full h-12"
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </GlowingButton>
            
            <p>or register with social platforms</p>
            <div className="social-icons">
              <button type="button" onClick={handleGoogleSignIn} disabled={loading}><GoogleIcon /></button>
            </div>
          </form>
        </div>

        {/* Toggle Panel */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button type="button" className="auth-btn register-btn" onClick={() => setIsActive(true)}>Register</button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button type="button" className="auth-btn login-btn" onClick={() => setIsActive(false)}>Login</button>
          </div>
        </div>

      </div>
    </div>
  );
}
