import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, GitPullRequest, MessageSquare, Tag } from 'lucide-react';
import CustomDropdown from './components/ui/dropdown-01';

export default function ExploreIssues({ onSelectIssue }: { onSelectIssue: (issue: any) => void }) {
  const [issues, setIssues] = useState<any[]>([]);
  const [topic, setTopic] = useState(() => localStorage.getItem('explore_pref_topic') || 'react');
  const [label, setLabel] = useState(() => {
    const saved = localStorage.getItem('explore_pref_label');
    return saved !== null ? saved : 'good first issue';
  });
  const [state, setState] = useState(() => localStorage.getItem('explore_pref_state') || 'open');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    localStorage.setItem('explore_pref_topic', topic);
    localStorage.setItem('explore_pref_label', label);
    localStorage.setItem('explore_pref_state', state);
  }, [topic, label, state]);

  const labelOptions = [
    { value: "", label: "Any Label" },
    { value: "good first issue", label: "good first issue" },
    { value: "help wanted", label: "help wanted" },
    { value: "bug", label: "bug" },
    { value: "documentation", label: "documentation" },
    { value: "enhancement", label: "enhancement" }
  ];

  const stateOptions = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" }
  ];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    
    // Construct query
    let query = `language:${topic}`;
    if (label) query += ` label:"${label}"`;
    if (state) query += ` state:${state}`;

    try {
      const res = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }) // We actually need to modify the server.ts to accept the full query or build it on the server
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setIssues(data.items || []);
      } else {
        throw new Error('Response is not JSON');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-6 border-b border-white/5">
        <h2 className="text-2xl font-bold mb-4">Explore Issues</h2>
        <form onSubmit={handleSearch} className="flex flex-col gap-4 card-liquid-glass p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Search / Language</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. javascript, react, python"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white backdrop-blur-md hover:bg-white/10"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Label</label>
              <CustomDropdown
                options={labelOptions}
                value={label}
                onChange={setLabel}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">State</label>
              <CustomDropdown
                options={stateOptions}
                value={state}
                onChange={setState}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-liquid-glass px-8 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
              {loading ? 'Searching...' : 'Find Issues'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!hasSearched ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>Use the filters above to find open-source issues to tackle.</p>
          </div>
        ) : loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
             <p className="text-gray-400">Scanning GitHub for issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <p>No issues found matching your criteria. Try loosening your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {issues.map(issue => {
              const repoName = issue.repository_url ? issue.repository_url.split('/').slice(-2).join('/') : '';
              return (
                <div key={issue.id} className="card-liquid-glass p-6 hover:border-indigo-500/30 transition-colors relative group">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-lg font-semibold leading-snug group-hover:text-indigo-400 transition-colors">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded">
                        #{issue.number}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    {repoName && (
                      <span className="flex items-center gap-1">
                        <GitPullRequest className="w-3.5 h-3.5" />
                        {repoName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {issue.comments} comments
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                    {issue.body || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                       {issue.labels?.map((l: any) => (
                         <span 
                           key={l.name} 
                           className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-[#2a2f36] text-gray-200 border border-white/10 shadow-sm"
                         >
                           {l.color && <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: `#${l.color}` }}></span>}
                           {l.name}
                         </span>
                       ))}
                    </div>
                    
                    <button 
                      onClick={() => onSelectIssue(issue)}
                      className="btn-liquid-glass px-4 py-2 text-sm font-semibold transition-all"
                    >
                      Solve this Issue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}