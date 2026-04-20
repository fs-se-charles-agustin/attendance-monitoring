import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/auth/AuthContext";
import { attendanceService } from "@/services/attendance/attendance.service";
import { format } from "date-fns";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DEFAULT_REQUIRED_HOURS = parseFloat(import.meta.env.VITE_REQUIRED_OJT_HOURS || "500");

export const StudentReportsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      attendanceService.getAttendanceSummary(user.id)
        .then((data) => setRecords(data.records || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  const totalHours = records.reduce((acc: number, r: any) => acc + (r.hoursWorked || 0), 0);
  const requiredHours = user?.requiredOjtHours || DEFAULT_REQUIRED_HOURS;

  const handleExportPDF = async () => {
    const el = reportRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, w, Math.min(h, 297));
    pdf.save(`DTR_${user?.firstName}_${user?.lastName}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Reports</h1>
          <p className="text-slate-600 text-sm mt-1">Daily Time Record (DTR)</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* Printable DTR */}
      <div ref={reportRef} className="bg-white rounded-2xl p-8 text-gray-900">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider">Daily Time Record</h2>
          <p className="text-sm text-gray-500 mt-1">On-the-Job Training Attendance</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div><span className="font-semibold">Name: </span>{user?.firstName} {user?.lastName}</div>
          <div><span className="font-semibold">Email: </span>{user?.email}</div>
          <div><span className="font-semibold">Total Hours: </span>{totalHours.toFixed(2)}h</div>
          <div><span className="font-semibold">Required: </span>{requiredHours}h ({((totalHours / requiredHours) * 100).toFixed(1)}%)</div>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Time In</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Time Out</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Hours</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: any) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">{format(new Date(r.date + "T00:00:00"), "MMM d, yyyy")}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{r.timeIn ? format(new Date(r.timeIn), "h:mm a") : "—"}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{r.timeOut ? format(new Date(r.timeOut), "h:mm a") : "—"}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{r.hoursWorked?.toFixed(2) || "—"}</td>
                <td className="border border-gray-300 px-3 py-2 text-center capitalize">{r.status}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right">Total Hours Worked:</td>
              <td className="border border-gray-300 px-3 py-2 text-center">{totalHours.toFixed(2)}</td>
              <td className="border border-gray-300 px-3 py-2" />
            </tr>
          </tbody>
        </table>
        <div className="mt-8 flex justify-between text-sm">
          <div className="text-center">
            <div className="border-b border-gray-400 w-40 mb-1" />
            <p className="text-gray-500">Student's Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 w-40 mb-1" />
            <p className="text-gray-500">Supervisor's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
