'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRelay } from '@/context/RelayContext';
import {
  ShieldCheck,
  UserCheck,
  Compass,
  ArrowRight,
  Lock,
  KeyRound,
  Sparkles,
  Info,
  CheckCircle2,
  FolderGit2,
  FileCheck2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsDemoUser } = useRelay();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const handleDemoLogin = async (userId: string, redirectPath = '/') => {
    setLoadingUser(userId);
    try {
      await loginAsDemoUser(userId);
      router.push(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setLoadingUser(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    // Check if email matches any demo user
    if (email.toLowerCase().includes('marcus')) {
      await handleDemoLogin('usr-marcus-04', '/');
      return;
    }
    if (email.toLowerCase().includes('elena')) {
      await handleDemoLogin('usr-elena-03', '/handovers');
      return;
    }
    if (email.toLowerCase().includes('maya')) {
      await handleDemoLogin('usr-maya-02', '/continuation');
      return;
    }

    setCustomError('In synthetic demo mode, please click one of the 3 preconfigured evaluation profiles below or use marcus@atlas.synthetic, elena@atlas.synthetic, or maya@atlas.synthetic.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-xl shadow-sm mb-3">
          R
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          RELAY Platform
        </h1>
        <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
          Evidence-Backed Project Continuity & Intelligent Handover Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-3xl px-4 sm:px-0 space-y-6">
        {/* Evaluator Welcome Banner */}
        <div className="bg-white border border-teal-200/80 rounded-2xl p-5 shadow-xs bg-gradient-to-r from-teal-50/40 via-white to-slate-50">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-teal-600 text-white shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded">
                  Independent Judge & Evaluator Mode
                </span>
                <span className="text-xs text-slate-500 font-mono">Zero Setup Required</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-1">
                Explore Preloaded Synthetic Project: Atlas
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Choose an evaluation role below to experience RELAY from different organizational perspectives. Each profile provides role-specific permissions, leak-proof evidence filters, and workflow capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* 1-Click Demo Profiles (Primary Interaction for Judges) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Marcus Vance - Admin */}
          <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Admin Role
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Marcus Vance
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">VP of Engineering / Admin</p>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Connect & sync GitLab repositories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Inspect restricted incident sources</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Initiate and share handovers</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLogin('usr-marcus-04', '/')}
              disabled={loadingUser !== null}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {loadingUser === 'usr-marcus-04' ? 'Authenticating...' : 'Sign In as Marcus (Admin)'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Elena Rostova - Reviewer */}
          <div className="bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <UserCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  Reviewer Role
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                Elena Rostova
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Lead Engineer & Reviewer</p>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Inspect 3D evidence ledger</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Adjudicate conflicting claims</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Review & approve handover drafts</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLogin('usr-elena-03', '/handovers')}
              disabled={loadingUser !== null}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {loadingUser === 'usr-elena-03' ? 'Authenticating...' : 'Sign In as Elena (Reviewer)'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Maya Chen - Incoming Member */}
          <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Compass className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Incoming Member
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Maya Chen
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Senior Engineer (Taking Over)</p>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Access continuation workspace</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero leakage of restricted incident data</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sign handover receipt acknowledgment</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLogin('usr-maya-02', '/continuation')}
              disabled={loadingUser !== null}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {loadingUser === 'usr-maya-02' ? 'Authenticating...' : 'Sign In as Maya (Incoming)'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Custom Credentials Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Lock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Custom Identity / Supabase Credentials
            </h3>
          </div>

          {customError && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              {customError}
            </div>
          )}

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcus.vance@atlas.synthetic"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Demo password (any)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Pre-authenticated demo mode active
              </span>
              <button
                type="submit"
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Sign In With Credentials
              </button>
            </div>
          </form>
        </div>

        {/* Footer Guarantee */}
        <p className="text-center text-[11px] text-slate-500">
          RELAY Final Round Submission &bull; CodePuneThinkers Hackathon &bull; 72-Hour Evaluation Window
        </p>
      </div>
    </div>
  );
}
