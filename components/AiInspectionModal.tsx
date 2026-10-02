'use client';

import React from 'react';
import { Visit } from '@/lib/types';
import { X, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { formatPhotoUrl, DEFAULT_FIELD_PHOTO } from '@/lib/geo';

interface AiInspectionModalProps {
  visit: Visit | null;
  onClose: () => void;
}

export const AiInspectionModal: React.FC<AiInspectionModalProps> = ({ visit, onClose }) => {
  if (!visit) return null;

  const aiAnalysis = visit.aiAnalysis || {
    qualityScore: 80,
    isBlur: false,
    fieldVisible: true,
    personVisible: true,
    brandingVisible: false,
    visitTypeMatch: true,
    summaryHindi: '',
    summaryEnglish: '',
    tags: []
  };

  const qualityScore = Number(aiAnalysis.qualityScore || 80);
  const isBlur = Boolean(aiAnalysis.isBlur);
  const tags = Array.isArray(aiAnalysis.tags) ? aiAnalysis.tags : [];
  const lat = typeof visit.latitude === 'number' && !isNaN(visit.latitude) ? visit.latitude.toFixed(4) : '0.0000';
  const lng = typeof visit.longitude === 'number' && !isNaN(visit.longitude) ? visit.longitude.toFixed(4) : '0.0000';
  const photoSrc = formatPhotoUrl(visit.photoUrl);

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
                src={photoSrc}
                alt="Field visit photo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_FIELD_PHOTO;
                }}
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[11px] text-white">
                📍 {lat}, {lng}
              </div>
            </div>

            {/* Score Breakdown Card */}
            <div className="flex flex-col justify-between space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-500">Overall AI Quality Score</span>
                  <span className={`text-xl font-extrabold ${qualityScore > 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {qualityScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${qualityScore > 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, qualityScore))}%` }}
                  ></div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Image Clarity / Blur</span>
                    {isBlur ? (
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
                      {aiAnalysis.brandingVisible ? '✅ Detected' : '⚪ Optional'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Summaries */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {aiAnalysis.summaryEnglish && (
              <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-950">
                <span className="font-bold text-indigo-900 block mb-0.5">🤖 AI Verification Summary (English):</span>
                {aiAnalysis.summaryEnglish}
              </div>
            )}
            {aiAnalysis.summaryHindi && (
              <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-950">
                <span className="font-bold text-emerald-900 block mb-0.5">🇮🇳 AI Verification Summary (Hindi):</span>
                {aiAnalysis.summaryHindi}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
