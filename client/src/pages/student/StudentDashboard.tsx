import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth/AuthContext";
import { attendanceService } from "@/services/attendance/attendance.service";
import { getSocket } from "@/services/socket/socket.service";
import { Clock, TrendingUp, Calendar, CheckCircle2, AlertCircle, Timer, MapPin, Hand, ScanLine, PartyPopper } from "lucide-react";
import { format } from "date-fns";

const DEFAULT_REQUIRED_HOURS = parseFloat(import.meta.env.VITE_REQUIRED_OJT_HOURS || "500");

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-200 transition-all duration-300">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-slate-500 text-xs font-medium mb-0.5">{label}</p>
      <p className="text-slate-900 text-xl font-bold">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const StudentDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalHours = user?.totalHours || 0;
  const requiredHours = user?.requiredOjtHours || DEFAULT_REQUIRED_HOURS;
  const progress = Math.min((totalHours / requiredHours) * 100, 100);

  const fetchToday = useCallback(async () => {
    try {
      const records = await attendanceService.getTodayAttendance();
      setTodayRecord(records[0] || null);
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchToday();
    const socket = getSocket();
    socket.on("attendanceUpdated", () => { fetchToday(); refreshUser(); });
    return () => { socket.off("attendanceUpdated"); };
  }, [fetchToday, refreshUser]);

  const handleTimeOut = async () => {
    setActionLoading(true);
    setError(""); setSuccess("");
    try {
      const res = await attendanceService.timeOut();
      setSuccess(`Timed out! Hours worked today: ${res.hoursWorked.toFixed(2)}h`);
      await fetchToday();
      await refreshUser();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isTimedIn = todayRecord?.isActive === true;
  const isTimedOut = todayRecord && !todayRecord.isActive;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{user?.firstName}</span>{" "}
          <Hand size={18} className="inline text-amber-500" />
        </h1>
        <p className="text-slate-400 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          <CheckCircle2 size={18} className="flex-shrink-0" /> {success}
        </div>
      )}

      {/* Time-out CTA (only if timed in) */}
      {isTimedIn && (
        <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            <div>
              <p className="text-white font-semibold text-sm">You're currently clocked in</p>
              <p className="text-slate-400 text-xs">Started at {format(new Date(todayRecord.timeIn), "h:mm a")}</p>
            </div>
          </div>
          <button
            onClick={handleTimeOut}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 active:scale-95"
          >
            {actionLoading ? "Processing..." : "Time Out"}
          </button>
        </div>
      )}

      {/* Scan CTA (if not timed in) */}
      {!isTimedIn && !isTimedOut && !isLoading && (
        <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 bg-amber-400 rounded-full" />
            <div>
              <p className="text-white font-semibold text-sm">Not yet timed in today</p>
              <p className="text-slate-400 text-xs">Scan the QR code at your workplace to time in</p>
            </div>
          </div>
          <a
            href="/student/scan"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-95 text-center"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <ScanLine size={16} />
              Scan QR
            </span>
          </a>
        </div>
      )}

      {isTimedOut && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 font-semibold text-sm">Completed for today!</p>
            <p className="text-slate-400 text-xs">You worked {todayRecord.hoursWorked?.toFixed(2)}h today. Great job!</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Hours" value={`${totalHours.toFixed(1)}h`} sub={`of ${requiredHours}h required`} color="bg-indigo-600" />
        <StatCard icon={Timer} label="Remaining" value={`${Math.max(requiredHours - totalHours, 0).toFixed(1)}h`} sub="to complete OJT" color="bg-violet-600" />
        <StatCard icon={Calendar} label="Today" value={isTimedIn ? "Active" : isTimedOut ? "Done" : "Absent"} sub={todayRecord ? format(new Date(todayRecord.timeIn), "h:mm a") : "Not yet in"} color={isTimedIn ? "bg-emerald-600" : isTimedOut ? "bg-blue-600" : "bg-slate-600"} />
        <StatCard icon={Clock} label="Today Hours" value={isTimedOut ? `${todayRecord.hoursWorked?.toFixed(2)}h` : isTimedIn ? "In progress" : "—"} sub={isTimedIn ? `Since ${format(new Date(todayRecord.timeIn), "h:mm a")}` : ""} color="bg-amber-600" />
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-slate-900">OJT Progress</p>
          <span className="text-xs text-slate-400">{totalHours.toFixed(1)} / {requiredHours}h ({progress.toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2">
          {progress >= 100 ? (
            <span className="inline-flex items-center gap-1.5">
              <PartyPopper size={14} className="text-indigo-500" />
              OJT Complete! Congratulations!
            </span>
          ) : (
            `${(requiredHours - totalHours).toFixed(1)} hours remaining`
          )}
        </p>
      </div>

      {/* Today's info */}
      {todayRecord && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Today's Attendance</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Time In</p>
              <p className="text-slate-900 font-medium">{format(new Date(todayRecord.timeIn), "h:mm a")}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Time Out</p>
              <p className="text-slate-900 font-medium">{todayRecord.timeOut ? format(new Date(todayRecord.timeOut), "h:mm a") : "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                todayRecord.status === "present" ? "bg-emerald-500/20 text-emerald-400" :
                todayRecord.status === "late" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
              }`}>{todayRecord.status}</span>
            </div>
            {todayRecord.location && (
              <div>
                <p className="text-slate-400 text-xs mb-1">Location</p>
                <p className="text-slate-300 text-xs flex items-center gap-1">
                  <MapPin size={12} />{todayRecord.location.lat?.toFixed(4)}, {todayRecord.location.lng?.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
