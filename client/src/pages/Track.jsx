import { useState, useEffect } from 'react';
import { Filter, Search, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Track() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeframe: 'Monthly',
    batch: '',
    search: ''
  });
  
  const [batches] = useState(['Batch A', 'Batch B', 'Batch C']); // Hardcoded for simplicity as in original backend

  useEffect(() => {
    const fetchAndAggregate = async () => {
      setLoading(true);
      try {
        // 1. Fetch Students
        const studentsSnap = await getDocs(collection(db, 'students'));
        const studentsMap = {};
        studentsSnap.forEach(doc => {
          studentsMap[doc.id] = { ...doc.data(), present: 0, absent: 0, pending: 0 };
        });

        // 2. Fetch All Logs (In a real app, we'd query by date range based on 'timeframe')
        // For this demo, we'll fetch all and aggregate
        const logsSnap = await getDocs(collection(db, 'attendance_logs'));
        
        logsSnap.forEach(doc => {
          const log = doc.data();
          if (studentsMap[log.enrollmentId]) {
            if (log.status === 'Present') studentsMap[log.enrollmentId].present++;
            if (log.status === 'Absent') studentsMap[log.enrollmentId].absent++;
          }
        });

        const aggregatedStats = Object.values(studentsMap);
        setStats(aggregatedStats);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAggregate();
  }, [filters.timeframe]);

  const filteredStats = stats.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                        s.enrollmentId.toLowerCase().includes(filters.search.toLowerCase());
    const matchBatch = filters.batch ? s.batch === filters.batch : true;
    return matchSearch && matchBatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track Performance</h1>
          <p className="text-sm text-gray-500 mt-1">Aggregated attendance statistics across selected timeframes.</p>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
          {['Daily', 'Weekly', 'Monthly'].map(tf => (
            <button
              key={tf}
              onClick={() => setFilters({ ...filters, timeframe: tf })}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filters.timeframe === tf 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="card-soft bg-white overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filters.batch}
              onChange={e => setFilters({...filters, batch: e.target.value})}
              className="bg-white border border-gray-200 rounded-lg text-sm text-gray-700 px-3 py-2 w-full sm:w-auto focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Stats Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading student statistics...</div>
          ) : filteredStats.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No matching records found.</div>
          ) : (
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Student Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Enrollment ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Batch</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center w-28">Present</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center w-28">Absent</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center w-28">Pending</th>
                  <th scope="col" className="px-6 py-4 font-semibold w-32">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStats.map((s) => {
                  const total = s.present + s.absent;
                  const rate = total > 0 ? Math.round((s.present / total) * 100) : 0;
                  
                  return (
                    <tr key={s.enrollmentId} className="bg-white hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{s.enrollmentId}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-medium">{s.batch}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="font-semibold">{s.present}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded">
                           <TrendingDown className="w-3.5 h-3.5" />
                           <span className="font-semibold">{s.absent}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-500 bg-gray-100 px-2 py-1 rounded">
                           <Clock className="w-3.5 h-3.5" />
                           <span className="font-semibold">{s.pending}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[60px]">
                            <div className={`h-1.5 rounded-full ${rate >= 75 ? 'bg-green-500' : rate >= 50 ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${rate}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700 w-8">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
