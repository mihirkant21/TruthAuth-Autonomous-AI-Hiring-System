"use client";
import Link from "next/link";
import { ShieldCheck, Briefcase, User } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e17] text-white flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-purple-500/20 p-4 rounded-2xl mb-4">
          <ShieldCheck size={40} className="text-purple-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to TruthAuth</h1>
        <p className="text-slate-400 text-sm mt-2">Secure your multi-agent verification protocol</p>
      </div>

      <div className="bg-[#141c2b] border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-xl">
        <div className="space-y-6">
          <Link href="/hr-dashboard" className="block">
            <div className="group border border-slate-800 hover:border-purple-500/50 bg-[#0a0e17] p-5 rounded-xl transition-all cursor-pointer flex items-center gap-4">
               <div className="bg-slate-800 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <Briefcase size={20} className="text-slate-400 group-hover:text-purple-400" />
               </div>
               <div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-purple-400 transition-colors">Sign in as HR Admin</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage pipeline and verify truth dossiers.</p>
               </div>
            </div>
          </Link>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">Or continue with</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <Link href="/candidate-portal" className="block">
            <div className="group border border-slate-800 hover:border-purple-500/50 bg-[#0a0e17] p-5 rounded-xl transition-all cursor-pointer flex items-center gap-4">
               <div className="bg-slate-800 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <User size={20} className="text-slate-400 group-hover:text-purple-400" />
               </div>
               <div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-purple-400 transition-colors">Sign in as Candidate</h3>
                  <p className="text-xs text-slate-500 mt-1">Submit credentials and execution proofs.</p>
               </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
