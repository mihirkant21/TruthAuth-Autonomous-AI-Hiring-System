"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Video, CheckCircle2, ChevronRight, Check, CheckCircle, Clock } from "lucide-react";

export default function CandidatePortal({ jobs }: { jobs: any[] }) {
  const [jobId, setJobId] = useState<number | "">("");
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  
  const [taskText, setTaskText] = useState("");
  const [stage, setStage] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!jobId || !candidateId) return;
    const res = await axios.get(`http://localhost:8000/candidates/${jobId}`);
    const me = res.data.find((c: any) => c.id === candidateId);
    if (me) setStage(me.stage);
  };

  useEffect(() => {
    const int = setInterval(fetchStatus, 3000);
    return () => clearInterval(int);
  }, [jobId, candidateId]);

  const handleApply = async () => {
    if (!jobId || !name || !cvFile) return alert("Fill all fields");
    const data = new FormData();
    data.append("job_id", jobId.toString());
    data.append("name", name);
    data.append("file", cvFile);
    try {
       const res = await axios.post(`http://localhost:8000/candidates/upload-cv/`, data);
       if (res.data.status === "rejected") {
           alert(res.data.message);
           if (res.data.candidate) {
               setCandidateId(res.data.candidate.id);
               setStage(res.data.candidate.stage);
           }
       } else if (res.data.status === "accepted") {
           alert(res.data.message);
           setCandidateId(res.data.candidate.id);
           setStage(res.data.candidate.stage);
       }
    } catch (err: any) {
        if (err.response?.data?.message) {
             alert(err.response.data.message);
        } else {
             alert("An error occurred during screening.");
        }
    }
  };

  const handleTaskSubmit = async () => {
    if (!candidateId) return;
    const formData = new FormData();
    formData.append("task_submission", taskText);
    await axios.post(`http://localhost:8000/candidates/${candidateId}/submit-task`, formData);
    fetchStatus();
    setTaskText("Submitted effectively. Awaiting evaluation.");
  };

  const handleVideoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !candidateId) return;
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`http://localhost:8000/candidates/${candidateId}/upload-video`, formData);
    fetchStatus();
  };

  const renderTimeline = () => {
    const stages = [
      { id: "NEW", label: "Identity Matrix" },
      { id: "SCREENED", label: "Primary Screen" },
      { id: "TASK_COMPLETED", label: "Task Execution" },
      { id: "INTERVIEWED", label: "Behavioral Sync" },
      { id: "HIRED", label: "Truth Validation" },
    ];
    
    let currentIdx = stages.findIndex(s => stage === s.id);
    if(stage === "EXTRACTED") currentIdx = 0;
    if(stage === "TASK_ASSIGNED") currentIdx = 1;
    if(stage === "TRUTH_VERIFIED") currentIdx = 3;
    if(stage === "REJECTED") currentIdx = 4;
    
    return (
      <div className="flex justify-between relative mt-8 mb-8 pb-8 border-b border-slate-800">
         <div className="absolute top-4 left-6 right-6 h-[2px] bg-slate-800 -translate-y-1/2 z-0"></div>
         <div 
           className="absolute top-4 left-6 h-[2px] bg-purple-500 -translate-y-1/2 z-0 transition-all duration-1000"
           style={{ width: `${(currentIdx / (stages.length - 1)) * 100}%` }}
         />
         {stages.map((s, idx) => {
            const isActive = idx === currentIdx;
            const isPast = idx < currentIdx;
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                 <div 
                   className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] transition-all duration-500 border-2 ${isActive ? 'bg-[#0a0e17] text-purple-400 border-purple-500' : isPast ? 'bg-purple-500 text-[#0a0e17] border-purple-500' : 'bg-[#111827] text-slate-600 border-slate-800'}`}
                 >
                    {isPast ? <Check size={14} strokeWidth={3} /> : idx + 1}
                 </div>
                 <div className="absolute top-10 w-24 flex flex-col items-center text-center">
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{s.label}</span>
                 </div>
              </div>
            )
         })}
      </div>
    )
  }

  return (
    <div className="w-full relative z-10">
      {!candidateId ? (
        <div className="bg-[#141c2b] border border-slate-800 p-8 rounded-2xl w-full shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Initialize Profile</h2>
            <p className="text-slate-400 text-sm">Submit your structured credentials.</p>
          </div>
          
          <div className="space-y-6">
            <div>
               <label className="text-xs font-bold text-slate-400 mb-2 block">Target Array</label>
               <select value={jobId} onChange={e => setJobId(Number(e.target.value))} className="w-full p-3 border border-slate-800 bg-[#0a0e17] text-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none appearance-none text-sm font-medium cursor-pointer">
                 <option value="">Select configuration...</option>
                 {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
               </select>
            </div>
            
            <div>
               <label className="text-xs font-bold text-slate-400 mb-2 block">Subject Designation</label>
               <input placeholder="Enter authoritative identifier" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-slate-800 bg-[#0a0e17] text-slate-200 placeholder-slate-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none text-sm font-medium" />
            </div>

            <div>
               <label className="text-xs font-bold text-slate-400 mb-2 block">Candidate Resume (PDF)</label>
               <div className="relative border-2 border-dashed border-slate-800 bg-[#0a0e17] rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-purple-500 transition-colors cursor-pointer w-full group">
                 <input type="file" accept="application/pdf" onChange={e => setCvFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                 <FileText size={40} className="text-slate-600 mb-4 group-hover:text-purple-400 transition-colors" />
                 <span className="font-bold text-slate-200 mb-1">{cvFile ? cvFile.name : "Drag & Drop CV Here"}</span>
                 <span className="text-xs text-slate-500">{cvFile ? "Click to change file" : "Only PDF format supported"}</span>
               </div>
            </div>

            <button 
              onClick={handleApply} 
              className="w-full bg-purple-500 hover:bg-purple-400 text-[#0a0e17] rounded-lg p-3 transition-colors font-bold text-sm tracking-wide mt-4"
            >
              Sign up as Candidate
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#141c2b] border border-slate-800 rounded-2xl w-full shadow-xl overflow-hidden">
          <div className="bg-[#111827] border-b border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome back, {name}</h2>
            <div className="flex items-center gap-2 mt-2">
               <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
               <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">{stage?.replace("_", " ")}</p>
            </div>
          </div>

          <div className="p-8 pb-12">
            {renderTimeline()}

            <div className="mt-12">
              {(stage === "SCREENED" || stage === "TASK_COMPLETED") && (
                <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="bg-slate-800 p-3 rounded-lg text-slate-300"><FileText size={24}/></div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-200">Technical Task Submission</h3>
                       <p className="text-xs text-slate-400 font-medium mt-1">Provide your repository proof snippet.</p>
                     </div>
                  </div>
                  <textarea placeholder="Paste repository URI or code block..." value={taskText} onChange={e => setTaskText(e.target.value)} rows={5} className="w-full p-4 bg-[#141c2b] border border-slate-700 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-xs font-mono mb-4 text-slate-300 placeholder-slate-600 outline-none custom-scrollbar" />
                  <button 
                    disabled={stage === "TASK_COMPLETED"} onClick={handleTaskSubmit} 
                    className="w-full bg-purple-500 hover:bg-purple-400 disabled:bg-slate-800 disabled:text-slate-500 text-[#0a0e17] font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                  >
                    {stage === "TASK_COMPLETED" ? "Submitted" : "Transmit Task Data"}
                  </button>
                </div>
              )}

              {stage === "INTERVIEWED" && (
                <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="bg-slate-800 p-3 rounded-lg text-slate-300"><Video size={24}/></div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-200">Vocal Analysis Module</h3>
                       <p className="text-xs text-slate-400 font-medium mt-1">Upload a brief video/audio response. Whisper will handle extraction.</p>
                     </div>
                  </div>
                  <div className="bg-[#141c2b] border border-slate-700 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500/50 transition-all relative group">
                    <input type="file" accept="video/*,audio/*" onChange={handleVideoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <Video size={40} className="text-slate-500 mb-4 group-hover:text-purple-400 transition-colors"/>
                    <span className="font-bold text-slate-200 mb-1">Upload Media</span>
                    <span className="text-xs text-slate-500">MP4, WebM, MP3, WAV</span>
                  </div>
                </div>
              )}

              {(stage === "HIRED" || stage === "REJECTED") && (
                <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-10 flex flex-col items-center text-center">
                  <CheckCircle size={64} className={`mb-4 ${stage === 'HIRED' ? 'text-purple-400' : 'text-rose-400'}`}/>
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">
                    {stage === 'HIRED' ? 'Evaluation Verified' : 'Evaluation Terminated'}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                     Your status has been finalized by the Truth-Verification protocol. The results are locked with the HR subsystem.
                  </p>
                </div>
              )}
              
              {(stage === "NEW" || stage === "EXTRACTED") && (
                <div className="text-center py-16">
                   <Clock className="text-slate-600 mx-auto mb-4" size={48} />
                   <h3 className="font-bold text-xl text-slate-200 mb-2">Processing Vectors</h3>
                   <p className="text-slate-500 text-sm max-w-sm mx-auto">
                     Your profile is in the queue for agent review. Modules will unlock directly upon clearance.
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
