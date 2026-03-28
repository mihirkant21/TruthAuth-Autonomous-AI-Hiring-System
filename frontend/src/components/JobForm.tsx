"use client";
import { useState } from "react";
import axios from "axios";
import { PlusCircle, Loader2 } from "lucide-react";

export default function JobForm({ onJobCreated }: { onJobCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", experience: "" });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please upload a requirements PDF");
    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("experience", formData.experience);
      data.append("file", file);

      await axios.post("http://localhost:8000/jobs/upload-requirements/", data);
      onJobCreated();
      setFormData({ title: "", experience: "" });
      setFile(null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="app-card p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-purple-500/20 p-2.5 rounded-lg text-purple-400">
           <PlusCircle size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-200">Create Position</h3>
          <p className="text-xs text-slate-500">Initialize a new verification array.</p>
        </div>
      </div>
      
      <div className="space-y-3 mb-4 relative z-20">
        <div>
          <input 
            required className="w-full bg-[#0a0e17] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-slate-600 font-medium" 
            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Job Title (e.g. Senior Dev)" 
          />
        </div>
        <div className="flex gap-2 relative z-20">
          <div className="w-2/3 relative flex items-center bg-[#0a0e17] border border-slate-800 rounded-lg p-2.5 text-sm">
            <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required />
            <span className="text-slate-500 font-medium truncate">{file ? file.name : "Upload Requirements PDF"}</span>
          </div>
          <input 
            className="w-1/3 bg-[#0a0e17] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-slate-600 font-medium z-20 relative" 
            value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="Experience Info" 
          />
        </div>
      </div>
      
      <button 
        disabled={loading} 
        type="submit" 
        className="w-full bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-lg py-2.5 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Job"}
      </button>
    </form>
  );
}
