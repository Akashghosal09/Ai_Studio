import { useState } from 'react';
import { Layout, Database, BarChart3, HelpCircle, History, Settings, LogOut, ChevronRight } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { Dashboard } from './components/Dashboard';
import { motion, AnimatePresence } from 'motion/react';
import { DataRecord } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [data, setData] = useState<DataRecord[] | null>(null);
  const [view, setView] = useState<'upload' | 'dashboard'>('upload');

  const handleDataLoaded = (loadedData: DataRecord[]) => {
    setData(loadedData);
    setView('dashboard');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Navigation Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col items-center lg:items-stretch py-8 transition-all">
          <div className="px-4 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Layout size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden lg:block italic">LiSa</h1>
        </div>

        <nav className="flex-1 space-y-2 px-3">
          <NavItem 
            icon={<Database size={20} />} 
            label="My Datasets" 
            active={view === 'upload'} 
            onClick={() => setView('upload')}
          />
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="Analytics" 
            active={view === 'dashboard'} 
            disabled={!data}
            onClick={() => data && setView('dashboard')}
          />
          <div className="pt-4 pb-2 px-4 lg:px-4 hidden lg:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resources</p>
          </div>
          <NavItem icon={<History size={20} />} label="Recent Reports" disabled />
          <NavItem icon={<HelpCircle size={20} />} label="Help Center" disabled />
        </nav>

        <div className="px-3 pt-8 border-t border-slate-100 flex flex-col gap-2">
           <NavItem icon={<Settings size={20} />} label="Settings" disabled />
           <NavItem icon={<LogOut size={20} />} label="Sign Out" disabled />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        <header className="h-20 border-bottom border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
             <span>Platform</span>
             <ChevronRight size={14} />
             <span className="text-slate-900 font-semibold">{view === 'upload' ? 'Upload Dataset' : 'Analysis Dashboard'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 text-indigo-700 rounded-full text-[10px] uppercase tracking-wider font-bold border border-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
               Cloud Engine Active
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User Profile" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            {view === 'upload' ? (
              <motion.section
                key="upload-section"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center justify-center min-h-[60vh] py-12"
              >
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Start your data journey here.</h2>
                  <p className="text-slate-500 max-w-lg mx-auto">
                    Upload your financial reports or sales datasets. We'll leverage AI to identify trends, 
                    peak earnings, and growth opportunities tailored for your business.
                  </p>
                </div>
                <FileUploader onDataLoaded={handleDataLoaded} />
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                   <FeatureCard 
                    title="Real-time Stats" 
                    desc="Instant calculation of max/min income and revenue floors."
                   />
                   <FeatureCard 
                    title="Trend Analytics" 
                    desc="Beautifully visualized time-series data with interactive filters."
                   />
                   <FeatureCard 
                    title="AI Reports" 
                    desc="Export professional PDF/CSV reports powered by Gemini AI insights."
                   />
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="dashboard-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {data && <Dashboard data={data} />}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, disabled, onClick }: { icon: React.ReactNode, label: string, active?: boolean, disabled?: boolean, onClick?: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-500"
      )}
    >
      <div className={cn("transition-transform group-hover:scale-110")}>
        {icon}
      </div>
      <span className="hidden lg:block">{label}</span>
    </button>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600">
        <div className="w-2 h-2 rounded-full bg-blue-600" />
      </div>
      <h3 className="font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

