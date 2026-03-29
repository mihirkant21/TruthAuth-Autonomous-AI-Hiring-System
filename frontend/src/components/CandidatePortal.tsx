"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FileText, Video, CheckCircle2, ChevronRight, Check, CheckCircle, Clock, Loader2, Code2, Briefcase, Brain, Star, Mic, PlayCircle, StopCircle } from "lucide-react";

export default function CandidatePortal({ jobs, preselectedJobId, onApplicationSubmitted }: { jobs: any[], preselectedJobId?: number | null, onApplicationSubmitted?: (candidateId: number, jobId: number) => void }) {
  const [jobId, setJobId] = useState<number | "">(preselectedJobId || "");
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const [taskText, setTaskText] = useState("");
  const [stage, setStage] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [isFetchingAssessment, setIsFetchingAssessment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [interviewSubmitted, setInterviewSubmitted] = useState(false);
  const [appliedJobsList, setAppliedJobsList] = useState<any[]>([]);

  // MCQ: { "0": "answer text", "1": "answer text", ... }
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  // Code: { "0": "code string", "1": "code string", ... }
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
  // Task URL
  const [taskUrl, setTaskUrl] = useState("");

  const fetchStatus = async () => {
    if (!jobId || !candidateId) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/candidates/${jobId}`);
      const me = res.data.find((c: any) => c.id === candidateId);
      if (me) setStage(me.stage);
    } catch (err) {
      console.warn("Polling status failed:", err);
    }
  };

  useEffect(() => {
    const int = setInterval(fetchStatus, 3000);
    return () => clearInterval(int);
  }, [jobId, candidateId]);

  useEffect(() => {
    if ((stage === "HIRED" || stage === "REJECTED" || stage === "TRUTH_VERIFIED") && name) {
      axios.get(`http://127.0.0.1:8000/candidates/applications/${name}`)
         .then(res => setAppliedJobsList(res.data))
         .catch(err => console.error("Failed to fetch applications:", err));
    }
  }, [stage, name]);

  // Fetch assessment once we have a candidateId and no assessment yet
  useEffect(() => {
    if (!candidateId || assessment) return;
    const fetchAssessment = async () => {
      setIsFetchingAssessment(true);
      try {
        const res = await axios.get(`http://127.0.0.1:8000/candidates/${candidateId}/assessment`);
        if (res.data?.assessment) setAssessment(res.data.assessment);
      } catch {
        // Assessment not ready yet — will retry on next render cycle
      } finally {
        setIsFetchingAssessment(false);
      }
    };
    fetchAssessment();
  }, [candidateId, assessment]);

  const handleCvUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvFile(file);
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("http://127.0.0.1:8000/candidates/extract-cv-info/", formData);
      if (res.data) {
        if (res.data.name) setName(res.data.name);
        if (res.data.skills && Array.isArray(res.data.skills)) setSkills(res.data.skills.join(", "));
        if (res.data.experience) setExperience(res.data.experience);
      }
    } catch (err) {
      console.error("Failed to extract CV info", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApply = async () => {
    if (!jobId || !name || !cvFile) return alert("Fill all fields");
    setIsSigningUp(true);
    const data = new FormData();
    data.append("job_id", jobId.toString());
    data.append("name", name);
    data.append("skills", skills);
    data.append("experience", experience);
    data.append("file", cvFile);
    try {
       const res = await axios.post(`http://127.0.0.1:8000/candidates/upload-cv/`, data);
       if (res.data.status === "rejected") {
           alert(res.data.message);
           if (res.data.candidate) {
               setCandidateId(res.data.candidate.id);
               setStage(res.data.candidate.stage);
           }
       } else if (res.data.status === "accepted") {
           const cid = res.data.candidate.id;
           setCandidateId(cid);
           setStage(res.data.candidate.stage);
           // Store assessment directly from response if available
           if (res.data.assessment) setAssessment(res.data.assessment);
           if (onApplicationSubmitted) {
             // Short delay so candidate sees the pipeline view before parent switches tab
             setTimeout(() => onApplicationSubmitted(cid, Number(jobId)), 1500);
           }
       }
    } catch (err: any) {
        if (err.response?.data?.message) {
             alert(err.response.data.message);
        } else {
             alert("An error occurred during screening.");
        }
    } finally {
        setIsSigningUp(false);
    }
  };

  const handleTaskSubmit = async () => {
    if (!candidateId) return;
    setIsSubmitting(true);
    const form = new FormData();
    form.append("task_submission", taskText || "-");
    form.append("mcq_answers", JSON.stringify(mcqAnswers));
    form.append("code_answers", JSON.stringify(codeAnswers));
    form.append("task_url", taskUrl);
    try {
      const res = await axios.post(`http://127.0.0.1:8000/candidates/${candidateId}/submit-task`, form);
      setSubmissionResult(res.data);
      setStage("TASK_COMPLETED");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewQuestion, setInterviewQuestion] = useState<{question: string, context: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const speechRecogRef = useRef<any>(null);

  const startInterview = async () => {
     setInterviewStarted(true);
     try {
       const res = await axios.get(`http://127.0.0.1:8000/candidates/${candidateId}/interview-prompt`);
       setInterviewQuestion(res.data);
     } catch (err) {
       setInterviewQuestion({question: "Please describe your professional background and why you are a good fit.", context: "Fallback question"});
     }
  };

  const startRecording = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       const recorder = new MediaRecorder(stream);
       mediaRecorderRef.current = recorder;
       audioChunksRef.current = [];
       setLiveTranscript("");

       recorder.ondataavailable = (e) => {
         if (e.data.size > 0) audioChunksRef.current.push(e.data);
       };

       recorder.onstop = () => {
         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
         submitAudio(audioBlob);
         stream.getTracks().forEach(track => track.stop());
       };

       recorder.start();
       setIsRecording(true);
       setTimeLeft(180);

       // Start live speech recognition (Web Speech API)
       const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
       if (SpeechRecognition) {
         const recog = new SpeechRecognition();
         recog.continuous = true;
         recog.interimResults = true;
         recog.lang = 'en-US';
         let finalText = "";
         recog.onresult = (event: any) => {
           let interim = "";
           for (let i = event.resultIndex; i < event.results.length; i++) {
             const t = event.results[i][0].transcript;
             if (event.results[i].isFinal) {
               finalText += t + " ";
             } else {
               interim = t;
             }
           }
           setLiveTranscript(finalText + interim);
         };
         recog.onerror = () => {};
         speechRecogRef.current = recog;
         recog.start();
       }
     } catch (err) {
       alert("Microphone access denied. Please allow microphone access to proceed.");
     }
  };

  const stopRecording = () => {
     if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
     }
     if (speechRecogRef.current) {
        speechRecogRef.current.stop();
        speechRecogRef.current = null;
     }
     setIsRecording(false);
  };

  const submitAudio = async (blob: Blob) => {
     setIsUploadingAudio(true);
     setInterviewSubmitted(true);
     const formData = new FormData();
     formData.append("file", blob, "interview.webm");
     try {
       await axios.post(`http://127.0.0.1:8000/candidates/${candidateId}/upload-video`, formData);
       fetchStatus();
     } catch (e) {
       alert("Upload failed.");
       setInterviewSubmitted(false);
     } finally {
       setIsUploadingAudio(false);
     }
  };

  useEffect(() => {
     let timer: any;
     if (isRecording && timeLeft > 0) {
        timer = setInterval(() => {
           setTimeLeft(prev => prev - 1);
        }, 1000);
     } else if (isRecording && timeLeft <= 0) {
        stopRecording();
     }
     return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  const formatTime = (secs: number) => {
     const m = Math.floor(secs / 60);
     const s = secs % 60;
     return `${m}:${s < 10 ? '0' : ''}${s}`;
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
               <select value={jobId || ""} onChange={e => setJobId(e.target.value ? Number(e.target.value) : "")} className="w-full p-3 border border-slate-800 bg-[#0a0e17] text-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none appearance-none text-sm font-medium cursor-pointer">
                 <option value="">Select configuration...</option>
                 {jobs.filter(j => j.generated_jd).map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
               </select>
            </div>
            
            <div>
               <label className="text-xs font-bold text-slate-400 mb-2 block">Candidate Name</label>
               <input placeholder="Enter authoritative identifier" value={name || ""} onChange={e => setName(e.target.value)} className="w-full p-3 border border-slate-800 bg-[#0a0e17] text-slate-200 placeholder-slate-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none text-sm font-medium" />
            </div>

            <div>
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-bold text-slate-400 block">Extracted Skills</label>
                 {skills && cvFile && (
                   <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                     <Check size={10} /> Extracted from PDF
                   </span>
                 )}
               </div>
               <textarea placeholder="Skills will auto-fill on CV upload..." value={skills || ""} onChange={e => setSkills(e.target.value)} rows={2} className={`w-full p-3 border ${skills && cvFile ? 'border-emerald-500/30' : 'border-slate-800'} bg-[#0a0e17] text-slate-200 placeholder-slate-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none text-sm font-medium custom-scrollbar`} />
            </div>

            <div>
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-bold text-slate-400 block">Professional Experience</label>
                 {experience && cvFile && (
                   <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                     <Check size={10} /> Extracted from PDF
                   </span>
                 )}
               </div>
               <textarea placeholder="Experience will auto-fill on CV upload..." value={experience || ""} onChange={e => setExperience(e.target.value)} rows={3} className={`w-full p-3 border ${experience && cvFile ? 'border-emerald-500/30' : 'border-slate-800'} bg-[#0a0e17] text-slate-200 placeholder-slate-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none text-sm font-medium custom-scrollbar`} />
            </div>

            <div>
               <label className="text-xs font-bold text-slate-400 mb-2 block">Candidate Resume (PDF)</label>
               <div className={`relative border-2 border-dashed border-slate-800 bg-[#0a0e17] rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-purple-500 transition-colors cursor-pointer w-full group ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}>
                 <input type="file" accept="application/pdf" onChange={handleCvUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                 {isExtracting ? (
                    <>
                      <Loader2 size={40} className="text-purple-500 mb-4 animate-spin" />
                      <span className="font-bold text-purple-400 mb-1">Extracting Resume Insights...</span>
                      <span className="text-xs text-slate-500">Parsing through neural networks</span>
                    </>
                 ) : (
                    <>
                      <FileText size={40} className="text-slate-600 mb-4 group-hover:text-purple-400 transition-colors" />
                      <span className="font-bold text-slate-200 mb-1">{cvFile ? cvFile.name : "Drag & Drop CV Here"}</span>
                      <span className="text-xs text-slate-500">{cvFile ? "Click to change file" : "Only PDF format supported"}</span>
                    </>
                 )}
               </div>
            </div>

            <button 
              onClick={handleApply} 
              disabled={isSigningUp}
              className="w-full bg-purple-500 hover:bg-purple-400 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-[#0a0e17] rounded-lg p-3 transition-colors font-bold text-sm tracking-wide mt-4 flex justify-center items-center"
            >
              {isSigningUp ? (
                 <>
                   <Loader2 size={18} className="animate-spin mr-2" />
                   Evaluating Profile...
                 </>
              ) : "Sign up as Candidate"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#141c2b] border border-slate-800 rounded-2xl w-full shadow-xl overflow-hidden">
          <div className="bg-[#111827] border-b border-slate-800 p-8">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome back, {name}</h2>
            <div className="flex items-center gap-2 mt-2">
               <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
               <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">
                 {["HIRED", "REJECTED", "TRUTH_VERIFIED"].includes(stage || "") 
                    ? "EVALUATION COMPLETE"
                    : stage?.replace("_", " ")}
               </p>
            </div>
          </div>

          <div className="p-8 pb-12">
            {renderTimeline()}

            <div className="mt-12">
              {(stage === "SCREENED" || stage === "TASK_ASSIGNED" || stage === "TASK_COMPLETED") && (
                <div className="space-y-6">

                  {/* Assessment Section */}
                  {isFetchingAssessment && (
                    <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-6 flex items-center gap-4">
                      <Loader2 size={24} className="text-purple-400 animate-spin shrink-0" />
                      <div>
                        <p className="font-bold text-slate-200 text-sm">Generating Your Personalized Assessment...</p>
                        <p className="text-xs text-slate-500 mt-1">AI is crafting questions based on your profile.</p>
                      </div>
                    </div>
                  )}

                  {assessment && (
                    <div className="bg-[#0a0e17] border border-slate-800 rounded-xl overflow-hidden">
                      {/* Assessment Header */}
                      <div className="bg-gradient-to-r from-purple-900/40 to-slate-900/40 border-b border-slate-800 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-500/20 p-2.5 rounded-lg">
                            <Brain size={20} className="text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-100">Your AI Interview Assessment</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Answer all sections, then submit below</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                          assessment.candidate_level === 'Advanced'
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            : assessment.candidate_level === 'Beginner'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        }`}>
                          {assessment.candidate_level}
                        </span>
                      </div>

                      <div className="p-5 space-y-8">

                        {/* ── MCQs ── */}
                        {assessment.mcq?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Star size={14} className="text-purple-400" />
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Multiple Choice Questions</h4>
                              <span className="text-[10px] text-slate-600 font-medium ml-auto">{Object.keys(mcqAnswers).length}/{assessment.mcq.length} answered</span>
                            </div>
                            <div className="space-y-4">
                              {assessment.mcq.map((q: any, idx: number) => (
                                <div key={idx} className="bg-[#141c2b] border border-slate-800 rounded-lg p-4">
                                  <p className="text-sm font-semibold text-slate-200 mb-3 leading-relaxed">
                                    <span className="text-purple-400 font-bold mr-2">Q{idx + 1}.</span>{q.question}
                                  </p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {q.options?.map((opt: string, oIdx: number) => {
                                      const isSelected = mcqAnswers[String(idx)] === opt;
                                      return (
                                        <button
                                          key={oIdx}
                                          onClick={() => setMcqAnswers(prev => ({...prev, [String(idx)]: opt}))}
                                          disabled={stage === "TASK_COMPLETED"}
                                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left w-full ${
                                            isSelected
                                              ? 'border-purple-500/70 bg-purple-500/15 text-purple-200'
                                              : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/40'
                                          }`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                            isSelected ? 'bg-purple-500 text-[#0a0e17]' : 'bg-slate-800 text-slate-500'
                                          }`}>
                                            {['A','B','C','D'][oIdx]}
                                          </span>
                                          {opt}
                                          {isSelected && <Check size={12} className="ml-auto text-purple-400" strokeWidth={3} />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Practical Challenges ── */}
                        {assessment.practical?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Code2 size={14} className="text-purple-400" />
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Practical Challenges / Case Studies</h4>
                            </div>
                            <div className="space-y-4">
                              {assessment.practical.map((c: any, idx: number) => (
                                <div key={idx} className="bg-[#141c2b] border border-slate-800 rounded-lg overflow-hidden">
                                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                                    <p className="text-sm font-bold text-slate-200">{c.title}</p>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full shrink-0 ${
                                      c.difficulty === 'Hard'
                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                        : c.difficulty === 'Easy'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                    }`}>
                                      {c.difficulty}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed px-4 pb-3">{c.description}</p>
                                  <div className="border-t border-slate-800 bg-[#0a0e17] px-4 py-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Your Solution</p>
                                    <textarea
                                      disabled={stage === "TASK_COMPLETED"}
                                      value={codeAnswers[String(idx)] || ""}
                                      onChange={e => setCodeAnswers(prev => ({...prev, [String(idx)]: e.target.value}))}
                                      rows={6}
                                      placeholder={`Write your ${c.title} response here...`}
                                      className="w-full p-3 bg-[#141c2b] border border-slate-700 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-xs font-mono text-slate-300 placeholder-slate-700 outline-none custom-scrollbar resize-y"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Real-world Task ── */}
                        {assessment.task?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Briefcase size={14} className="text-purple-400" />
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-world Task</h4>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/20 to-slate-900/20 border border-purple-500/20 rounded-lg p-5">
                              <p className="text-sm font-bold text-slate-100 mb-2">{assessment.task[0].title}</p>
                              <p className="text-xs text-slate-400 leading-relaxed mb-3">{assessment.task[0].description}</p>
                              <div className="bg-[#0a0e17] border border-slate-800 rounded-lg p-3 mb-4">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Expected Outcome</p>
                                <p className="text-xs text-slate-300 leading-relaxed">{assessment.task[0].expected_outcome}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Submit Your Work (Portfolio / Repo / Drive Link)</p>
                                <input
                                  type="url"
                                  disabled={stage === "TASK_COMPLETED"}
                                  value={taskUrl || ""}
                                  onChange={e => setTaskUrl(e.target.value)}
                                  placeholder="https://github.com/your-username/your-repo"
                                  className="w-full p-3 bg-[#141c2b] border border-slate-700 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm font-mono text-slate-300 placeholder-slate-600 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── Submit All ── */}
                        {stage !== "TASK_COMPLETED" ? (
                          <button
                            onClick={handleTaskSubmit}
                            disabled={isSubmitting || Object.keys(mcqAnswers).length < (assessment.mcq?.length || 0)}
                            className="w-full bg-purple-500 hover:bg-purple-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-[#0a0e17] font-bold px-6 py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Full Assessment"}
                          </button>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-emerald-300">Assessment Submitted!</p>
                              {submissionResult && <p className="text-xs text-slate-400 mt-0.5">MCQ Score: {submissionResult.mcq_score} — AI is now evaluating your submission.</p>}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                </div>
              )}

              {stage === "INTERVIEWED" && (
                <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="bg-slate-800 p-3 rounded-lg text-slate-300"><Mic size={24}/></div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-200">Conversational AI Interview</h3>
                       <p className="text-xs text-slate-400 font-medium mt-1">Answer the AI generated scenario directly in your browser.</p>
                     </div>
                  </div>
                  
                  {!interviewStarted ? (
                    <div className="bg-[#141c2b] border border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                        <Brain size={48} className="text-purple-500 mb-4 animate-pulse" />
                        <h4 className="text-lg font-bold text-slate-200 mb-2">Ready for your Interview?</h4>
                        <p className="text-sm text-slate-400 max-w-sm mb-6">The AI will generate a tough, highly personalized scenario based on your profile. You will have exactly 3 minutes to record your verbal response.</p>
                        <button onClick={startInterview} className="bg-purple-500 hover:bg-purple-400 text-[#0a0e17] px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2">
                            <PlayCircle size={20} /> Begin AI Interview
                        </button>
                    </div>
                  ) : !interviewQuestion ? (
                    <div className="bg-[#141c2b] border border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                        <Loader2 size={40} className="text-purple-500 mb-4 animate-spin" />
                        <span className="font-bold text-slate-200">Generating Personalized Scenario...</span>
                    </div>
                  ) : isUploadingAudio || interviewSubmitted ? (
                    <div className="bg-[#141c2b] border border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                        <Loader2 size={40} className="text-emerald-500 mb-4 animate-spin" />
                        <span className="font-bold text-slate-200">Processing Audio & Analyzing Response...</span>
                        <span className="text-xs text-slate-500 mt-2">The system is actively transcribing and validating your answer. Please wait.</span>
                    </div>
                  ) : (
                    <div className="bg-[#141c2b] border border-purple-500/30 rounded-xl overflow-hidden">
                        <div className="bg-purple-500/10 border-b border-purple-500/20 p-6">
                           <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">AI Interviewer</p>
                           <p className="text-lg font-medium text-slate-200 leading-relaxed">"{interviewQuestion.question}"</p>
                        </div>
                        <div className="p-6 flex flex-col items-center">
                           <div className="text-3xl font-mono text-slate-200 font-bold mb-6 tracking-wider">
                              {formatTime(timeLeft)}
                           </div>
                           
                           {!isRecording ? (
                              <button onClick={startRecording} className="bg-emerald-500 hover:bg-emerald-400 text-[#0a0e17] px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                  <Mic size={20} /> Start Recording
                              </button>
                           ) : (
                              <div className="flex flex-col items-center gap-4 w-full">
                                  <div className="flex items-center gap-2 text-rose-400 font-bold animate-pulse text-sm">
                                      <div className="w-3 h-3 rounded-full bg-rose-500"></div> Recording in progress...
                                  </div>
                                  <button onClick={stopRecording} className="bg-rose-500 hover:bg-rose-400 text-white px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                                      <StopCircle size={20} /> Stop & Submit Answer
                                  </button>
                              </div>
                           )}
                        </div>
                    </div>
                  )}
                </div>
              )}

              {(stage === "HIRED" || stage === "REJECTED" || stage === "TRUTH_VERIFIED") && (
                <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-10 flex flex-col items-center text-center">
                  <CheckCircle size={64} className="mb-4 text-purple-400" />
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">
                    Application Complete
                  </h3>
                  <p className="text-sm text-slate-300 max-w-sm mx-auto mb-8">
                     Thank you for completing all phases of the AI assessment pipeline. We will get back to you soon regarding the final decision.
                  </p>

                  <div className="w-full max-w-md mx-auto text-left bg-[#141c2b] rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-[#111827]">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Briefcase size={14} className="text-purple-400" /> Jobs You've Applied For
                        </p>
                    </div>
                    <div className="p-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {appliedJobsList.length === 0 ? (
                            <p className="text-xs text-slate-500 p-4 text-center">Fetching records...</p>
                        ) : (
                            <div className="space-y-1">
                                {appliedJobsList.map((app, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-800/50 rounded-lg transition-colors">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">{app.job_title}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Applied: {app.applied_on ? new Date(app.applied_on).toLocaleDateString() : "Recently"}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase tracking-widest font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded">
                                                Application Received
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>
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
