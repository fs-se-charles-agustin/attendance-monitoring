import { useState, useEffect } from "react";
import { attendanceService } from "@/services/attendance/attendance.service";
import { companyService } from "@/services/company/company.service";
import { format } from "date-fns";
import { Users, Search, TrendingUp, Building2, CheckCircle2 } from "lucide-react";

const DEFAULT_REQUIRED_HOURS = parseFloat(import.meta.env.VITE_REQUIRED_OJT_HOURS || "500");

export const InternsPage = () => {
  const [interns, setInterns] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [assignModal, setAssignModal] = useState<{ intern: any; open: boolean } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([attendanceService.getAllInterns(), companyService.getCompanies()])
      .then(([i, c]) => { setInterns(i); setCompanies(c); })
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!assignModal || !selectedCompany) return;
    setAssigning(true);
    try {
      await companyService.assignIntern(assignModal.intern._id, selectedCompany);
      const updated = await attendanceService.getAllInterns();
      setInterns(updated);
      setAssignModal(null);
    } catch {}
    finally { setAssigning(false); }
  };

  const filtered = interns.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${i.firstName} ${i.lastName} ${i.email}`.toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "assigned" ? i.companyId : !i.companyId);
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interns</h1>
        <p className="text-slate-600 text-sm mt-1">Manage all registered OJT students</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-colors" />
        </div>
        <div className="flex gap-2">
          {["all", "assigned", "unassigned"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 text-xs font-medium rounded-xl capitalize transition-all ${filter === f ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center"><Users size={28} className="text-slate-600 mx-auto mb-2" /><p className="text-slate-500 text-sm">No interns found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Intern</th>
                  <th className="hidden md:table-cell px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="hidden lg:table-cell px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((intern) => {
                  const requiredHours = intern.requiredOjtHours || DEFAULT_REQUIRED_HOURS;
                  const progress = Math.min(((intern.totalHours || 0) / requiredHours) * 100, 100);
                  return (
                    <tr key={intern._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {intern.firstName?.[0]}{intern.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-slate-900 font-medium">{intern.firstName} {intern.lastName}</p>
                            <p className="text-slate-500 text-xs">{intern.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 text-sm">
                          <Building2 size={13} className="text-slate-500" />
                          {intern.companyId?.name || <span className="text-slate-600 italic">Unassigned</span>}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-slate-400 text-xs">{(intern.totalHours || 0).toFixed(1)}h</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {intern.isActive
                          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Active</span>
                          : intern.todayStatus !== "absent"
                            ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1"><CheckCircle2 size={11}/>Done</span>
                            : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">Not In</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => { setAssignModal({ intern, open: true }); setSelectedCompany(intern.companyId?._id || ""); }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 px-3 py-1.5 rounded-lg transition-all">
                          Assign
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign modal */}
      {assignModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-slate-900 font-semibold">Assign to Company</h2>
            <p className="text-slate-600 text-sm">{assignModal.intern.firstName} {assignModal.intern.lastName}</p>
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-500/60">
              <option value="">Select company...</option>
              {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedCompany || assigning} className="flex-1 py-2.5 text-sm text-white font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all">
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
