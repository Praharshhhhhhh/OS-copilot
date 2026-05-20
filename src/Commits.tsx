import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GitCommit, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Commits() {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/github/user/commits')
      .then(res => res.json())
      .then(data => {
        setCommits(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
     return <div className="p-8 text-center text-gray-400">Loading recent commits...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Recent Commits</h2>
        <p className="text-gray-400 mt-2">Your recent pushes to GitHub.</p>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pb-20">
        {commits.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-white/10">
            No recent commits found
          </div>
        ) : (
          commits.map((commit: any, idx: number) => {
            const commitDate = commit.created_at ? new Date(commit.created_at) : new Date();
            const timeAgo = formatDistanceToNow(commitDate, { addSuffix: true });
            const message = commit.message?.split('\n')[0] || 'No commit message';
            const gitUrl = `https://github.com/${commit.repo?.name}/commit/${commit.sha}`;
            
            return (
              <motion.div 
                key={`${commit.sha}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-liquid-glass p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <GitCommit className="text-gray-300 w-5 h-5" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate group-hover:text-indigo-400 transition-colors">
                      {message}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                       <span className="truncate">{commit.repo?.name}</span>
                       <span>•</span>
                       <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="font-mono text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">
                    {commit.sha?.substring(0, 7)}
                  </span>
                  <a 
                    href={gitUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
