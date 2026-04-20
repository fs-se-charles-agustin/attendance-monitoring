import { useState, useEffect, useRef } from "react";
import { attendanceService } from "@/services/attendance/attendance.service";
import { format } from "date-fns";
import { FileText, Download, Users, Search } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DEFAULT_REQUIRED_HOURS = parseFloat(import.meta.env.VITE_REQUIRED_OJT_HOURS || "500");

export const AdminReportsPage = () => {
  const [interns, setInterns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [search, setSearch] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    attendanceService.getAllInterns().then(setInterns).finally(() => setLoadingInterns(false));
  }, []);

  const handleSelectIntern = async (intern: any) => {
    setSelected(intern);
    setLoadingRecords(true);
    try {
      const data = await attendanceService.getAttendanceSummary(intern._id);
      setRecords(data.records || []);
    } catch {} finally { setLoadingRecords(false); }
  };

  const totalHours = records.reduce((acc: number, r: any) => acc + (r.hoursWorked || 0), 0);
  const selectedRequiredHours = selected?.requiredOjtHours || DEFAULT_REQUIRED_HOURS;

  const handleExportPDF = async () => {
    const el = reportRef.current;
    if (!el || !selected) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, w, Math.min(h, 297));
    pdf.save(`DTR_${selected.firstName}_${selected.lastName}.pdf`);
  };

  const filteredInterns = interns.filter((i) =>
    !search || `${i.firstName} ${i.lastName} ${i.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 text-sm mt-1">Generate DTR reports for each intern</p>
        </div>
        {selected && (
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25">
            <Download size={16} /> Export PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intern selector */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interns..." className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40" />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {loadingInterns ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredInterns.map((intern) => (
              <button key={intern._id} onClick={() => handleSelectIntern(intern)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selected?._id === intern._id ? "bg-indigo-600 border-indigo-500" : "bg-white border-slate-200 hover:border-indigo-200"} border`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {intern.firstName?.[0]}{intern.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${selected?._id === intern._id ? "text-white" : "text-slate-800"}`}>{intern.firstName} {intern.lastName}</p>
                  <p className={`text-xs truncate ${selected?._id === intern._id ? "text-indigo-200" : "text-slate-500"}`}>{(intern.totalHours || 0).toFixed(1)}h / {(intern.requiredOjtHours || DEFAULT_REQUIRED_HOURS)}h</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* DTR Report */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center">
              <Users size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Select an intern to view their DTR</p>
            </div>
          ) : loadingRecords ? (
            <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div ref={reportRef} className="bg-white rounded-2xl p-6 text-gray-900 shadow-xl">
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold uppercase tracking-wider">Daily Time Record</h2>
                <p className="text-sm text-gray-500">On-the-Job Training Attendance</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                <div><span className="font-semibold">Name: </span>{selected.firstName} {selected.lastName}</div>
                <div><span className="font-semibold">Email: </span>{selected.email}</div>
                <div><span className="font-semibold">Company: </span>{selected.companyId?.name || "—"}</div>
                <div><span className="font-semibold">Progress: </span>{totalHours.toFixed(2)}h / {selectedRequiredHours}h ({((totalHours / selectedRequiredHours) * 100).toFixed(1)}%)</div>
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
                  {records.length === 0 ? (
                    <tr><td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-400">No attendance records found</td></tr>
                  ) : records.map((r: any) => (
                    <tr key={r._id}>
                      <td className="border border-gray-300 px-3 py-2">{format(new Date(r.date + "T00:00:00"), "MMM d, yyyy")}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{r.timeIn ? format(new Date(r.timeIn), "h:mm a") : "—"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{r.timeOut ? format(new Date(r.timeOut), "h:mm a") : "—"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{r.hoursWorked?.toFixed(2) || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center capitalize">{r.status}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right">Total:</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{totalHours.toFixed(2)}</td>
                    <td className="border border-gray-300 px-3 py-2" />
                  </tr>
                </tbody>
              </table>
              <div className="mt-6 flex justify-between text-sm">
                <div className="text-center"><div className="border-b border-gray-400 w-32 mb-1" /><p className="text-gray-500">Student's Signature</p></div>
                <div className="text-center"><div className="border-b border-gray-400 w-32 mb-1" /><p className="text-gray-500">Supervisor's Signature</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
