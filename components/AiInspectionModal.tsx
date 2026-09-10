'use client';

import React from 'react';
import { Visit } from '@/lib/types';
import { X, Sparkles, Check, AlertTriangle, ShieldCheck, MapPin, User, Calendar } from 'lucide-react';

interface AiInspectionModalProps {
  visit: Visit | null;
  onClose: () => void;
}

export const AiInspectionModal: React.FC<AiInspectionModalProps> = ({ visit, onClose }) => {
  if (!visit) return null;

  const { aiAnalysis } = visit;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">AI Photo & Visit Quality Inspector</h2>
              <p className="text-xs text-slate-500">Automated Computer Vision & Fraud Prevention Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Main Photo & Quality Score Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative aspect-video sm:aspect-square">
              <img
                src={visit.photoUrl}
                alt="Field visit photo"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[11px] text-white">
                📍 {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
              </div>
            </div>

            {/* Score Breakdown Card */}
            <div className="flex flex-col justify-between space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-500">Overall AI Quality Score</span>
                  <span className={`text-xl font-extrabold ${aiAnalysis.qualityScore > 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {aiAnalysis.qualityScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${aiAnalysis.qualityScore > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${aiAnalysis.qualityScore}%` }}
                  ></div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Image Clarity / Blur</span>
                    {aiAnalysis.isBlur ? (
                      <span className="font-semibold text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Blurry
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Sharp & Clear
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Field / Crop Canopy</span>
                    <span className="font-semibold text-slate-800">
                      {aiAnalysis.fieldVisible ? '✅ Detected' : '❌ Not in view'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Person / Farmer / Dealer</span>
                    <span className="font-semibold text-slate-800">
                      {aiAnalysis.personVisible ? '✅ Detected' : '❌ Absent'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">InnoVeg Branding / Banner</span>
                    <span className="font-semibold text-slate-800">
                      {aiAnalysis.brandingVisible ? '✅ Verified' : '⚪ Not prominent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {aiAnalysis.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Explanation Summary */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              AI Verification Insight:
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              {aiAnalysis.summaryHindi}
            </p>
            <p className="text-[11px] text-emerald-700 italic">
              {aiAnalysis.summaryEnglish}
            </p>
          </div>

          {/* Visit Context Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100">
            <div>
              <p className="text-slate-400">Officer</p>
              <p className="font-bold text-slate-800">{visit.employeeName}</p>
            </div>
            <div>
              <p className="text-slate-400">Visit Type</p>
              <p className="font-bold text-slate-800">{visit.visitType}</p>
            </div>
            <div>
              <p className="text-slate-400">Location</p>
              <p className="font-bold text-slate-800">{visit.village}, {visit.district}</p>
            </div>
            <div>
              <p className="text-slate-400">Time</p>
              <p className="font-bold text-slate-800">
                {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
