"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import CandidatePortal from "@/components/CandidatePortal";
import Link from "next/link";
import { User, Activity, ShieldCheck, ArrowLeft, Briefcase, LayoutList, ChevronRight, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const STAGE_META: Record<string, { label: string; color: string }> = {
  NEW:            { label: "Processing",      color: "text-slate-400 bg-slate-800 border-slate-700" },
  EXTRACTED:      { label: "Profile Ready",   color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  SCREENED:       { label: "Screened",        color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  TASK_ASSIGNED:  { label: "Assessment Sent", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  TASK_COMPLETED: { label: "Under Review",    color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  INTERVIEWED:    { label: "Interview Stage", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  HIRED:          { label: "🎉 Hired!",       color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  REJECTED:       { label: "Not Selected",    color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
};

export default function CandidatePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [tab, setTab] = useState<"listings" | "applications" | "apply">("listings");
  const [applyJobId, setApplyJobId] = useState<number | null>(null);

  // "Applied" tracking — stored in localStorage so it persists across refreshes
  const [myApplications, setMyApplications] = useState<{ jobId: number; candidateId: number; jobTitle: string; stage: string }[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/jobs/");
        setJobs(res.data);
      } catch (err) {
        console.warn("Failed to fetch jobs:", err);
      }
    };
    fetchJobs();

    // Load saved applications from localStorage
    const saved = localStorage.getItem("my_applications");
    if (saved) setMyApplications(JSON.parse(saved));
  }, []);

  // Poll application statuses every 5s
  useEffect(() => {
    if (myApplications.length === 0) return;
    const interval = setInterval(async () => {
      const updated = await Promise.all(
        myApplications.map(async (app) => {
          try {
            const res = await axios.get(`http://127.0.0.1:8000/candidates/${app.jobId}`);
            const me = res.data.find((c: any) => c.id === app.candidateId);
            return me ? { ...app, stage: me.stage } : app;
          } catch {
            return app;
          }
        })
      );
      setMyApplications(updated);
      localStorage.setItem("my_applications", JSON.stringify(updated));
    }, 5000);
    return () => clearInterval(interval);
  }, [myApplications]);

  const handleApplyClick = (jobId: number) => {
    setApplyJobId(jobId);
    setTab("apply");
  };

  // Called by CandidatePortal when application is submitted
  const handleApplicationSubmitted = (candidateId: number, jobId: number) => {
    const job = jobs.find(j => j.id === jobId);
    const newApp = { jobId, candidateId, jobTitle: job?.title || "Unknown Role", stage: "NEW" };
    const updated = [...myApplications, newApp];
    setMyApplications(updated);
    localStorage.setItem("my_applications", JSON.stringify(updated));
    // Do NOT switch tabs — candidate stays on the pipeline view to complete their assessment
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-sans flex">
      {/* Left Branding Sidebar */}
      <div className="w-[260px] bg-[#111827] border-r border-slate-800 flex flex-col shrink-0 hidden lg:flex">
         <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <ShieldCheck size={24} className="text-purple-400" />
            <span className="font-bold text-xl tracking-tight">TruthAuth</span>
         </div>
         
         <div className="flex-1 py-4 flex flex-col gap-1 px-3">
           <button
             onClick={() => setTab("listings")}
             className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors w-full text-left ${tab === "listings" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
           >
             <Briefcase size={18}/> Job Openings
           </button>
           <button
             onClick={() => setTab("applications")}
             className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors w-full text-left ${tab === "applications" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
           >
             <LayoutList size={18}/> My Applications
             {myApplications.length > 0 && (
               <span className="ml-auto bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                 {myApplications.length}
               </span>
             )}
           </button>
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
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-200">
              {tab === "listings" && "Job Openings"}
              {tab === "applications" && "My Applications"}
              {tab === "apply" && "Apply for Position"}
            </h2>
          </div>
          <div className="flex items-center gap-3 cursor-pointer group">
             <div className="text-right">
               <p className="text-sm font-bold text-slate-200 group-hover:text-purple-400 transition-colors">Applicant</p>
               <p className="text-xs text-slate-500">Candidate Portal</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
               <User size={20}/>
             </div>
          </div>
        </header>

        {/* Scrolling Workspace */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">

          {/* ── JOB LISTINGS TAB ── */}
          {tab === "listings" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-100">Open Positions</h1>
                <p className="text-sm text-slate-400 mt-1">Browse available roles and apply with your CV.</p>
              </div>
              {jobs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">No job openings available right now.</div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="bg-[#141c2b] border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                          <Briefcase size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 text-lg">{job.title}</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            Skills required: <span className="text-slate-300 font-medium">{job.skills}</span>
                          </p>
                          <p className="text-sm text-slate-400">
                            Experience: <span className="text-slate-300 font-medium">{job.experience}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApplyClick(job.id)}
                        className="shrink-0 bg-purple-500 hover:bg-purple-400 text-[#0a0e17] px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]"
                      >
                        Apply Now <ChevronRight size={16}/>
                      </button>
                    </div>
                    {job.generated_jd && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{job.generated_jd}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── MY APPLICATIONS TAB ── */}
          {tab === "applications" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-100">My Applications</h1>
                <p className="text-sm text-slate-400 mt-1">Track the status of your submitted applications.</p>
              </div>
              {myApplications.length === 0 ? (
                <div className="bg-[#141c2b] border border-slate-800 rounded-xl p-16 flex flex-col items-center text-center">
                  <LayoutList size={40} className="text-slate-600 mb-4" />
                  <p className="text-slate-400 font-medium mb-2">No applications yet</p>
                  <p className="text-sm text-slate-500 mb-6">Browse job openings and submit your CV to get started.</p>
                  <button
                    onClick={() => setTab("listings")}
                    className="bg-purple-500 hover:bg-purple-400 text-[#0a0e17] px-5 py-2.5 rounded-lg font-bold text-sm transition-all"
                  >
                    Browse Openings
                  </button>
                </div>
              ) : (
                myApplications.map((app, idx) => {
                  const meta = STAGE_META[app.stage] || STAGE_META["NEW"];
                  return (
                    <div key={idx} className="bg-[#141c2b] border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-blue-400">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-200">{app.jobTitle}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Application #{app.candidateId}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex gap-1.5">
                          {["NEW", "SCREENED", "TASK_COMPLETED", "INTERVIEWED", "HIRED"].map((s, i) => {
                            const stageOrder = ["NEW", "EXTRACTED", "SCREENED", "TASK_ASSIGNED", "TASK_COMPLETED", "INTERVIEWED", "TRUTH_VERIFIED", "HIRED"];
                            const currentIdx = stageOrder.indexOf(app.stage);
                            const thisIdx = stageOrder.indexOf(s);
                            const isActive = currentIdx >= thisIdx;
                            const isDone = currentIdx > thisIdx;
                            return (
                              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${app.stage === "REJECTED" ? "bg-rose-500/30" : isDone ? "bg-purple-500" : isActive ? "bg-purple-400" : "bg-slate-700"}`} />
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-2">
                          {["Applied", "Screened", "Assessment", "Interview", "Decision"].map((label) => (
                            <span key={label} className="text-[9px] text-slate-600 font-bold uppercase">{label}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── APPLY TAB ── */}
          {tab === "apply" && (
            <div className="w-full max-w-2xl mx-auto">
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setTab("listings")}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft size={20}/>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-100">
                    Applying for: <span className="text-purple-400">{jobs.find(j => j.id === applyJobId)?.title || "Position"}</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">Fill in your details and upload your CV below.</p>
                </div>
              </div>
              <CandidatePortal
                jobs={jobs}
                preselectedJobId={applyJobId}
                onApplicationSubmitted={handleApplicationSubmitted}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
