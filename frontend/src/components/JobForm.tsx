"use client";
import { useState } from "react";
import axios from "axios";
import { PlusCircle, Loader2, FileText, X, Upload } from "lucide-react";

export default function JobForm({ onJobCreated }: { onJobCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", experience: "" });
  const [file, setFile] = useState<File | null>(null);
  const [extractedJD, setExtractedJD] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [createdJobId, setCreatedJobId] = useState<number | null>(null);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/jobs/", {
        title: formData.title,
        experience: formData.experience,
        skills: ""
      });
      setCreatedJobId(res.data.id);
      setStep(2);
      onJobCreated(); // Refresh list to show empty job
    } catch (err) {
      console.error("Job Creation failed", err);
    }
    setLoading(false);
  };

  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !createdJobId) return alert("Please upload a requirements PDF");
    setLoading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await axios.post(`http://127.0.0.1:8000/jobs/${createdJobId}/upload-requirements/`, data);
      setExtractedJD(res.data.generated_jd);
      onJobCreated();
      setFormData({ title: "", experience: "" });
      setFile(null);
      setStep(1);
      setCreatedJobId(null);
    } catch (err) {
      console.error("Upload failed", err);
    }
    setLoading(false);
  };

  return (
    <div className="app-card p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-purple-500/20 p-2.5 rounded-lg text-purple-400">
           {step === 1 ? <PlusCircle size={20} /> : <Upload size={20} />}
        </div>
        <div>
          <h3 className="font-bold text-slate-200">
            {step === 1 ? "Create Position" : "Upload Requirements"}
          </h3>
          <p className="text-xs text-slate-500">
            {step === 1 ? "Initialize a new verification array." : `Attach PDF for ${formData.title}`}
          </p>
        </div>
      </div>
      
      {step === 1 ? (
        <form onSubmit={handleCreateJob} className="space-y-4 relative z-20">
          <div className="space-y-3">
            <input 
              required className="w-full bg-[#0a0e17] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-slate-600 font-medium" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Job Title (e.g. Senior Dev)" 
            />
            <input 
              className="w-full bg-[#0a0e17] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-slate-600 font-medium" 
              value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="Experience Info (e.g. 5+ Years)" 
            />
          </div>
          
          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-lg py-2.5 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-sm mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Next: Upload PDF"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUploadPDF} className="space-y-4 relative z-20">
          <div className="relative flex items-center bg-[#0a0e17] border border-slate-800 rounded-lg p-3 text-sm hover:border-purple-500/50 transition-colors">
            <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required />
            <span className="text-slate-400 font-medium truncate flex-1 text-center">
              {file ? file.name : "Click to select Requirements PDF"}
            </span>
          </div>

          <button 
            disabled={loading || !file} 
            type="submit" 
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg py-2.5 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-sm mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Extract & Finalize"}
          </button>
          
          <button
             type="button"
             onClick={() => { setStep(1); setCreatedJobId(null); setFile(null); }}
             className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors"
          >
             Cancel
          </button>
        </form>
      )}

      {/* Extracted JD Modal */}
      {extractedJD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 overflow-hidden">
           <div className="bg-[#0a0e17] border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-full">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0a0e17] z-10 shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                       <FileText size={20} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-100">PDF Extracted Automatically</h3>
                       <p className="text-xs text-slate-400">AI dynamically pulled Responsibilities & Requirements</p>
                    </div>
                 </div>
                 <button onClick={() => setExtractedJD(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                 <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{extractedJD}</pre>
                 </div>
              </div>
              
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 sticky bottom-0 shrink-0 flex justify-end">
                 <button onClick={() => setExtractedJD(null)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-colors text-sm">
                    Acknowledge & Continue
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
