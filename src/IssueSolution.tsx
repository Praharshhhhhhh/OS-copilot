import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Loader2, ArrowLeft, ExternalLink, Copy, CheckCircle2, Flag } from 'lucide-react';

export default function IssueSolution({ issue, onBack }: { issue: any, onBack: () => void }) {
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let repoName = 'unknown repository';
    if (issue.repository_url) {
      repoName = issue.repository_url.split('/').slice(-2).join('/');
    }

    fetch('/api/ai/issue-solution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        issueTitle: issue.title, 
        issueBody: issue.body || 'No description provided.',
        repoName 
      })
    })
    .then(async (res) => {
      const contentType = res.headers.get('content-type');
      const data = (contentType && contentType.includes('application/json')) ? await res.json() : null;
      if (!res.ok) {
        throw new Error(data?.error || `Server error: ${res.status}`);
      }
      return data;
    })
    .then(data => {
      if (data && data.solution) {
        setSolution(data.solution);
      } else {
        setError('Failed to generate solution. Received empty response.');
      }
    })
    .catch(err => {
      console.error(err);
      setError(err.message || 'An error occurred while generating the solution.');
    })
    .finally(() => setLoading(false));
  }, [issue]);

  const copyToClipboard = () => {
    // Extract everything under "## 1. Comment for the Issue" up to the next heading
    const match = solution.match(/##\s*(?:1\.)?\s*Comment for the Issue\s*\n+([\s\S]*?)(\n##|$)/i);
    const commentToCopy = match ? match[1].trim() : solution;
    
    navigator.clipboard.writeText(commentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-xl font-bold truncate max-w-2xl">{issue.title}</h2>
        </div>
        <div className="flex gap-2">
          <a
            href={issue.html_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 btn-liquid-glass text-sm transition-colors text-white"
          >
            <ExternalLink size={14} />
            View on GitHub
          </a>
          <button 
            onClick={copyToClipboard}
            disabled={!solution || loading}
            className="flex items-center gap-2 px-4 py-2 btn-liquid-glass text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Comment' : 'Copy Comment'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Issue Header Info */}
          <div className="mb-6 card-liquid-glass p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {issue.user?.avatar_url && (
                  <img src={issue.user.avatar_url} alt={issue.user.login} className="w-10 h-10 rounded-full border border-white/10" />
                )}
                <div>
                  <div className="font-medium text-white">{issue.user?.login || 'Unknown User'}</div>
                  <div className="text-sm text-gray-400">
                    Opened on {new Date(issue.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {issue.state && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${issue.state === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                  {issue.state.charAt(0).toUpperCase() + issue.state.slice(1)}
                </div>
              )}
            </div>
            
            {(issue.labels?.length > 0 || issue.milestone) && (
               <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                 {issue.labels?.map((label: any) => (
                   <span key={label.id} className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: `#${label.color}20`, color: `#${label.color || '6366f1'}`, border: `1px solid #${label.color}40` }}>
                     {label.name}
                   </span>
                 ))}
                 {issue.milestone && (
                   <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                     <Flag size={12} />
                     {issue.milestone.title}
                   </span>
                 )}
               </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-gray-400">Analyzing repository and drafting your solution guide...</p>
            </div>
          ) : error ? (
            <div className="p-4 card-liquid-glass border-red-500/30 text-red-400">
              {error}
            </div>
          ) : (
            <div className="prose prose-invert prose-indigo max-w-none card-liquid-glass p-8">
              <div className="markdown-body prose-headings:text-white prose-p:text-gray-300 prose-a:text-indigo-400 prose-code:text-gray-200">
                <Markdown>{solution}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}