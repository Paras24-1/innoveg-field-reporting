'use client';

import React from 'react';
import { Users, MapPin, Target, Route, AlertTriangle, Sparkles } from 'lucide-react';
import { DailySummary } from '@/lib/types';

interface StatsOverviewProps {
  summary: DailySummary | null;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    {
      label: "Today's Total Visits",
      value: summary.totalVisits,
      subtitle: `${summary.uniqueLocations} Unique · ${summary.repeatLocations} Repeat`,
      icon: MapPin,
      color: "emerald",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      label: "Active Field Officers",
      value: `${summary.activeEmployees} / ${summary.totalEmployees}`,
      subtitle: `${Math.round((summary.activeEmployees / summary.totalEmployees) * 100)}% active team in field`,
      icon: Users,
      color: "blue",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      label: "Target Achievement",
      value: `${summary.overallTargetAchievementPercent}%`,
      subtitle: "Against daily assigned targets",
      icon: Target,
      color: "amber",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
    },
    {
      label: "Est. Field Travel (KM)",
      value: `${summary.totalEstimatedKm} km`,
      subtitle: "Calculated via GPS visit routes",
      icon: Route,
      color: "indigo",
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg} ${card.borderColor} border`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
