import React, { useMemo } from 'react';
import { CommunityIssue, IssueCategory } from '../types';
import { CATEGORY_META } from './IssueList';
import { Sparkles, Users, FileCheck, Award, ThumbsUp, Landmark } from 'lucide-react';

interface StatsPanelProps {
  issues: CommunityIssue[];
}

export default function StatsPanel({ issues }: StatsPanelProps) {
  
  const stats = useMemo(() => {
    let totalActive = issues.length;
    let totalAnalyzed = issues.filter(i => i.status !== 'pending_analysis' && !i.optimistic).length;
    let mpBriefingsCount = issues.filter(i => i.status === 'action_prioritized').length;

    // Calculate households impacted
    let totalHouseholds = issues.reduce((acc, curr) => {
      const multiplier = curr.impactScale === 5 ? 500 : curr.impactScale === 4 ? 150 : curr.impactScale === 3 ? 50 : 10;
      return acc + multiplier;
    }, 0);

    // Distribution by category
    const catCounts: Record<IssueCategory, number> = {
      electricity: 0,
      garbage: 0,
      sanitation: 0,
      road_accidents: 0,
      infrastructure: 0
    };

    issues.forEach(issue => {
      if (catCounts[issue.category] !== undefined) {
        catCounts[issue.category]++;
      }
    });

    // Distribution by state
    const stateCounts: Record<string, number> = {};
    issues.forEach(issue => {
      const state = issue.location.state;
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    const statesList = Object.entries(stateCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      totalActive,
      totalAnalyzed,
      mpBriefingsCount,
      totalHouseholds,
      catCounts,
      statesList
    };
  }, [issues]);

  const maxCatCount = Math.max(...(Object.values(stats.catCounts) as number[]), 1);

  // Community progression score: percentage of reports that citizens pledge to partner on
  const alignmentScore = Math.min(100, Math.round((stats.totalAnalyzed / Math.max(1, stats.totalActive)) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* 4 Core Summary Widgets */}
      <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Active Reports */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm relative overflow-hidden">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Total Reports</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{stats.totalActive}</span>
          </div>
        </div>

        {/* Total Households represented */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm relative overflow-hidden">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Est. Households</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{stats.totalHouseholds}+</span>
          </div>
        </div>

        {/* Needs Detected */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm relative overflow-hidden">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Needs Detected</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{stats.totalAnalyzed}</span>
          </div>
        </div>

        {/* Community Alignment Progress */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm relative overflow-hidden">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Analysis Rate</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{alignmentScore}%</span>
          </div>
        </div>

      </div>

      {/* Category Breakdown (Custom SVG Interactive Bars) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 mb-4 flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-indigo-600" />
          <span>Need Frequency by Category</span>
        </h4>

        <div className="space-y-3.5">
          {(Object.keys(CATEGORY_META) as IssueCategory[]).map((cat) => {
            const count = stats.catCounts[cat];
            const meta = CATEGORY_META[cat];
            const percent = Math.round((count / maxCatCount) * 100);

            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-750 font-semibold flex items-center gap-1.5 capitalize">
                    <meta.icon className={`w-3.5 h-3.5 ${meta.colorClass}`} />
                    {cat.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{count} reports</span>
                </div>
                
                {/* Custom bar widget */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full border border-slate-200 overflow-hidden relative">
                  <div 
                    className={`h-full bg-indigo-600 rounded-full transition-all duration-700`}
                    style={{ width: `${percent || 2}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regional Impact (State Leaders) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-600" />
            <span>State Participation</span>
          </h4>

          <div className="space-y-3">
            {stats.statesList.map((st, sIdx) => {
              return (
                <div key={sIdx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-700">{st.name}</span>
                  <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 rounded-full font-mono text-[10px] text-indigo-600 font-bold">
                    {st.count} reports
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Slogan Block */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 leading-relaxed italic">
          "Not just individual needs, but building collective progression for India."
        </div>
      </div>

    </div>
  );
}
