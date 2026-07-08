import React, { useState } from 'react';
import { IssueCategory, LocationInfo } from '../types';
import { AlertCircle, Plus, Send, Landmark, HelpCircle, Eye } from 'lucide-react';

interface IssueFormProps {
  onSubmit: (issueData: {
    category: IssueCategory;
    title: string;
    description: string;
    location: LocationInfo;
    reportedBy: string;
    impactScale: number;
  }) => void;
  isSubmitting: boolean;
}

const CONSTITUENCIES_DATA = [
  { constituency: "Varanasi", state: "Uttar Pradesh", defaultLocality: "Sigra Ward" },
  { constituency: "Chennai South", state: "Tamil Nadu", defaultLocality: "Thiruvanmiyur" },
  { constituency: "Pune", state: "Maharashtra", defaultLocality: "Dhayari Zone" },
  { constituency: "Asansol", state: "West Bengal", defaultLocality: "Raniganj Colony" },
  { constituency: "Bengaluru Central", state: "Karnataka", defaultLocality: "Bellandur Ring Road" },
  { constituency: "Patna Sahib", state: "Bihar", defaultLocality: "Sabzibagh Bazaar" }
];

export default function IssueForm({ onSubmit, isSubmitting }: IssueFormProps) {
  const [category, setCategory] = useState<IssueCategory>('sanitation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [constituencyIndex, setConstituencyIndex] = useState(0);
  const [customConstituency, setCustomConstituency] = useState('');
  const [customState, setCustomState] = useState('');
  const [useCustomLoc, setUseCustomLoc] = useState(false);
  const [locality, setLocality] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [impactScale, setImpactScale] = useState(3);
  const [error, setError] = useState('');

  const handleConstituencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setUseCustomLoc(true);
    } else {
      setUseCustomLoc(false);
      setConstituencyIndex(Number(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !reportedBy.trim()) {
      setError("Please fill in all required fields (Title, Description, and Your Name).");
      return;
    }
    if (title.length < 5) {
      setError("Title should be descriptive (at least 5 characters).");
      return;
    }
    if (description.length < 20) {
      setError("Please provide a detailed description (at least 20 characters) so the Gemini Need Detector can analyze it effectively.");
      return;
    }

    setError('');

    let finalConstituency = '';
    let finalState = '';
    let finalLocality = locality.trim();

    if (useCustomLoc) {
      if (!customConstituency.trim() || !customState.trim()) {
        setError("Please enter your custom Constituency and State.");
        return;
      }
      finalConstituency = customConstituency.trim();
      finalState = customState.trim();
      if (!finalLocality) finalLocality = "Main Ward";
    } else {
      const selected = CONSTITUENCIES_DATA[constituencyIndex];
      finalConstituency = selected.constituency;
      finalState = selected.state;
      if (!finalLocality) finalLocality = selected.defaultLocality;
    }

    onSubmit({
      category,
      title: title.trim(),
      description: description.trim(),
      location: {
        locality: finalLocality,
        constituency: finalConstituency,
        state: finalState
      },
      reportedBy: reportedBy.trim(),
      impactScale
    });

    // Reset Form fields that make sense to reset
    setTitle('');
    setDescription('');
    setLocality('');
  };

  return (
    <div id="issue-form-container" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Visual Accent Lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-300 to-emerald-500" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h2 id="form-heading" className="text-lg font-bold text-indigo-900 tracking-tight">Report a Community Need</h2>
          <p className="text-xs text-slate-500 font-medium">Your report is automatically analyzed for recurring collective patterns.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Select Issue Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(['electricity', 'garbage', 'sanitation', 'road_accidents', 'infrastructure'] as IssueCategory[]).map((cat) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 capitalize ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Issue Title (Short & Clear)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hazardous blind curve near main school entrance"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Reported By (Your Name / Association)</label>
            <input
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="e.g. Anand Nagar Resident Welfare Association"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Constituency & State</label>
            <select
              onChange={handleConstituencyChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {CONSTITUENCIES_DATA.map((c, idx) => (
                <option key={idx} value={idx}>
                  {c.constituency} ({c.state})
                </option>
              ))}
              <option value="custom">Other / Custom Constituency...</option>
            </select>
          </div>

          {useCustomLoc ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Custom Constituency</label>
                <input
                  type="text"
                  value={customConstituency}
                  onChange={(e) => setCustomConstituency(e.target.value)}
                  placeholder="e.g. Lucknow West"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Custom State</label>
                <input
                  type="text"
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Locality / Ward Name</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder={`e.g. ${CONSTITUENCIES_DATA[constituencyIndex].defaultLocality} or local lane`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          )}
        </div>

        {useCustomLoc && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Locality / Ward Name</label>
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Sector-4 Block C"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Impact Scale (Collective Breadth)</label>
            <span className="text-xs text-indigo-600 font-mono font-bold">
              {impactScale === 1 && "Single Household"}
              {impactScale === 2 && "A Few Neighborhood Houses"}
              {impactScale === 3 && "Entire Street / Apartment Complex"}
              {impactScale === 4 && "Whole Block / Local Market"}
              {impactScale === 5 && "Multiple Wards / Entire Constituency Zone"}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={impactScale}
            onChange={(e) => setImpactScale(Number(e.target.value))}
            className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg cursor-pointer appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-400 px-1 mt-1 font-mono">
            <span>Household</span>
            <span>Street</span>
            <span>Constituency Ward</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Describe the Problem & Daily Collective Impact</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Please detail: How long has this occurred? How does it disrupt residents' collective safety, health, or small businesses? (e.g., 'Due to 4-hour evening blackouts, 40 home weavers lose daily wages and 100 students can't do homework.')"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Optimistic Sync & AI Need Detector Active...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Issue to Community & MP Dashboard</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
