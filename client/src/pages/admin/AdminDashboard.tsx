import { useState, useEffect, useCallback } from "react";
import { attendanceService } from "@/services/attendance/attendance.service";
import { getSocket } from "@/services/socket/socket.service";
import { format } from "date-fns";
import { Users, CheckCircle2, Clock, AlertCircle, TrendingUp, RefreshCw } from "lucide-react";

const DEFAULT_REQUIRED_HOURS = parseFloat(import.meta.env.VITE_REQUIRED_OJT_HOURS || "500");

const StatusBadge = ({ status, isActive }: { status: string; isActive: boolean }) => {
  if (isActive) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Present</span>;
  if (status === "absent") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Not In</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400"><CheckCircle2 size={11} />Done</span>;
};

export const AdminDashboard = () => {
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchInterns = useCallback(async () => {
    try { const data = await attendanceService.getAllInterns(); setInterns(data); setLastUpdated(new Date()); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchInterns();
    const socket = getSocket();
    socket.on("attendanceUpdated", fetchInterns);
    return () => { socket.off("attendanceUpdated", fetchInterns); };
  }, [fetchInterns]);

  const present = interns.filter((i) => i.isActive).length;
  const done = interns.filter((i) => i.todayStatus !== "absent" && !i.isActive).length;
  const absent = interns.filter((i) => i.todayStatus === "absent").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Real-time intern attendance for {format(new Date(), "MMMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-slate-500 text-xs">Updated {format(lastUpdated, "h:mm:ss a")}</p>
          <button onClick={fetchInterns} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Interns", value: interns.length, icon: Users, color: "bg-indigo-600" },
          { label: "Present Now", value: present, icon: CheckCircle2, color: "bg-emerald-600" },
          { label: "Timed Out", value: done, icon: Clock, color: "bg-blue-600" },
          { label: "Not Yet In", value: absent, icon: AlertCircle, color: "bg-red-500/80" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-200 transition-all duration-300">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">{label}</p>
              <p className="text-slate-900 text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live intern board */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-900">Live Attendance Board</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : interns.length === 0 ? (
          <div className="py-12 text-center"><Users size={28} className="text-slate-600 mx-auto mb-2" /><p className="text-slate-500 text-sm">No interns registered yet</p></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {interns.map((intern) => {
              const requiredHours = intern.requiredOjtHours || DEFAULT_REQUIRED_HOURS;
              return (
              <div key={intern._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {intern.firstName?.[0]}{intern.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-medium truncate">{intern.firstName} {intern.lastName}</p>
                  <p className="text-slate-500 text-xs truncate">{intern.companyId?.name || "No company assigned"}</p>
                </div>
                <div className="hidden sm:block text-right min-w-[80px]">
                  <p className="text-slate-400 text-xs">{intern.todayTimeIn ? format(new Date(intern.todayTimeIn), "h:mm a") : "—"}</p>
                  <p className="text-slate-500 text-xs">{intern.todayTimeOut ? `Out ${format(new Date(intern.todayTimeOut), "h:mm a")}` : ""}</p>
                </div>
                <div className="hidden md:block text-right min-w-[80px]">
                  <p className="text-slate-400 text-xs">{intern.totalHours?.toFixed(1)}h</p>
                  <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((intern.totalHours / requiredHours) * 100, 100)}%` }} />
                  </div>
                </div>
                <StatusBadge status={intern.todayStatus} isActive={intern.isActive} />
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
