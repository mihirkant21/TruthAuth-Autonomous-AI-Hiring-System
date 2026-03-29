"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Play, CheckCircle2, ShieldAlert, Cpu, ThumbsUp, Trash2, X } from "lucide-react";

export default function KanbanBoard({ jobId, refreshTrigger }: { jobId: number | null, refreshTrigger: number }) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCandidates = async () => {
    if (!jobId) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/candidates/${jobId}`);
      setCandidates(res.data);
      setFetchError(null);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || "Unknown error";
      setFetchError(`Failed to load candidates: ${detail}`);
    }
  };

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 3000);
    return () => clearInterval(interval);
  }, [jobId, refreshTrigger]);

  const runPipeline = async () => {
    if (!jobId) return;
    setLoading(true);
    await axios.post(`http://127.0.0.1:8000/run-pipeline/${jobId}`);
    setTimeout(() => { setLoading(false); fetchCandidates(); }, 2000);
  };

  const deactivateCandidate = async (candidateId: number) => {
    await axios.post(`http://127.0.0.1:8000/candidates/${candidateId}/terminate`);
    fetchCandidates();
  };

  const approveCandidate = async (candidateId: number) => {
    await axios.post(`http://127.0.0.1:8000/candidates/${candidateId}/approve`);
    fetchCandidates();
  };

  const deleteCandidate = async (candidateId: number) => {
    await axios.delete(`http://127.0.0.1:8000/candidates/${candidateId}`);
    setConfirmDelete(null);
    fetchCandidates();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Just now";
    const d = new Date(isoString + "Z");
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const STAGES_LIST = [
    { id: "NEW", label: "Ingested", color: "text-slate-400" },
    { id: "EXTRACTED", label: "Extracted", color: "text-blue-400" },
    { id: "SCREENED", label: "Screened", color: "text-indigo-400" },
    { id: "TASK_COMPLETED", label: "Task Evaluated", color: "text-cyan-400" },
    { id: "INTERVIEWED", label: "Interview Analyzed", color: "text-orange-400" },
    { id: "HIRED", label: "Truth Verified", color: "text-purple-400" },
    { id: "REJECTED", label: "Terminated", color: "text-rose-400" }
  ];

  if (!jobId) return null;

  return (
    <div className="bg-[#141c2b] border border-slate-800 rounded-xl overflow-hidden shadow-sm mt-8">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#111827]">
         <h2 className="text-lg font-bold text-slate-200">Active Candidates</h2>
         <button 
           onClick={runPipeline} 
           disabled={loading}
           className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-slate-700 hover:border-purple-500/50 disabled:opacity-50"
         >
            {loading ? <Cpu size={16} className="animate-pulse text-purple-400"/> : <Play size={16}/>}
            {loading ? "Processing Pipeline..." : "Execute AI Agents"}
         </button>
      </div>

      <div className="p-6 space-y-4">
         {fetchError ? (
           <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-sm text-rose-400 font-medium">
             ⚠️ {fetchError}
             <button onClick={fetchCandidates} className="ml-3 underline text-rose-300 hover:text-rose-200">Retry</button>
           </div>
         ) : candidates.length === 0 ? (
           <div className="text-center py-10 text-sm text-slate-500 font-medium">No candidates in pipeline.</div>
         ) : (
           candidates.map((c) => {
             const stageInfo = STAGES_LIST.find(s => s.id === c.stage) || STAGES_LIST[0];
             return (
               <div key={c.id} className="group border border-slate-800 bg-[#0a0e17] rounded-xl p-4 flex flex-col hover:border-slate-600 transition-colors">
                 
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                     <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 text-purple-400">
                       <FileText size={20} />
                     </div>
                     <div>
                       <h3 className="font-bold text-slate-200 text-base flex items-center gap-3">
                         {c.name}
                         <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest border border-slate-700">
                           Applied: {formatDate(c.created_at)}
                         </span>
                       </h3>
                       <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">
                         Score: {c.scores?.screener?.score || 0}/10 • Task: {c.scores?.task?.task_score || 'Pending'}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex gap-2 items-center flex-wrap justify-end">
                     {c.scores?.truth?.truth_score !== undefined && (
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
                          <ShieldAlert size={14} className={c.scores.truth.truth_score >= 7 ? "text-purple-400" : "text-rose-400"} />
                          <span className={`text-xs font-bold ${c.scores.truth.truth_score >= 7 ? "text-purple-400" : "text-rose-400"}`}>
                            Truth: {c.scores.truth.truth_score}/10
                          </span>
                        </div>
                     )}
                     <span className="bg-slate-900 text-slate-400 text-xs px-3 py-1.5 rounded-full border border-slate-800 font-medium uppercase tracking-wide">
                       {stageInfo.label}
                     </span>
                     {c.verdict && (
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide border ${String(c.verdict).toLowerCase().includes('pass') || String(c.verdict).toLowerCase().includes('hire') || String(c.verdict).toLowerCase().includes('approv') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                          {String(c.verdict).toLowerCase().includes('pass') || String(c.verdict).toLowerCase().includes('hire') || String(c.verdict).toLowerCase().includes('approv')
                            ? <span className="flex items-center gap-1.5"><CheckCircle2 size={14}/> {c.verdict}</span>
                            : c.verdict}
                        </span>
                     )}

                     {/* HR Action Buttons */}
                     <div className="flex gap-1.5 ml-1">
                       {c.stage !== "HIRED" && c.stage !== "REJECTED" && (
                         <button
                           onClick={() => approveCandidate(c.id)}
                           title="Approve candidate"
                           className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 px-2 py-1 rounded transition-colors"
                         >
                           <ThumbsUp size={11}/> Approve
                         </button>
                       )}
                       {c.stage !== "HIRED" && c.stage !== "REJECTED" && (
                         <button
                           onClick={() => deactivateCandidate(c.id)}
                           title="Reject candidate"
                           className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 px-2 py-1 rounded transition-colors"
                         >
                           <X size={11}/> Reject
                         </button>
                       )}
                       {confirmDelete === c.id ? (
                         <div className="flex gap-1">
                           <button onClick={() => deleteCandidate(c.id)} className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2 py-1 rounded border border-rose-500">Confirm</button>
                           <button onClick={() => setConfirmDelete(null)} className="text-[10px] font-bold uppercase bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">Cancel</button>
                         </div>
                       ) : (
                         <button
                           onClick={() => setConfirmDelete(c.id)}
                           title="Permanently delete"
                           className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 px-2 py-1 rounded transition-colors"
                         >
                           <Trash2 size={11}/> Delete
                         </button>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Expandable red flags if any */}
                 {c.scores?.truth?.inconsistencies?.length > 0 && (
                   <div className="mt-2 pt-4 border-t border-slate-800 pl-16">
                     <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">Detected Inconsistencies</p>
                     <div className="space-y-1.5">
                       {c.scores.truth.inconsistencies.map((inc: string, idx: number) => (
                         <div key={idx} className="flex gap-2 items-start text-xs text-slate-400">
                           <span className="text-rose-500 shrink-0 mt-0.5">•</span>
                           <span>{inc}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {(c.stage === "HIRED" || c.stage === "REJECTED") && (
                   <div className="mt-4 pt-4 border-t border-slate-800 pl-16 flex items-center gap-4">
                     <button onClick={() => window.open(`http://127.0.0.1:8000/download-report/${c.id}`, "_blank")} className="text-purple-400 hover:text-purple-300 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                       Download Report →
                     </button>
                     <div className="flex items-center gap-1">
                       {confirmDelete === c.id ? (
                         <span className="flex gap-2">
                           <button onClick={() => deleteCandidate(c.id)} className="text-[10px] font-bold uppercase bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded transition-colors">Confirm Delete</button>
                           <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} className="text-[10px] font-bold uppercase bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors">Cancel</button>
                         </span>
                       ) : (
                         <button
                           onClick={() => setConfirmDelete(c.id)}
                           className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                         >
                           <Trash2 size={12}/> Delete Record
                         </button>
                       )}
                     </div>
                   </div>
                 )}

               </div>
             );
           })
         )}
      </div>
    </div>
  );
}
