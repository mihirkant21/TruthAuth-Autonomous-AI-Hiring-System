"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import JobForm from "@/components/JobForm";
import KanbanBoard from "@/components/KanbanBoard";
import Link from "next/link";
import { ShieldCheck, LayoutDashboard, Users, Activity, Clock, CheckCircle2 } from "lucide-react";

export default function HRDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchJobs = async () => {
    const res = await axios.get("http://127.0.0.1:8000/jobs/");
    setJobs(res.data);
    if (res.data.length > 0 && !selectedJob) {
      setSelectedJob(res.data[res.data.length - 1].id);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-sans flex">
      {/* Sidebar */}
      <div className="w-[260px] bg-[#111827] border-r border-slate-800 flex flex-col shrink-0">
         <div className="p-6 flex items-center gap-3">
            <ShieldCheck size={24} className="text-purple-400" />
            <span className="font-bold text-xl tracking-tight">TruthAuth</span>
         </div>
         
         <div className="flex-1 py-4 flex flex-col gap-1 px-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-purple-500/10 text-purple-400 rounded-lg font-medium text-sm border border-purple-500/20">
               <LayoutDashboard size={18}/> Dashboard
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium text-sm transition-colors cursor-pointer">
               <Users size={18}/> Candidates
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium text-sm transition-colors cursor-pointer">
               <Clock size={18}/> Timeline
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium text-sm transition-colors cursor-pointer">
               <CheckCircle2 size={18}/> Verifications
            </div>
         </div>
         
         <div className="p-6">
           <div className="app-card p-4 flex flex-col gap-2">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
               <ShieldCheck size={16} className="text-purple-400"/> System Secured
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">All evaluations are encrypted and verified via local GLM-4 protocols.</p>
           </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-[72px] border-b border-slate-800 flex items-center justify-end px-8 bg-[#0a0e17]">
          <Link href="/">
             <div className="flex items-center gap-3 cursor-pointer group">
               <div className="text-right">
                 <p className="text-sm font-bold text-slate-200 group-hover:text-purple-400 transition-colors">HR Admin</p>
                 <p className="text-xs text-slate-500">Log out</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
                 HR
               </div>
             </div>
          </Link>
        </header>

        {/* Scrolling Workspace */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
           <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                  Dashboard <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">Welcome back! Here's an overview of the pipeline.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 mb-2">
                 <div className="flex-1">
                   <JobForm onJobCreated={fetchJobs} />
                 </div>
                 
                 <div className="app-card p-6 flex flex-col justify-center border-slate-700 min-w-[300px]">
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <p className="text-xs text-slate-400 font-medium mb-1">Active Job Context</p>
                        <select 
                          className="bg-transparent border-none outline-none text-lg font-bold text-slate-200 w-full cursor-pointer appearance-none truncate"
                          value={selectedJob?.toString() || ""} 
                          onChange={e => setSelectedJob(e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="" className="bg-slate-900 text-base">Select Job...</option>
                          {jobs.map(j => <option key={j.id} value={j.id} className="bg-slate-900 text-base">{j.title}</option>)}
                        </select>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg text-slate-300 shrink-0 ml-2">
                        <LayoutDashboard size={20}/>
                      </div>
                    </div>
                 </div>
              </div>

              <KanbanBoard jobId={selectedJob} refreshTrigger={refreshTrigger} />
           </div>
        </div>
      </div>
    </div>
  );
}
