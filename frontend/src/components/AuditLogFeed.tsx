"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { ListTree, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditLogFeed() {
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    const res = await axios.get("http://localhost:8000/audit-logs/");
    setLogs(res.data);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[500px] overflow-hidden text-zinc-300 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div className="p-5 border-b border-white/5 bg-black/40 flex items-center justify-between backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div className="flex items-center gap-3">
          <ListTree size={18} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"/>
          <h2 className="font-bold text-white text-sm tracking-wide">System Audit Trail</h2>
        </div>
        <Fingerprint size={16} className="text-zinc-600"/>
      </div>
      <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div 
              key={log.id} 
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="text-xs border-l-[3px] border-cyan-500/30 pl-4 py-1 relative group"
            >
              <div className="absolute w-2 h-2 rounded-full bg-cyan-400 -left-[9px] top-1.5 opacity-50 shadow-[0_0_10px_rgba(34,211,238,0.8)] group-hover:opacity-100 transition-all"></div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-black tracking-wider text-cyan-300 uppercase text-[10px] bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(34,211,238,0.2)]">{log.agent_name}</span>
                <span className="text-zinc-500 font-mono text-[10px] bg-black/50 px-2 py-0.5 rounded">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              {log.reason && <div className="text-rose-400 mb-2 font-bold bg-rose-500/10 inline-block px-2 py-0.5 rounded border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">{log.reason}</div>}
              {log.payload_out && (
                <div className="bg-black/60 p-3 rounded-xl text-zinc-400 mt-2 overflow-x-auto whitespace-pre-wrap max-h-32 font-mono text-[10px] border border-white/5 shadow-inner group-hover:border-white/10 group-hover:bg-black/80 transition-all custom-scrollbar">
                  {JSON.stringify(log.payload_out, null, 2)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono text-xs gap-3">
             <div className="animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500/50"></div>
                Waiting for telemetry...
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
