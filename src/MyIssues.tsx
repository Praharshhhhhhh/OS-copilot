import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Terminal, MessageSquare, CheckCircle2, CircleDot } from 'lucide-react';

export default function MyIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/github/user/issues')
      .then(res => res.json())
      .then(data => {
        setIssues(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
     return <div className="p-8 text-center text-gray-400">Loading issues...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-white tracking-tight">My Issues</h2>
        <p className="text-gray-400 mt-2">Issues you have created or interacted with.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20">
        {issues.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-white/10">
            No issues found
          </div>
        ) : (
          issues.map((issue: any) => (
             <motion.div 
               key={issue.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="card-liquid-glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group flex flex-col"
             >
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-2">
                   {issue.state === 'open' ? (
                     <CircleDot className="text-green-500 w-5 h-5 shrink-0" />
                   ) : (
                     <CheckCircle2 className="text-purple-500 w-5 h-5 shrink-0" />
                   )}
                   <span className="text-xs text-gray-400">{issue.repository_url?.split('/').slice(-2).join('/')}</span>
                 </div>
                 <span className="text-xs text-gray-500">#{issue.number}</span>
               </div>
               
               <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors">
                 {issue.title}
               </h3>
               
               <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                 {issue.body || 'No description provided.'}
               </p>

               <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                   <MessageSquare className="w-3.5 h-3.5" />
                   {issue.comments} comments
                 </div>
                 <a 
                   href={issue.html_url} 
                   target="_blank" 
                   rel="noreferrer"
                   className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                 >
                   View on GitHub
                 </a>
               </div>
             </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
