import React, { useState } from 'react';
import { Employee } from '@/lib/types';
import { X, Users, Search, Plus, Phone, MapPin, Target, Shield, Pencil, Check, RotateCcw } from 'lucide-react';

interface EmployeeDirectoryModalProps {
  employees: Employee[];
  onClose: () => void;
  onAddEmployee: (emp: Partial<Employee>) => void;
  onUpdateEmployee?: (id: string, updates: Partial<Employee>) => void;
}

export const EmployeeDirectoryModal: React.FC<EmployeeDirectoryModalProps> = ({
  employees,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
}) => {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [isAdding, setIsAdding] = useState(false);

  // New Officer Form state
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDistrict, setNewDistrict] = useState('Betul');
  const [newTerritory, setNewTerritory] = useState('Multai');
  const [newDesignation, setNewDesignation] = useState('Field Officer');
  const [newTarget, setNewTarget] = useState(10);

  // Edit Officer Form state
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editTerritory, setEditTerritory] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editTarget, setEditTarget] = useState(10);
  const [editIsActive, setEditIsActive] = useState(true);

  const districts = ['ALL', ...Array.from(new Set(employees.map((e) => e.district)))];

  const filtered = employees.filter((e) => {
    const matchesDist = districtFilter === 'ALL' || e.district === districtFilter;
    const matchesSearch =
      search === '' ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.empId.toLowerCase().includes(search.toLowerCase()) ||
      e.mobileNumber.includes(search) ||
      e.territory.toLowerCase().includes(search.toLowerCase());
    return matchesDist && matchesSearch;
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newMobile) return;
    onAddEmployee({
      name: newName,
      mobileNumber: newMobile,
      district: newDistrict,
      territory: newTerritory,
      designation: newDesignation,
      dailyVisitTarget: Number(newTarget),
    });
    setIsAdding(false);
    setNewName('');
    setNewMobile('');
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEditName(emp.name);
    setEditEmpId(emp.empId);
    setEditMobile(emp.mobileNumber);
    setEditDistrict(emp.district);
    setEditTerritory(emp.territory);
    setEditDesignation(emp.designation);
    setEditTarget(emp.dailyVisitTarget);
    setEditIsActive(emp.isActive !== false);
  };

  const handleSaveEdit = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editMobile) return;
    if (onUpdateEmployee) {
      onUpdateEmployee(id, {
        name: editName,
        empId: editEmpId,
        mobileNumber: editMobile,
        district: editDistrict,
        territory: editTerritory,
        designation: editDesignation,
        dailyVisitTarget: Number(editTarget),
        isActive: editIsActive,
      });
    }
    setEditingEmpId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Employee Master Database ({employees.length} Officers)</h2>
              <p className="text-xs text-slate-500">Automated WhatsApp recognition database with Territory & Targets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'Cancel' : 'Add Field Officer'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Form if active */}
        {isAdding && (
          <form onSubmit={handleSubmitNew} className="p-4 bg-emerald-50/50 border-b border-emerald-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">WhatsApp Mobile No.</label>
              <input
                type="text"
                required
                placeholder="e.g. 9826012345"
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">District</label>
              <input
                type="text"
                required
                placeholder="e.g. Betul"
                value={newDistrict}
                onChange={(e) => setNewDistrict(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Territory / Area</label>
              <input
                type="text"
                required
                placeholder="e.g. Multai Zone-1"
                value={newTerritory}
                onChange={(e) => setNewTerritory(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Designation</label>
              <input
                type="text"
                placeholder="Field Officer"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Daily Target (Visits)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold shadow-sm"
              >
                Save Officer to Database
              </button>
            </div>
          </form>
        )}

        {/* Filter Toolbar */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, phone, or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Districts' : d}
              </option>
            ))}
          </select>
        </div>

        {/* Officers Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1">
          {filtered.map((emp) => {
            const isEditing = editingEmpId === emp.id;

            if (isEditing) {
              return (
                <form
                  key={emp.id}
                  onSubmit={(e) => handleSaveEdit(emp.id, e)}
                  className="p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 text-xs space-y-2 col-span-1 sm:col-span-2 md:col-span-1 shadow-md"
                >
                  <div className="flex items-center justify-between font-bold text-emerald-800">
                    <span>Edit Officer</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">
                      {emp.id}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block">Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">Emp ID</label>
                      <input
                        type="text"
                        value={editEmpId}
                        onChange={(e) => setEditEmpId(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">Mobile No.</label>
                      <input
                        type="text"
                        required
                        value={editMobile}
                        onChange={(e) => setEditMobile(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">District</label>
                      <input
                        type="text"
                        required
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">Territory</label>
                      <input
                        type="text"
                        required
                        value={editTerritory}
                        onChange={(e) => setEditTerritory(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">Designation</label>
                      <input
                        type="text"
                        value={editDesignation}
                        onChange={(e) => setEditDesignation(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">Daily Quota</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editTarget}
                        onChange={(e) => setEditTarget(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Active Officer
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingEmpId(null)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={emp.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs group relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                    <p className="text-[11px] text-emerald-700 font-semibold">{emp.designation}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(emp)}
                      title="Edit Officer Details"
                      className="p-1 rounded bg-slate-200/80 hover:bg-emerald-600 hover:text-white text-slate-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                      {emp.empId}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1 text-slate-600 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>+91 {emp.mobileNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{emp.district} · {emp.territory}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <Target className="w-3 h-3 text-amber-500" />
                    <span>Daily Quota: {emp.dailyVisitTarget} Visits / Day</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {employees.length} officers</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
