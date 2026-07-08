import React, { useState, useMemo } from 'react';
import { CommunityIssue, NeedCluster, MPBriefing } from '../types';
import { Sparkles, Users, FileText, ChevronRight, CheckCircle, Flame, ArrowUpRight, Loader } from 'lucide-react';
import { CATEGORY_META } from './IssueList';

interface NeedDetectorProps {
  issues: CommunityIssue[];
  briefings: Record<string, MPBriefing>;
  onGenerateBriefing: (cluster: {
    category: string;
    constituency: string;
    state: string;
    issueIds: string[];
  }) => void;
  generatingBriefId: string | null;
  onSelectBriefing: (briefing: MPBriefing) => void;
}

export default function NeedDetector({
  issues,
  briefings,
  onGenerateBriefing,
  generatingBriefId,
  onSelectBriefing
}: NeedDetectorProps) {

  // Dynamically cluster issues by Constituency + Category
  const clusters = useMemo(() => {
    const map: Record<string, NeedCluster> = {};

    issues.forEach(issue => {
      // We only cluster issues that are fully analyzed ('detected' or 'action_prioritized')
      if (issue.status !== 'detected' && issue.status !== 'action_prioritized') return;

      const key = `${issue.location.constituency}-${issue.category}`;
      if (!map[key]) {
        map[key] = {
          id: key,
          category: issue.category,
          title: `Recurring ${CATEGORY_META[issue.category]?.label || issue.category} Concerns`,
          constituency: issue.location.constituency,
          state: issue.location.state,
          issueIds: [],
          summary: "",
          householdCount: 0,
          urgencyScore: 0,
          wealthMultiplicationFactor: "",
          recommendedAction: ""
        };
      }

      const cluster = map[key];
      cluster.issueIds.push(issue.id);
      
      // Calculate household factor & urgency multiplier
      const scaleMultiplier = issue.impactScale === 5 ? 500 : issue.impactScale === 4 ? 150 : issue.impactScale === 3 ? 50 : 10;
      cluster.householdCount += scaleMultiplier;
      cluster.urgencyScore = Math.min(100, cluster.urgencyScore + (issue.impactScale * 15));
    });

    // Populate descriptive summaries and wealth factors
    return Object.values(map).map(c => {
      const associatedIssues = issues.filter(i => c.issueIds.includes(i.id));
      const issueTitles = associatedIssues.map(i => i.title).join(", ");
      
      c.summary = `Consolidates ${c.issueIds.length} urgent citizen reports: ${issueTitles}.`;
      
      // Provide high-quality pre-baked multipliers (which get overridden/enhanced when MP briefing triggers Gemini)
      if (c.category === 'electricity') {
        c.wealthMultiplicationFactor = "Power stability stabilizes micro-business daily wages, enabling local cottage trade and extending children's night study hours by 40%.";
        c.recommendedAction = "Coordinate a local solar street-light installation and grid transformer load-testing.";
      } else if (c.category === 'garbage') {
        c.wealthMultiplicationFactor = "Converting toxic open dumps into community composting stations clears breathing air, reducing local childhood respiratory illness and building team-led green corridors.";
        c.recommendedAction = "Establish fenced, community-monitored waste collection centers in partnership with municipal boards.";
      } else if (c.category === 'sanitation') {
        c.wealthMultiplicationFactor = "Sanitized pathways prevent waterborne diseases, eliminating working-day losses and securing woman & child public dignity.";
        c.recommendedAction = "Construct dual community toilet stalls and establish volunteer pathway sanitation squads.";
      } else if (c.category === 'road_accidents') {
        c.wealthMultiplicationFactor = "Securing accident-prone blind corridors turns high-risk transit zones into safe public wellness streets, encouraging senior strolls and child safety.";
        c.recommendedAction = "Install high-reflection speed-breakers, blinkers, and form a citizen safety-patrol squad.";
      } else {
        c.wealthMultiplicationFactor = "Pedestrian crossings and bridge assets restore split community links, boosting daily market traffic and protecting fragile worker lives.";
        c.recommendedAction = "Submit an official MPLADS proposal for a pedestrian foot-overbridge or safety pathway.";
      }

      return c;
    });
  }, [issues]);

  return (
    <div className="space-y-4">
      {/* Intro banner */}
      <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 flex gap-3.5 items-start">
        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-900 tracking-tight">AI Community Need Scanner Active</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Individual citizen complaints are dynamically scanned and clustered by geographic ward and category. This detects high-density recurring patterns to generate structured action items for Members of Parliament.
          </p>
        </div>
      </div>

      {clusters.length === 0 ? (
        <div className="bg-white border border-slate-250 border-dashed rounded-2xl p-12 text-center text-slate-450">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Scanning for collective patterns...</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Please submit more community complaints. The need detector groups them once individual analyses are processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster) => {
            const meta = CATEGORY_META[cluster.category];
            const hasBriefing = briefings[cluster.id];
            const isGenerating = generatingBriefId === cluster.id;

            return (
              <div 
                key={cluster.id} 
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all hover:border-indigo-300"
              >
                {/* Side Accent Ribbon */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${cluster.category === 'electricity' ? 'bg-amber-500' : cluster.category === 'garbage' ? 'bg-rose-500' : cluster.category === 'sanitation' ? 'bg-sky-500' : cluster.category === 'road_accidents' ? 'bg-orange-500' : 'bg-emerald-500'}`} />

                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    {/* Category + Constituency Tags */}
                    <div className="flex flex-wrap gap-2 items-center mb-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border uppercase ${meta.colorClass} ${meta.bgClass} ${meta.borderClass}`}>
                        <meta.icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                      <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                        {cluster.constituency}, {cluster.state}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 tracking-tight">{cluster.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed italic">{cluster.summary}</p>
                  </div>

                  {/* Urgency Score Circle */}
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <div className="text-right">
                      <span className="block text-[9px] font-semibold text-slate-400 uppercase">Urgency Score</span>
                      <span className="text-xs font-mono font-bold text-indigo-600">{cluster.urgencyScore}%</span>
                    </div>
                    {cluster.urgencyScore >= 75 ? (
                      <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                    ) : (
                      <Users className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {/* Left block - Wealth Multiplication */}
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 mb-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Optimistic Wealth Multiplier</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {cluster.wealthMultiplicationFactor}
                    </p>
                  </div>

                  {/* Right block - Status & Action */}
                  <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-150 pt-4 md:pt-0 md:pl-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Consolidated Volume</span>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Est. {cluster.householdCount}+ Households Impacted</span>
                      </span>
                    </div>

                    <div className="mt-4">
                      {hasBriefing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectBriefing(hasBriefing)}
                            className="flex-1 py-2 px-3 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded-lg border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span>View Ready MP Briefing</span>
                          </button>
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onGenerateBriefing({
                            category: cluster.category,
                            constituency: cluster.constituency,
                            state: cluster.state,
                            issueIds: cluster.issueIds
                          })}
                          disabled={isGenerating}
                          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <>
                              <Loader className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Drafting MP Briefing with Gemini...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                              <span>Suggest Opinion & Plan to MP</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
