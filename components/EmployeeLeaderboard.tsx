'use client';

import React, { useState } from 'react';
import { Employee, Visit } from '@/lib/types';
import { Trophy, Target, Route, Award, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { calculateTotalRouteKm } from '@/lib/geo';

interface EmployeeLeaderboardProps {
  employees: Employee[];
  visits: Visit[];
  selectedEmployeeId?: string;
  onSelectEmployee: (empId: string) => void;
}

export const EmployeeLeaderboard: React.FC<EmployeeLeaderboardProps> = ({
  employees,
  visits,
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const districts = ['ALL', ...Array.from(new Set(employees.map((e) => e.district)))];

  // Calculate per-employee stats
  const officerStats = employees.map((emp) => {
    const empVisits = visits.filter((v) => v.employeeId === emp.id);
    const count = empVisits.length;
    const target = emp.dailyVisitTarget;
    const pct = Math.min(100, Math.round((count / target) * 100));

    // Sort chronological for route km
    const sorted = [...empVisits].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const km = calculateTotalRouteKm(sorted);
    const repeatCount = empVisits.filter((v) => v.isRepeatLocation).length;
    const uniqueCount = count - repeatCount;

    return {
      ...emp,
      todayVisits: count,
      targetPercent: pct,
      travelKm: km,
      repeatCount,
      uniqueCount,
      lastVisitTime: sorted.length > 0 ? sorted[sorted.length - 1].timestamp : null,
    };
  });

  // Filter
  const filtered = officerStats.filter((emp) => {
    const matchesDist = districtFilter === 'ALL' || emp.district === districtFilter;
    const matchesSearch =
      search === '' ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.empId.toLowerCase().includes(search.toLowerCase()) ||
      emp.territory.toLowerCase().includes(search.toLowerCase());
    return matchesDist && matchesSearch;
  });

  // Sort by visits descending
  const sorted = [...filtered].sort((a, b) => b.todayVisits - a.todayVisits);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full max-h-[700px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Field Officers Leaderboard</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              60 Officers
            </span>
          </h2>
          <p className="text-xs text-slate-500">Track Daily Target, Route KM, and Visit Performance</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search officer name / ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
            />
          </div>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Districts' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3 font-semibold w-10">#</th>
              <th className="py-2.5 px-3 font-semibold">Officer Name & Territory</th>
              <th className="py-2.5 px-3 font-semibold text-center">Visits / Target</th>
              <th className="py-2.5 px-3 font-semibold text-center">Progress</th>
              <th className="py-2.5 px-3 font-semibold text-center">Est. Travel</th>
              <th className="py-2.5 px-3 font-semibold text-center">Locations</th>
              <th className="py-2.5 px-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((emp, index) => {
              const isSelected = selectedEmployeeId === emp.id;
              const hasCompleted = emp.todayVisits >= emp.dailyVisitTarget;

              return (
                <tr
                  key={emp.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-emerald-50/60 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-slate-400">
                    {index === 0 && emp.todayVisits > 0 ? (
                      <span className="text-amber-500 font-extrabold flex items-center gap-0.5">🥇 1</span>
                    ) : index === 1 && emp.todayVisits > 0 ? (
                      <span className="text-slate-400 font-bold flex items-center gap-0.5">🥈 2</span>
                    ) : index === 2 && emp.todayVisits > 0 ? (
                      <span className="text-amber-700 font-bold flex items-center gap-0.5">🥉 3</span>
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-mono text-slate-400">{emp.empId}</span>
                      <span>•</span>
                      <span>{emp.district} ({emp.territory})</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-slate-900 text-sm">{emp.todayVisits}</span>
                    <span className="text-slate-400"> / {emp.dailyVisitTarget}</span>
                  </td>
                  <td className="py-3 px-3 text-center min-w-[120px]">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            hasCompleted ? 'bg-emerald-500' : emp.targetPercent > 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${emp.targetPercent}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-slate-700">{emp.targetPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">
                    {emp.travelKm > 0 ? `${emp.travelKm} KM` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-slate-700">{emp.uniqueCount} Unique</span>
                    {emp.repeatCount > 0 && (
                      <span className="text-amber-700 ml-1">({emp.repeatCount} Rep)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectEmployee(isSelected ? '' : emp.id)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Route Active' : 'View Route'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
