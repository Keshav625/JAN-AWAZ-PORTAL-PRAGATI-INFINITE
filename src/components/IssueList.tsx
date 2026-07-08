import React, { useState } from 'react';
import { CommunityIssue, IssueCategory } from '../types';
import { 
  Zap, Trash2, Droplets, ShieldAlert, Construction, 
  MapPin, User, Calendar, Loader, ChevronRight, Search, 
  Sparkles, ShieldCheck, CheckCircle2, TrendingUp, Info
} from 'lucide-react';

interface IssueListProps {
  issues: CommunityIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onRunAnalysis: (id: string) => void;
}

export const CATEGORY_META: Record<IssueCategory, { label: string; icon: any; colorClass: string; bgClass: string; borderClass: string }> = {
  electricity: {
    label: "Electricity Grid",
    icon: Zap,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200"
  },
  garbage: {
    label: "Waste Management",
    icon: Trash2,
    colorClass: "text-rose-600",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200"
  },
  sanitation: {
    label: "Sanitation & Water",
    icon: Droplets,
    colorClass: "text-sky-600",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-200"
  },
  road_accidents: {
    label: "Road Safety",
    icon: ShieldAlert,
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200"
  },
  infrastructure: {
    label: "Civic Infrastructure",
    icon: Construction,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200"
  }
};

export default function IssueList({ issues, selectedIssueId, onSelectIssue, onRunAnalysis }: IssueListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<IssueCategory | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'detected' | 'prioritized'>('all');

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.constituency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || issue.category === activeCategory;
    
    const matchesStatus = 
      activeStatus === 'all' ||
      (activeStatus === 'pending' && (issue.status === 'pending_analysis' || issue.optimistic)) ||
      (activeStatus === 'detected' && issue.status === 'detected') ||
      (activeStatus === 'prioritized' && issue.status === 'action_prioritized');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Box */}
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by constituency, locality or keyword..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 lg:col-span-7 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              All Categories
            </button>
            {(Object.keys(CATEGORY_META) as IssueCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <meta.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary filters */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 items-center">
          <span className="font-mono uppercase tracking-wider text-slate-400">Filter Status:</span>
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'All Reports' },
              { id: 'pending', label: 'AI Analysing' },
              { id: 'detected', label: 'Needs Detected' },
              { id: 'prioritized', label: 'Prioritized for MPs' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setActiveStatus(st.id as any)}
                className={`px-2.5 py-1 rounded-full border transition-all ${
                  activeStatus === st.id
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Issues */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white border border-slate-250 border-dashed rounded-2xl p-12 text-center text-slate-450">
          <Info className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No issues found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Try resetting filters or submitting a new community issue report for your constituency.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => {
            const meta = CATEGORY_META[issue.category];
            const isSelected = selectedIssueId === issue.id;
            const isSyncing = issue.optimistic || issue.status === 'pending_analysis';

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className={`group bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
                  isSelected 
                    ? 'border-indigo-500 ring-1 ring-indigo-500/20 shadow-indigo-500/5' 
                    : 'border-slate-200 hover:border-indigo-300'
                } ${isSyncing ? 'animate-pulse' : ''}`}
              >
                {/* Glow for Syncing */}
                {isSyncing && (
                  <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500 animate-infinite" />
                )}

                {/* Header Row */}
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 ${meta.colorClass} ${meta.bgClass} ${meta.borderClass}`}>
                    <meta.icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{issue.category.replace('_', ' ')}</span>
                  </div>

                  {/* Status Indicator */}
                  {issue.optimistic ? (
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-mono font-medium">
                      <Loader className="w-3 h-3 animate-spin text-indigo-500" />
                      <span>Optimistic Sync...</span>
                    </div>
                  ) : issue.status === 'pending_analysis' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunAnalysis(issue.id);
                      }}
                      className="px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] rounded-full flex items-center gap-1 shadow-sm shadow-indigo-100 cursor-pointer animate-bounce"
                    >
                      <Sparkles className="w-3 h-3 text-white animate-pulse" />
                      <span>Detect Recurring Needs</span>
                    </button>
                  ) : issue.status === 'action_prioritized' ? (
                    <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>MP Action Plan Ready</span>
                    </div>
                  ) : (
                    <div className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Need Detected</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-850 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{issue.title}</h3>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{issue.description}</p>

                {/* Location Meta */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <strong>{issue.location.constituency}</strong>, {issue.location.state}
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <User className="w-3 h-3" />
                    <span>By: {issue.reportedBy.split(' ')[0]}</span>
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(issue.reportedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </span>
                </div>

                {/* Impact Level Scale */}
                <div className="flex items-center justify-between mt-3 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Collective Impact Index</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className={`w-3.5 h-1.5 rounded-sm transition-all ${
                          idx <= issue.impactScale 
                            ? 'bg-indigo-600 shadow-sm shadow-indigo-100' 
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Expanded Details preview */}
                {isSelected && issue.aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-slate-150 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/30">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Optimistic Wealth & Community Progression Analysis</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic">{issue.aiAnalysis.broaderImpact}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px]">
                      <div>
                        <span className="text-slate-400 block">Safety Hazard Level:</span>
                        <span className={`font-semibold uppercase ${issue.aiAnalysis.safetyHazardLevel === 'critical' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {issue.aiAnalysis.safetyHazardLevel || 'Moderate'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Est. Cost Range:</span>
                        <span className="font-semibold text-slate-700">
                          {issue.aiAnalysis.estimatedCostRange || 'Local / Ward Budget'}
                        </span>
                      </div>
                    </div>

                    {/* AI Tags */}
                    {issue.aiAnalysis.tags && issue.aiAnalysis.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {issue.aiAnalysis.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-indigo-100/60 text-[9px] text-indigo-700 rounded border border-indigo-200">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
