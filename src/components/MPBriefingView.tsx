import React, { useState } from 'react';
import { MPBriefing, ActionStep } from '../types';
import { 
  FileText, Send, Star, Users, CheckCircle, 
  MapPin, Clock, ShieldCheck, Mail, ArrowLeft, AlertCircle 
} from 'lucide-react';

interface MPBriefingViewProps {
  briefing: MPBriefing;
  onBack: () => void;
  onUpdateStatus: (id: string, status: MPBriefing['status']) => void;
}

export default function MPBriefingView({ briefing, onBack, onUpdateStatus }: MPBriefingViewProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSent, setIsSent] = useState(briefing.status !== 'draft');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const handleSendToMP = () => {
    setIsSent(true);
    onUpdateStatus(briefing.id, 'sent');
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setFeedbackError("Please select a priority rating before submitting feedback.");
      return;
    }
    setFeedbackError('');
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setComment('');
      setRating(0);
    }, 4000);
  };

  // Basic line-by-line helper to render Markdown beautifully on standard elements
  const renderMarkdownText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="text-sm font-bold text-indigo-900 uppercase tracking-wide mt-4 mb-2">{trimmed.replace('###', '')}</h4>;
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={idx} className="font-bold text-slate-850 text-xs mt-1">{trimmed.replace(/\*\*/g, '')}</p>;
      }
      if (trimmed.startsWith('-')) {
        return (
          <li key={idx} className="text-xs text-slate-600 ml-4 list-disc list-outside leading-relaxed mt-1">
            {trimmed.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '$1')}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mt-1.5">{trimmed.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      
      {/* Back Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <button 
          onClick={onBack}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Need Detector</span>
        </button>

        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Official Briefing Ref: {briefing.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Official Administrative Letter */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-inner relative overflow-y-auto max-h-[500px] scrollbar-thin">
            
            {/* Indian Emblem / Header Emblem Simulator */}
            <div className="text-center mb-6 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold text-xs mb-1.5">
                स
              </div>
              <span className="block text-[8px] tracking-[0.2em] uppercase text-slate-450 font-bold font-mono">Satyameva Jayate</span>
              <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase mt-1">LOK SABHA CITIZEN CONSULTATION</h3>
              <span className="block text-[9px] text-slate-400 mt-0.5">Constituency Service Office • {briefing.constituency}</span>
            </div>

            {/* Date Indicator */}
            <div className="text-right text-[10px] text-slate-400 font-mono mb-4">
              Date: {briefing.date}
            </div>

            {/* Rendered Letter Body */}
            <div className="space-y-1 font-sans">
              {renderMarkdownText(briefing.formalLetter)}
            </div>

            {/* Administrative Signature Block */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-450 font-mono">
              <div>
                <span>Digital Seal ID: LKS-B-{briefing.id.split('-')[1]}</span>
                <span className="block text-emerald-600 font-bold">✔ Authenticated by Community</span>
              </div>
              <div className="text-right italic text-slate-500">
                <span>Joint Resident Associations</span>
                <span className="block not-italic text-slate-400">Team Citizen Leader</span>
              </div>
            </div>
          </div>

          {/* Action Row for Mailing */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h5 className="text-xs font-bold text-slate-800">Constituency Submission Status</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isSent 
                  ? `Successfully cataloged and queued for transmission to ${briefing.mpName}.`
                  : `Draft is ready. Click below to submit this collective briefing to the representative's local portal.`
                }
              </p>
            </div>

            {isSent ? (
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-inner">
                <CheckCircle className="w-4 h-4" />
                <span>Submitted to MP Office</span>
              </div>
            ) : (
              <button
                onClick={handleSendToMP}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Submit to MP</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Prioritized Actions & Community Contribution Feed */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Action Plan */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Prioritized Administrative Actions</span>
            </h4>

            <div className="space-y-3">
              {briefing.actionPlan.map((step, sIdx) => (
                <div key={sIdx} className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${step.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {step.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {step.timeline}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 leading-relaxed">{step.step}</p>
                  
                  {/* Citizen Team Role */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex gap-2 items-start text-[10px] text-slate-500">
                    <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-indigo-700">Citizen Partner Duty: </strong>
                      {step.citizenRole}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Form for MPs */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl relative">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 mb-1 flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              <span>Community Feedback to MP</span>
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
              Add your citizen opinion. Tell {briefing.mpName} how urgently your block needs this collective asset.
            </p>

            {feedbackSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 animate-bounce" />
                <h5 className="text-xs font-bold text-emerald-800">Opinion Registered Successfully!</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">Your voice has been added to the aggregated constituency priority report sent to Smt/Shri MP.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                {feedbackError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{feedbackError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Set Urgency Level</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isHighlighted = hoverRating ? starValue <= hoverRating : starValue <= rating;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-slate-400 hover:scale-110 transition cursor-pointer"
                        >
                          <Star 
                            className={`w-5 h-5 ${isHighlighted ? 'text-amber-500 fill-amber-500' : 'text-slate-300 fill-transparent'}`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Opinion / Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="e.g. As an active volunteer, I pledge my support and 4 hours of weekly labor to coordinate coverage for the Sigra walkways."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-white" />
                  <span>Register Opinion</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
