"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import JobForm from "@/components/JobForm";
import KanbanBoard from "@/components/KanbanBoard";
import Link from "next/link";
import { ShieldCheck, LayoutDashboard, Users, Clock, CheckCircle2, Trash2 } from "lucide-react";

export default function HRDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"dashboard" | "candidates">("dashboard");

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
            <div 
               onClick={() => setActiveTab("dashboard")} 
               className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
               <LayoutDashboard size={18}/> Dashboard
            </div>
            <div 
               onClick={() => setActiveTab("candidates")} 
               className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab === 'candidates' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
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
              {activeTab === "dashboard" ? (
                 <>
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
                 </>
              ) : (
                 <CandidatesTracker />
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function CandidatesTracker() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [retranscribingId, setRetranscribingId] = useState<number | null>(null);

  const fetchAll = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/candidates/all");
      setCandidates(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
    const int = setInterval(fetchAll, 3000);
    return () => clearInterval(int);
  }, []);

  const deleteApplicant = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      try {
          await axios.delete(`http://127.0.0.1:8000/candidates/${id}`);
          fetchAll();
      } catch (err) {
          console.error("Failed to delete", err);
      }
  };

  const retranscribe = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setRetranscribingId(id);
      try {
          await axios.post(`http://127.0.0.1:8000/candidates/${id}/retranscribe`);
          await fetchAll();
      } catch (err) {
          console.error("Retranscribe failed", err);
          alert("Re-transcription failed — check if audio file exists in backend/uploads/");
      } finally {
          setRetranscribingId(null);
      }
  };

  const interviews = candidates.filter(c => !["NEW", "EXTRACTED"].includes(c.stage));

  return (
    <div className="space-y-6">
       <div>
           <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
             Active Agent Scrutiny <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           </h1>
           <p className="text-sm text-slate-400 mt-1">Real-time trace of candidates interacting with the AI module.</p>
       </div>
       
       {interviews.length === 0 ? (
          <div className="text-center py-20 border border-slate-800 border-dashed rounded-xl bg-[#0a0e17]">
             <p className="text-slate-500 text-sm font-medium">No active interview sessions occurring.</p>
          </div>
       ) : (
          <div className="grid grid-cols-1 gap-4 mt-6">
            {interviews.map(c => (
              <div key={c.id} className="app-card border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.05)] bg-[#111827] overflow-hidden">
                <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                   <div>
                      <h3 className="font-bold text-slate-200">{c.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">Undergoing validation algorithms</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className={`${["HIRED", "REJECTED", "TRUTH_VERIFIED"].includes(c.stage) ? "hidden" : "animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${["HIRED", "REJECTED", "TRUTH_VERIFIED"].includes(c.stage) ? "bg-slate-500" : "bg-purple-500"}`}></span>
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${["HIRED", "REJECTED", "TRUTH_VERIFIED"].includes(c.stage) ? "text-slate-500" : "text-purple-400"}`}>
                           {["HIRED", "REJECTED", "TRUTH_VERIFIED"].includes(c.stage) ? "COMPLETED" : "ACTIVE"}
                        </span>
                      </div>
                      <button onClick={(e) => deleteApplicant(e, c.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors">
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>

                {expandedId === c.id && (
                   <div className="border-t border-slate-800 p-6 bg-[#0a0e17] space-y-6">
                      
                      {/* Interview Transcript */}
                      <div>
                         <div className="flex items-center justify-between mb-3">
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recorded Transcript</p>
                           <button
                             onClick={(e) => retranscribe(e, c.id)}
                             disabled={retranscribingId === c.id}
                             className="text-[10px] font-bold uppercase tracking-widest text-purple-400 hover:text-purple-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                           >
                             {retranscribingId === c.id ? "Processing..." : "↻ Re-transcribe"}
                           </button>
                         </div>
                         <div className="bg-[#141c2b] border border-slate-800 rounded-lg p-4">
                            {c.interview_transcript ? (
                               <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-purple-500 pl-3">"{c.interview_transcript}"</p>
                            ) : (
                               <p className="text-sm text-slate-500 italic">No audio transcript generated.</p>
                            )}
                         </div>
                      </div>

                      {/* Project/Task Details */}
                      <div>
                         <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Submission Details</p>
                            {c.observed_data?.mcq_score && <span className="text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded">Score: {c.observed_data.mcq_score}</span>}
                         </div>
                         <div className="bg-[#141c2b] border border-slate-800 rounded-lg overflow-hidden">
                            {(c.observed_data?.task_url || c.observed_data?.submission) ? (
                               <div className="p-4 space-y-3">
                                  {c.observed_data.task_url && (
                                     <div>
                                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Portfolio / Repository</p>
                                        <a 
                                            href={(c.observed_data.task_url || "").startsWith("http") ? c.observed_data.task_url : `https://${c.observed_data.task_url}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 break-all"
                                        >
                                            {c.observed_data.task_url}
                                        </a>
                                     </div>
                                  )}
                                  {c.observed_data.submission && c.observed_data.submission !== "-" && (
                                     <div>
                                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Solution Description</p>
                                        <p className="text-sm text-slate-300">{c.observed_data.submission}</p>
                                     </div>
                                  )}
                                  {c.observed_data?.code_answers && Object.keys(c.observed_data.code_answers).length > 0 && (
                                     <div className="pt-2 border-t border-slate-800/50">
                                         <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Code Answers</p>
                                         <div className="bg-[#0a0e17] p-3 rounded border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {Object.entries(c.observed_data.code_answers).map(([k, v]) => `${Number(k)+1}. ${v}`).join("\n\n")}
                                         </div>
                                     </div>
                                  )}
                               </div>
                            ) : (
                               <div className="p-4 text-sm text-slate-500 text-center">No project artifacts submitted by candidate yet.</div>
                            )}
                         </div>
                      </div>

                   </div>
                )}
              </div>
            ))}
          </div>
       )}
    </div>
  )
}
