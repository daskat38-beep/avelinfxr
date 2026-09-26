import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
      
      <main className="z-10 flex flex-col items-center text-center space-y-8 max-w-3xl">
        <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          Breakout Music Record
        </h1>
        
        <p className="text-xl text-gray-300 leading-relaxed">
          The next generation platform for independent artists. Distribute your music, track your royalties, and manage your releases all in one place.
        </p>
        
        <div className="flex gap-4 pt-4">
          <a href="/login" className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Artist Portal
          </a>
          <a href="/dashboard" className="px-8 py-3 rounded-full bg-transparent border border-gray-600 hover:border-white hover:bg-white/10 transition-all">
            Admin Access
          </a>
        </div>
      </main>
      
      <footer className="absolute bottom-8 text-gray-500 text-sm">
        © {new Date().getFullYear()} Breakout Music Record. All rights reserved.
      </footer>
    </div>
  );
}
