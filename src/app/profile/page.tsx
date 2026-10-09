'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type UserData = {
  name: string;
  email: string;
  createdAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 animate-pulse">Loading Profile...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-rose-500 gap-4">
        <div>Failed to load profile.</div>
        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="text-sm text-slate-400">Personal Account</div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative"></div>
          
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-16 mb-6 flex justify-between items-end">
              <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-5xl border border-slate-200">
                  👤
                </div>
              </div>
              <button className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors border border-slate-200 shadow-sm mb-2">
                Edit Profile
              </button>
            </div>

            {/* User Details */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-slate-500 font-medium mt-1">{user.email}</p>
            </div>

            {/* Info Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Account ID</div>
                <div className="font-mono text-sm text-slate-700 break-all">{btoa(user.email).substring(0, 16)}...</div>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Member Since</div>
                <div className="text-sm font-medium text-slate-700">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' }) : 'Recently'}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Security</h3>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Password</div>
                  <div className="text-slate-500 text-xs mt-0.5">Last changed recently</div>
                </div>
                <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700">Update</button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
