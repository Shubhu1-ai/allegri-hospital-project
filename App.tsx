import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import CameraView from './components/CameraView';
import HistoryView from './components/HistoryView';
import { UserProfile, AnalysisResult } from './types';
import { Camera, ClipboardList, UserCircle, HelpCircle, MessageCircle, LogOut, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react';

// Enum for navigation
enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // --- NEW FEATURE: LOAD USER DATA ON LOGIN ---
  useEffect(() => {
    if (user && user.username) {
      // Create a unique key for this user (e.g., "HISTORY_ALLEGRI")
      const storageKey = `HISTORY_${user.username}`;
      const savedHistory = localStorage.getItem(storageKey);
      
      if (savedHistory) {
        try {
          setAnalysisHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to load user history", e);
        }
      } else {
        // If no history exists for this user, start empty
        setAnalysisHistory([]);
      }
    }
  }, [user]);

  // --- NEW FEATURE: SAVE DATA WHENEVER IT CHANGES ---
  useEffect(() => {
    if (user && user.username) {
      const storageKey = `HISTORY_${user.username}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(analysisHistory));
      } catch (e) {
        alert("Storage Full! Please delete some old records to save new ones.");
      }
    }
  }, [analysisHistory, user]);

  const handleLogin = (userProfile: UserProfile | null) => {
    if (userProfile) {
      setUser(userProfile);
      setView(ViewState.DASHBOARD);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView(ViewState.LOGIN);
    setAnalysisHistory([]); // Clear the SCREEN, but storage remains safe
  };

  const handleAnalysisComplete = (results: AnalysisResult[]) => {
    setAnalysisHistory(prev => [...prev, ...results]);
    setView(ViewState.HISTORY);
  };

  const handleClearHistory = () => {
    setAnalysisHistory([]);
  };

  const handleDeleteHistory = (ids: string[]) => {
    setAnalysisHistory(prev => prev.filter(item => !ids.includes(item.id)));
  };

  const renderContent = () => {
    switch (view) {
      case ViewState.LOGIN:
        return <LoginForm onLogin={handleLogin} />;
      
      case ViewState.CAMERA:
        return (
          <CameraView 
            onBack={() => setView(ViewState.DASHBOARD)} 
            onAnalysisComplete={handleAnalysisComplete}
          />
        );
      
      case ViewState.HISTORY:
        return (
          <HistoryView 
            results={analysisHistory} 
            onBack={() => setView(ViewState.DASHBOARD)}
            onClearHistory={handleClearHistory}
            onDeleteHistory={handleDeleteHistory}
          />
        );

      case ViewState.PROFILE:
          return (
             <div className="max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl mt-12 animate-in fade-in zoom-in duration-300 border border-slate-100">
                <div className="flex flex-col items-center">
                   <div className="relative">
                     <div className="h-32 w-32 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-inner border-4 border-white">
                        <UserCircle size={80} />
                     </div>
                     <div className="absolute bottom-6 right-0 h-8 w-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
                     </div>
                   </div>
                   
                   <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{user?.username || 'USER'}</h2>
                   <p className="text-emerald-600 font-black text-xs uppercase tracking-[0.2em] mt-2">{user?.role || 'Staff'}</p>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{user?.department || 'General'}</p>
                   
                   <div className="w-full mt-10 space-y-4">
                      <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setShowHelp(!showHelp)}
                          className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                              <HelpCircle size={20} />
                            </div>
                            <span className="font-bold text-slate-700 tracking-tight">System Troubleshooting</span>
                          </div>
                          <ChevronRight size={20} className={`text-slate-400 transition-transform duration-300 ${showHelp ? 'rotate-90' : ''}`} />
                        </button>
                        
                        {showHelp && (
                          <div className="p-6 bg-white text-sm text-slate-600 space-y-4 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                             <div className="flex gap-4 items-start">
                               <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                               <div>
                                 <p className="font-bold text-slate-800 mb-1">Camera Permission</p>
                                 <p className="text-xs leading-relaxed">Ensure browser site permissions are enabled. If the preview is black, refresh the browser and re-authenticate.</p>
                               </div>
                             </div>
                             <div className="flex gap-4 items-start">
                               <BookOpen size={18} className="text-blue-500 shrink-0 mt-0.5" />
                               <div>
                                 <p className="font-bold text-slate-800 mb-1">Pi Analysis Interface</p>
                                 <p className="text-xs leading-relaxed">Images are sent via encrypted local tunnel to the ALLEGRI Pi Cluster. Results usually appear within 5 seconds.</p>
                               </div>
                             </div>
                          </div>
                        )}
                      </div>

                      <button className="w-full flex items-center justify-between p-5 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all shadow-sm group">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                            <MessageCircle size={20} />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-slate-700">Contact IT Support</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">support@allegri.health</span>
                          </div>
                        </div>
                      </button>

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-5 border border-red-50 bg-red-50/30 rounded-3xl hover:bg-red-50 transition-all group mt-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <LogOut size={20} />
                          </div>
                          <span className="font-bold text-red-600 tracking-tight">Sign Out System</span>
                        </div>
                      </button>
                   </div>

                   <button 
                     onClick={() => setView(ViewState.DASHBOARD)}
                     className="mt-8 text-xs font-black text-slate-400 hover:text-emerald-600 uppercase tracking-[0.2em] transition-colors"
                   >
                     Return to Dashboard
                   </button>
                </div>
             </div>
          );
      
      case ViewState.DASHBOARD:
      default:
        return (
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
            <div className="mb-12">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">ALLEGRI Dashboard</h1>
              <p className="text-slate-500 font-medium mt-1">Authorized Medical Interface • Diagnostic Level Access</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                onClick={() => setView(ViewState.CAMERA)}
                className="group relative overflow-hidden bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 hover:shadow-2xl hover:border-emerald-200 hover:-translate-y-2 transition-all duration-500 text-left"
              >
                <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  <Camera size={200} className="text-emerald-500" />
                </div>
                <div className="h-16 w-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  <Camera size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Capture Sample</h3>
                <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed">
                  Initiate real-time camera interface for multi-sample acquisition. Features built-in manual cropping for higher diagnostic precision.
                </p>
                <div className="mt-8 flex items-center text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                  Open Camera Module <ChevronRight size={14} className="ml-1 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => setView(ViewState.HISTORY)}
                className="group relative overflow-hidden bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 hover:shadow-2xl hover:border-blue-200 hover:-translate-y-2 transition-all duration-500 text-left"
              >
                <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  <ClipboardList size={200} className="text-blue-500" />
                </div>
                <div className="h-16 w-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  <ClipboardList size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Calculation & Results</h3>
                <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed">
                  Access historical diagnostic logs and Pi analysis results. Filter records by status or perform batch deletions to manage lab data.
                </p>
                <div className="mt-8 flex items-center text-blue-600 font-black text-[10px] uppercase tracking-widest">
                  View Data Logs <ChevronRight size={14} className="ml-1 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </div>
            
             <div className="mt-16 flex justify-center">
                <button 
                  onClick={() => setView(ViewState.PROFILE)}
                  className="px-6 py-2 bg-slate-200/50 hover:bg-slate-200 text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-[0.25em] rounded-full transition-all"
                >
                  System Preferences & Profile
                </button>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onProfileClick={() => setView(ViewState.PROFILE)} 
      />
      <main className="pb-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;