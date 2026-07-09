import React, { useState, useEffect } from 'react';
import { CommunityIssue, MPBriefing, IssueCategory, LocationInfo } from './types';
import IssueForm from './components/IssueForm';
import IssueList from './components/IssueList';
import NeedDetector from './components/NeedDetector';
import MPBriefingView from './components/MPBriefingView';
import StatsPanel from './components/StatsPanel';
import { 
  Sparkles, Landmark, MessageSquare, BarChart3, 
  CheckCircle, ShieldAlert, Heart, RefreshCw, AlertCircle 
} from 'lucide-react';

export default function App() {
  const [issues, setIssues] = useState<CommunityIssue[]>([]);
  const [briefings, setBriefings] = useState<Record<string, MPBriefing>>({});
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeBriefing, setActiveBriefing] = useState<MPBriefing | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detector' | 'stats'>('dashboard');
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [generatingBriefId, setGeneratingBriefId] = useState<string | null>(null);
  const [appError, setAppError] = useState('');

// 1. Load initial issues from the server
useEffect(() => {
  async function fetchIssues() {
    setIsLoadingIssues(true);
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) throw new Error('Failed to load community issues.');
      const data = await res.json();
      setIssues(data);
    } catch (err: any) {
      console.error(err);
      // Demo mode: Agar server fail ho toh empty array aur status dikhayein
      setIssues([]); 
      setAppError('System in Demo Mode: Displaying simulated community data.');
    } finally {
      setIsLoadingIssues(false);
    }
  }
  
  fetchIssues();
}, []);

  // 2. Handle a new issue submission with Optimistic UI updates
  const handleIssueSubmit = async (issueData: {
    category: IssueCategory;
    title: string;
    description: string;
    location: LocationInfo;
    reportedBy: string;
    impactScale: number;
  }) => {
    setIsSubmittingIssue(true);
    setAppError('');

    // OPTIMISTIC UI: Instantly create a temporary report and push it to state
    const tempId = `temp-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticIssue: CommunityIssue = {
      id: tempId,
      ...issueData,
      reportedAt: new Date().toISOString(),
      status: 'pending_analysis',
      optimistic: true // flags this card in the UI as syncing
    };

    // Pre-emptively append to issues at position 0 and select it
    setIssues(prev => [optimisticIssue, ...prev]);
    setSelectedIssueId(tempId);

    try {
      // Step A: Send request to server to persist the report
      const createRes = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });

      if (!createRes.ok) {
        throw new Error('Failed to save the issue. Reverting optimistic state.');
      }

      const realIssue: CommunityIssue = await createRes.json();

      // Replace optimistic issue with real persisted issue in local state
      setIssues(prev => prev.map(issue => issue.id === tempId ? realIssue : issue));
      setSelectedIssueId(realIssue.id);

      // Step B: Trigger the Gemini AI Need Detector immediately for analysis
      const analyzeRes = await fetch(`/api/issues/${realIssue.id}/analyze`, {
        method: 'POST'
      });

      if (!analyzeRes.ok) {
        throw new Error('Complaint registered successfully, but AI Need Analysis timed out.');
      }

      const analyzedIssue: CommunityIssue = await analyzeRes.json();

      // Replace with fully analyzed issue containing all Gemini tags, broader impact etc.
      setIssues(prev => prev.map(issue => issue.id === realIssue.id ? analyzedIssue : issue));

    } catch (err: any) {
      console.error(err);
      setAppError(err.message || 'Connection lost during report sync. Removed temporary local item.');
      // Revert the optimistic issue on critical error so state remains clean
      setIssues(prev => prev.filter(issue => issue.id !== tempId));
      setSelectedIssueId(null);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // 3. Trigger manual analysis for pending items
  const handleRunManualAnalysis = async (issueId: string) => {
    setIssues(prev => prev.map(issue => issue.id === issueId ? { ...issue, status: 'pending_analysis' } : issue));
    try {
      const res = await fetch(`/api/issues/${issueId}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error('AI analysis failed.');
      const analyzed: CommunityIssue = await res.json();
      setIssues(prev => prev.map(issue => issue.id === issueId ? analyzed : issue));
    } catch (err) {
      console.error(err);
      setAppError('AI Analysis failed. Please try again.');
    }
  };

  // 4. Generate MP Briefing and priority actions via Gemini
  const handleGenerateBriefing = async (cluster: {
    category: string;
    constituency: string;
    state: string;
    issueIds: string[];
  }) => {
    const clusterId = `cluster-${cluster.category}-${cluster.constituency}`;
    setGeneratingBriefId(clusterId);
    setAppError('');

    try {
      const res = await fetch('/api/briefings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cluster)
      });

      if (!res.ok) throw new Error('Failed to generate MP briefing.');
      const briefing: MPBriefing = await res.json();

      // Store briefing in dictionary
      setBriefings(prev => ({
        ...prev,
        [clusterId]: briefing
      }));

      // Update state: Set all grouped issues as prioritized
      setIssues(prev => prev.map(issue => {
        if (cluster.issueIds.includes(issue.id)) {
          return { ...issue, status: 'action_prioritized' };
        }
        return issue;
      }));

      // Open briefing directly
      setActiveBriefing(briefing);

    } catch (err: any) {
      console.error(err);
      setAppError('Failed to generate MP consultation. Please verify your connection.');
    } finally {
      setGeneratingBriefId(null);
    }
  };

  // 5. Update briefing status (e.g., when submitted to MP)
  const handleUpdateBriefingStatus = async (briefingId: string, status: MPBriefing['status']) => {
    setBriefings(prev => {
      const b = prev[briefingId];
      if (b) {
        return {
          ...prev,
          [briefingId]: { ...b, status }
        };
      }
      return prev;
    });

    if (activeBriefing && activeBriefing.id === briefingId) {
      setActiveBriefing(prev => prev ? { ...prev, status } : null);
    }
  };

  const selectIssue = (id: string) => {
    setSelectedIssueId(id === selectedIssueId ? null : id);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      
      {/* Top Main Administrative Header Banner */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
        
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Landmark className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-indigo-900 uppercase">Jan Awaaz</h1>
                <span className="text-[11px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded">जन आवाज़</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Indian Community Needs Detector & MP consultation Portal</p>
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'dashboard', label: 'Citizen Dashboard', icon: MessageSquare },
              { id: 'detector', label: 'MP Need Detector', icon: Sparkles },
              { id: 'stats', label: 'Constituency Stats', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setActiveBriefing(null); // Close briefing view when switching tabs
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 overflow-y-auto">
        
        {/* Global Error Notice Bar */}
        {appError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div className="flex-1 flex justify-between items-center">
              <span>{appError}</span>
              <button 
                onClick={() => setAppError('')}
                className="text-[10px] uppercase font-bold text-red-600 hover:text-red-800 px-2 py-0.5"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ----------------- SUB-VIEW: Active MP Briefing Details ----------------- */}
        {activeBriefing ? (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <MPBriefingView 
              briefing={activeBriefing} 
              onBack={() => setActiveBriefing(null)}
              onUpdateStatus={handleUpdateBriefingStatus}
            />
          </div>
        ) : (
          /* ----------------- STANDARD MAIN TAB ENGINE ----------------- */
          <div className="space-y-6">
            
            {/* TAB 1: Citizen Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form column (Left sidebar) */}
                <div className="lg:col-span-4 sticky top-6">
                  <IssueForm 
                    onSubmit={handleIssueSubmit} 
                    isSubmitting={isSubmittingIssue}
                  />
                </div>

                {/* Feed column (Right main panel) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">Active Citizen Reports</h3>
                      <p className="text-xs text-slate-500">Review pending collective concerns from your neighborhood.</p>
                    </div>
                    {isLoadingIssues && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Refreshing...</span>
                      </div>
                    )}
                  </div>

                  <IssueList 
                    issues={issues}
                    selectedIssueId={selectedIssueId}
                    onSelectIssue={selectIssue}
                    onRunAnalysis={handleRunManualAnalysis}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: MP Need Detector */}
            {activeTab === 'detector' && (
              <div className="max-w-4xl mx-auto">
                <NeedDetector 
                  issues={issues}
                  briefings={briefings}
                  onGenerateBriefing={handleGenerateBriefing}
                  generatingBriefId={generatingBriefId}
                  onSelectBriefing={setActiveBriefing}
                />
              </div>
            )}

            {/* TAB 3: Constituency Stats */}
            {activeTab === 'stats' && (
              <div className="max-w-5xl mx-auto">
                <StatsPanel issues={issues} />
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer copyright and collective alignment indicator */}
      <footer className="bg-slate-900 text-slate-400 px-8 py-3.5 text-[10px] flex justify-between border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Living and progressing Indian society through collaborative civic alignment.</span>
        </div>
        <div>
          <span>© 2026 Lok Sabha Citizen Consultation Portal • Swachh Bharat Co-op</span>
        </div>
      </footer>

    </div>
  );
}
