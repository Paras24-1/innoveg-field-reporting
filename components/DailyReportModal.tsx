'use client';

import React, { useState } from 'react';
import { DailySummary } from '@/lib/types';
import { X, Copy, Check, FileText, Send, Download, Sparkles, TrendingUp } from 'lucide-react';

interface DailyReportModalProps {
  summary: DailySummary | null;
  formattedWhatsAppText: string;
  onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  summary,
  formattedWhatsAppText,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedWhatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', summary.date],
      ['Total Employees', summary.totalEmployees],
      ['Active Officers Today', summary.activeEmployees],
      ['Total Visits', summary.totalVisits],
      ['Unique Locations', summary.uniqueLocations],
      ['Repeat Locations', summary.repeatLocations],
      ['Total Field Travel KM', summary.totalEstimatedKm],
      ['Target Achievement %', summary.overallTargetAchievementPercent],
      [],
      ['Visit Types Breakdown'],
      ...Object.entries(summary.visitsByType),
      [],
      ['Top Performers'],
      ...summary.topPerformers.map((p) => [p.employeeName, p.district, p.visitsCount, `${p.travelKm} KM`]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `innoveg_field_report_${summary.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Daily Automatic Management Report (7:00 PM)</h2>
              <p className="text-xs text-emerald-200">Date: {summary.date} · InnoVeg Central Field Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Executive KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Total Visits</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{summary.totalVisits}</p>
              <p className="text-[11px] text-slate-500">{summary.uniqueLocations} Unique · {summary.repeatLocations} Repeat</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Active Officers</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {summary.activeEmployees} <span className="text-xs font-normal text-slate-500">/ {summary.totalEmployees}</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">
                {Math.round((summary.activeEmployees / summary.totalEmployees) * 100)}% active team
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Target Achievement</p>
              <p className="text-xl font-extrabold text-amber-600 mt-0.5">
                {summary.overallTargetAchievementPercent}%
              </p>
              <p className="text-[11px] text-slate-500">Against daily quota</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Field Route Travel</p>
              <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
                {summary.totalEstimatedKm} <span className="text-xs font-normal text-slate-500">KM</span>
              </p>
              <p className="text-[11px] text-slate-500">GPS Haversine sum</p>
            </div>
          </div>

          {/* Visit Type Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Visit Type Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(summary.visitsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-700 font-medium">{type}</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-100">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Officers */}
          {summary.topPerformers.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Top Performing Field Officers
              </h3>
              <div className="space-y-1.5">
                {summary.topPerformers.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700 w-4">#{idx + 1}</span>
                      <span className="font-bold text-slate-800">{p.employeeName}</span>
                      <span className="text-slate-500">({p.district})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-700">{p.visitsCount} visits</span>
                      <span className="text-emerald-700 font-bold">{p.targetAchievementPercent}%</span>
                      <span className="text-slate-500">{p.travelKm} KM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatted WhatsApp Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Broadcast Message Preview
              </h3>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy for WhatsApp'}
              </button>
            </div>
            <div className="bg-[#ECE5DD] p-4 rounded-xl border border-slate-300">
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-900 bg-white p-4 rounded-lg shadow-sm border border-slate-200 leading-relaxed max-h-60 overflow-y-auto">
                {formattedWhatsAppText}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard' : 'Copy Broadcast Text'}
          </button>
        </div>
      </div>
    </div>
  );
};
