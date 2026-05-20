import React, { useState, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, GitPullRequest, GitMerge, CheckSquare, Settings, Search, Bell, Activity, MessageSquare, Bot, AlertTriangle, LogOut, GitCommit, Flame, Library, BarChart2, GitFork, Bug, CircleCheck, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, changePositive, noSubtitle }: any) => (
  <div className="bg-[#1a1f24] p-6 rounded-2xl flex flex-col justify-between border border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-white/5 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={16} className={`${changePositive ? 'text-[#10b981]' : 'text-gray-400'}`} />
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
        </div>
        <div className="flex items-end gap-2 text-3xl font-bold text-white tracking-tight">
          {value}
          {!noSubtitle && subtitle && (
            <span className="text-sm font-medium text-gray-500 mb-1">{subtitle}</span>
          )}
        </div>
      </div>
      <div className={`w-10 h-10 rounded-xl bg-black/40 shadow-inner flex items-center justify-center`}>
      </div>
    </div>
  </div>
);

const TypewriterText = ({ baseText, highlightText }: { baseText: string, highlightText: string }) => {
  const fullText = baseText + highlightText;
  const [length, setLength] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLength(prev => {
        if (prev >= fullText.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 50); // 50ms per char
    return () => clearInterval(timer);
  }, [fullText]);

  const currentBase = baseText.substring(0, length);
  const currentHighlight = length > baseText.length ? highlightText.substring(0, length - baseText.length) : '';
  const showCursor = length < fullText.length;

  return (
    <>
      {currentBase}
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500">
        {currentHighlight}
      </span>
      {showCursor && <span className="animate-pulse ml-0.5 text-white/50 border-r-4 border-white/50 inline-block h-[0.8em] align-middle mt-[-0.1em]"></span>}
    </>
  );
};

const ContributionGraph = ({ heatmapData = [], totalContributions = 0, currentStreak = 0, longestStreak = 0, busiestDay = 0 }: any) => {
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const [tooltip, setTooltip] = useState<{x: number, y: number, count: number, date: string, visible: boolean} | null>(null);
  
  // Create an array of weeks (chunks of 7 days)
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const handleMouseEnter = (e: React.MouseEvent, count: number, date: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      count,
      date,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => prev ? { ...prev, visible: false } : null);
  };

  return (
    <div className="bg-[#1a1f24] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-heading font-semibold text-white tracking-tight">Contribution Graph</h3>
          <p className="text-sm text-gray-400 mt-1">{totalContributions} contributions in the last year</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Less</span>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1 group relative">
              <div className="w-3 h-3 rounded-sm bg-[#111827]"></div>
            </div>
            <div className="flex items-center gap-1 group relative cursor-help">
              <div className="w-3 h-3 rounded-sm bg-[#064e3b]"></div>
              <span className="hidden sm:inline">1-2</span>
            </div>
            <div className="flex items-center gap-1 group relative cursor-help">
              <div className="w-3 h-3 rounded-sm bg-[#047857]"></div>
              <span className="hidden sm:inline">3-5</span>
            </div>
            <div className="flex items-center gap-1 group relative cursor-help">
              <div className="w-3 h-3 rounded-sm bg-[#10b981]"></div>
              <span className="hidden sm:inline">6-9</span>
            </div>
            <div className="flex items-center gap-1 group relative cursor-help">
              <div className="w-3 h-3 rounded-sm bg-[#34d399]"></div>
              <span className="hidden sm:inline">10+</span>
            </div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Months header */}
          <div className="flex ml-8 mb-2">
            {months.map((m, i) => (
              <div key={i} className="flex-1 text-xs text-gray-500 font-medium">{m}</div>
            ))}
          </div>

          <div className="flex">
            {/* Days sidebar */}
            <div className="flex flex-col justify-between text-xs text-gray-500 font-medium pr-2 h-[120px] py-1">
              <span>Sun</span>
              <span>Wed</span>
              <span>Sat</span>
            </div>

            {/* Grid */}
            <div className="flex gap-1.5 flex-1" onMouseLeave={handleMouseLeave}>
              {weeks.map((week: any[], weekIndex: number) => (
                <div key={weekIndex} className="flex flex-col gap-1.5 flex-1">
                  {week.map((day: any, dayIndex: number) => {
                    const count = day.count;
                    let bgColor = 'bg-[#111827]';
                    if (count >= 1) bgColor = 'bg-[#064e3b]';
                    if (count >= 3) bgColor = 'bg-[#047857]';
                    if (count >= 6) bgColor = 'bg-[#10b981]';
                    if (count >= 10) bgColor = 'bg-[#34d399]';

                    return (
                      <div 
                        key={dayIndex} 
                        onMouseEnter={(e) => handleMouseEnter(e, count, day.date)}
                        className={`w-3 h-3 rounded-sm ${bgColor} transition-all duration-200 hover:ring-2 hover:ring-white/40 cursor-pointer`}
                        aria-label={`${count} contributions on ${day.date}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tooltip && tooltip.visible && (
        <div 
          className="fixed z-[100] bg-[#1a1f24] border border-white/10 text-white rounded-md shadow-2xl px-3 py-2 pointer-events-none transform -translate-x-1/2 -translate-y-full min-w-[120px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-semibold text-sm mb-0.5 text-center">
            {tooltip.count} contribution{tooltip.count !== 1 && 's'}
          </div>
          <div className="text-gray-400 text-xs text-center">
            {new Date(tooltip.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {/* A small arrow pointing down */}
          <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-[#1a1f24] border-b border-r border-white/10 transform rotate-45 -translate-x-1/2 translate-y-1/2"></div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-center">
        <div className="flex-1">
          <div className="text-2xl font-bold text-[#10b981]">{totalContributions}</div>
          <div className="text-xs font-medium text-gray-500 mt-1">Total Contributions</div>
        </div>
        <div className="flex-1 border-l border-white/5">
          <div className="text-2xl font-bold text-[#10b981]">{currentStreak}</div>
          <div className="text-xs font-medium text-gray-500 mt-1">Current Streak</div>
        </div>
        <div className="flex-1 border-l border-white/5">
          <div className="text-2xl font-bold text-[#10b981]">{longestStreak}</div>
          <div className="text-xs font-medium text-gray-500 mt-1">Longest Streak</div>
        </div>
        <div className="flex-1 border-l border-white/5">
          <div className="text-2xl font-bold text-[#10b981]">{busiestDay}</div>
          <div className="text-xs font-medium text-gray-500 mt-1">Busiest Day</div>
        </div>
      </div>
    </div>
  );
};

import ExploreIssues from './ExploreIssues';
import IssueSolution from './IssueSolution';
import MyIssues from './MyIssues';
import PullRequests from './PullRequests';
import Commits from './Commits';
import { SpaceBackground } from './components/ui/space-background';
import { NavHeader } from './components/ui/nav-header';

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeRange, setTimeRange] = useState(6);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null); // For IssueSolution view

  useEffect(() => {
    fetch('/api/github/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error('Response is not JSON');
      })
      .then(data => {
         if (!data.error) setStats(data);
      })
      .catch(console.error);
  }, []);

  const statsData = stats || {
    totalContributions: '-',
    totalCommits: '-',
    pullRequests: '-',
    issuesOpened: '-',
    issuesFixed: '-',
    forksCreated: '-',
    publicRepos: '-',
    busiestDay: '-',
    currentStreak: '-',
    longestStreak: '-',
    heatmapData: [],
    recentRepos: []
  };

  const calculateWeeklyActivity = () => {
    if (!statsData.heatmapData || statsData.heatmapData.length === 0) return [];
    
    // Get the last 7 days for "Weekly Activity"
    const last7Days = statsData.heatmapData.slice(-7);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return last7Days.map((day: any) => {
      const dateObj = new Date(day.date);
      return {
        name: dayNames[dateObj.getDay()],
        value: day.count
      };
    });
  };

  const weeklyActivityData = calculateWeeklyActivity();

  const tabs = ['Overview', 'Explore Issues', 'My Issues', 'Pull Requests', 'Commits'];

  return (
    <div className="relative flex h-screen bg-black text-white font-sans overflow-hidden">
      <SpaceBackground />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10 relative">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 header-liquid-glass">
          <motion.div 
            className="flex items-center gap-2 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
              />
              <span className="relative z-10">O</span>
            </motion.div>
            <motion.span 
              className="text-lg font-extrabold hidden sm:block text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white bg-[length:200%_auto]"
              animate={{ backgroundPosition: ['0% center', '200% center'] }}
              transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
            >
              OS Copilot
            </motion.span>
          </motion.div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center hidden md:flex">
             <NavHeader 
               tabs={tabs} 
               activeTab={activeTab} 
               onTabSelect={(tab) => {
                 setActiveTab(tab);
                 setSelectedIssue(null);
               }} 
             />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors relative"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 card-liquid-glass border-white/10 p-4 z-50 rounded-xl">
                  <h4 className="text-sm font-semibold mb-3 text-white">Notifications</h4>
                  <p className="text-xs text-gray-400">No new notifications at this time.</p>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-full border border-transparent hover:border-white/10 transition-colors outline-none cursor-pointer"
              >
                <img src={user?.avatar_url || "https://i.pravatar.cc/150?img=11"} alt="Profile" className="w-10 h-10 rounded-full bg-gray-800 shadow-[0_0_15px_rgba(0,0,0,0.4)] border border-white/10 hover:scale-105 transition-transform" />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, y: -10, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 10, y: -10, filter: "blur(10px)" }}
                    transition={{
                      duration: 0.6,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="absolute right-0 top-12 mt-2 z-50 pt-2"
                  >
                    <div className="flex flex-col items-end gap-2">
                       {[
                         {
                           label: user?.login || "Dev",
                           Icon: <img src={user?.avatar_url || "https://i.pravatar.cc/150?img=11"} className="w-5 h-5 rounded-full" alt="avatar" />,
                           onClick: () => {},
                         },
                         {
                           label: "Log Out",
                           Icon: <LogOut className="w-4 h-4 text-red-400" />,
                           onClick: onLogout,
                           danger: true
                         }
                       ].map((option, index) => (
                         <motion.div
                           key={index}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 20 }}
                           transition={{
                             duration: 0.3,
                             delay: index * 0.05,
                           }}
                         >
                           <button
                             onClick={() => { option.onClick(); setShowUserMenu(false); }}
                             className={`flex items-center justify-end w-full gap-3 px-4 py-2.5 text-sm whitespace-nowrap bg-black/60 hover:bg-black/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/10 rounded-xl backdrop-blur-md transition-colors ${option.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-200 hover:text-white'}`}
                           >
                             <span className="font-medium">{option.label}</span>
                             {option.Icon}
                           </button>
                         </motion.div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Mobile Navigation (shows only on small screens) */}
        <div className="md:hidden p-4 header-liquid-glass sticky top-[72px] z-20 mx-auto overflow-x-auto w-full">
           <NavHeader 
             tabs={tabs} 
             activeTab={activeTab} 
             onTabSelect={(tab) => {
               setActiveTab(tab);
               setSelectedIssue(null);
             }} 
           />
        </div>

        <div className="flex-1 overflow-x-hidden relative h-full">
          <AnimatePresence mode="wait">
            {selectedIssue ? (
              <motion.div
                key="issue-solution"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <IssueSolution issue={selectedIssue} onBack={() => setSelectedIssue(null)} />
              </motion.div>
            ) : activeTab === 'Explore Issues' ? (
              <motion.div
                key="explore-issues"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ExploreIssues onSelectIssue={(issue) => setSelectedIssue(issue)} />
              </motion.div>
            ) : activeTab === 'My Issues' ? (
              <motion.div
                key="my-issues"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <MyIssues />
              </motion.div>
            ) : activeTab === 'Pull Requests' ? (
              <motion.div
                key="pull-requests"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <PullRequests />
              </motion.div>
            ) : activeTab === 'Commits' ? (
              <motion.div
                key="commits"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Commits />
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="p-6 space-y-6 h-full flex flex-col overflow-y-auto"
              >
              
              {/* Welcome Banner */}
              <div className="w-full py-8 pl-2 flex flex-col gap-2">
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl md:text-6xl font-heading font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-sm pb-1"
                >
                  <TypewriterText baseText="Welcome back, " highlightText={user?.login || 'Developer'} />
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-gray-200 text-lg font-medium drop-shadow-md"
                >
                  Here's what is happening with your open source contributions.
                </motion.p>
              </div>

              {/* Stats Row */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { title: "Total Commits", value: statsData.totalCommits, icon: GitCommit, changePositive: true },
              { title: "Current Streak", value: statsData.currentStreak, subtitle: "days", icon: Flame, changePositive: true },
              { title: "Public Repos", value: statsData.publicRepos, icon: Library, changePositive: true },
              { title: "Longest Streak", value: statsData.longestStreak, subtitle: "days", icon: BarChart2, changePositive: true },
              { title: "Pull Requests", value: statsData.pullRequests, icon: GitPullRequest, changePositive: true },
              { title: "Forks Created", value: statsData.forksCreated, icon: GitFork, changePositive: true },
              { title: "Issues Opened", value: statsData.issuesOpened, icon: Bug, changePositive: true },
              { title: "Issues Closed", value: statsData.issuesFixed, icon: CircleCheck, changePositive: true },
            ].map((stat, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } }}>
                <StatCard 
                   title={stat.title} 
                   value={stat.value} 
                   subtitle={stat.subtitle}
                   changePositive={stat.changePositive} 
                   icon={stat.icon} 
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Contribution Graph */}
          <ContributionGraph 
            heatmapData={statsData.heatmapData}
            totalContributions={statsData.totalContributions}
            currentStreak={statsData.currentStreak}
            longestStreak={statsData.longestStreak}
            busiestDay={statsData.busiestDay}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1a1f24] rounded-2xl p-6 border border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="flex flex-col mb-8 text-left">
                <h3 className="font-heading font-semibold text-white text-lg tracking-tight">Weekly Activity</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Contribution velocity over time</p>
              </div>
              <div className="h-64 w-full -ml-3 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValueGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9ca3af', fontSize: 12}} 
                      dy={10} 
                      ticks={weeklyActivityData.map(d => d.name)}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#10b981', fontWeight: '500', display: 'flex', flexDirection: 'column', marginTop: '10px' }}
                      labelStyle={{ color: '#d1d5db', marginBottom: '8px', fontSize: '1rem', fontWeight: '500' }}
                      cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                      formatter={(value: any, name: any, props: any) => [`contributions : ${value}`, props.payload.name]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorValueGreen)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#1a1f24] rounded-2xl p-6 border border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col text-left">
                  <h3 className="font-heading font-semibold text-white text-lg tracking-tight">Recent Public Repositories</h3>
                </div>
              </div>
              <div className="h-64 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                {statsData.recentRepos && statsData.recentRepos.length > 0 ? (
                  statsData.recentRepos.map((repo: any, index: number) => (
                    <motion.a 
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      key={index} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium truncate pr-4">{repo.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full shrink-0">
                          <Star size={12} fill="currentColor" />
                          <span>{repo.stargazerCount || 0}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{repo.description || "No description provided."}</p>
                    </motion.a>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Library size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No public repositories found.</p>
                  </div>
                )}
              </div>
            </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #333;
          border-radius: 20px;
        }
      `}</style>
    </div>
  ); 
}
