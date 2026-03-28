"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import CandidatePortal from "@/components/CandidatePortal";
import Link from "next/link";
import { User, Activity, ShieldCheck, ArrowLeft } from "lucide-react";

export default function CandidatePage() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("http://10.2.15.61:8000/jobs/");
        setJobs(res.data);
      } catch (err) {
        console.warn("Failed to fetch jobs:", err);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-sans flex">
      {/* Left Branding Sidebar */}
      <div className="w-[280px] bg-[#111827] border-r border-slate-800 flex flex-col shrink-0 hidden lg:flex">
         <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <ShieldCheck size={24} className="text-purple-400" />
            <span className="font-bold text-xl tracking-tight">TruthAuth</span>
         </div>
         
         <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Candidate Status</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Complete your identity initialization. Your submissions will be processed via autonomous truth verification.
              </p>
            </div>

            <div className="app-card p-4 shadow-sm border-slate-700">
               <div className="flex items-center gap-3 mb-3 text-slate-200 font-bold text-sm">
                 <Activity size={16} className="text-purple-400"/> System Nodes
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium tracking-wide">Secure Link</span>
                    <span className="text-purple-400 font-bold">ONLINE</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium tracking-wide">Verification Engine</span>
                    <span className="text-purple-400 font-bold">ACTIVE</span>
                 </div>
               </div>
            </div>
         </div>
         
         <div className="p-6 border-t border-slate-800">
            <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 font-medium hover:text-slate-200 transition-colors">
               <ArrowLeft size={16} /> Return to Home
            </Link>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-[72px] border-b border-slate-800 flex items-center justify-between px-8 bg-[#0a0e17]">
          <h2 className="text-lg font-bold text-slate-200">Candidate Evaluation Portal</h2>
          <div className="flex items-center gap-3 cursor-pointer group">
             <div className="text-right">
               <p className="text-sm font-bold text-slate-200 group-hover:text-purple-400 transition-colors">Applicant Node</p>
               <p className="text-xs text-slate-500">Unverified</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
               <User size={20}/>
             </div>
          </div>
        </header>

        {/* Scrolling Workspace */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
           <div className="w-full max-w-2xl mx-auto">
              <CandidatePortal jobs={jobs} />
           </div>
        </div>
      </div>
    </div>
  );
}
