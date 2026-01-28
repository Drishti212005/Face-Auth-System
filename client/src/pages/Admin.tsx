import { useAttendance } from "@/hooks/use-attendance";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"; // Assuming shadcn components exist or standard HTML table
import { Download, Search, FileText } from "lucide-react";
import { useState } from "react";

export default function Admin() {
  const { data: attendance, isLoading } = useAttendance();
  const [filter, setFilter] = useState("");

  const filteredData = attendance?.filter(record => 
    record.user.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance Logs</h1>
          <p className="text-muted-foreground mt-1">View and manage employee punch records.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors border border-white/10">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      <div className="bg-card border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              placeholder="Search by employee name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground bg-secondary/30">
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Time</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Employee</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Type</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Liveness Score</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading records...
                  </td>
                </tr>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {record.timestamp ? format(new Date(record.timestamp), "MMM dd, yyyy HH:mm:ss") : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {record.user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{record.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        record.type === 'in' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {record.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {record.livenessScore ? `${(record.livenessScore * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText size={48} className="opacity-20" />
                      <p>No attendance records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
