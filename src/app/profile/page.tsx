'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Profile = {
  userName: string;
  companyName: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 animate-pulse">Loading Profile...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-rose-500 gap-4">
        <div>Failed to load profile.</div>
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
          <div className="text-sm text-slate-400">Settings</div>
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
            </div>

            {/* User Details */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{profile.userName}</h1>
              <p className="text-slate-500 font-medium mt-1">{profile.companyName}</p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
