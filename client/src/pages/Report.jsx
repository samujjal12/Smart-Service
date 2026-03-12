import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';

const API = 'http://localhost:4000/api';

export default function Report() {
  const [batches] = useState(['Batch A', 'Batch B', 'Batch C']); // Hardcoded for simplicity
  const [students, setStudents] = useState([]);
  
  const [filters, setFilters] = useState({
    batch: '',
    enrollmentId: '',
    timeframe: 'Monthly',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // When a batch is selected, load the students for that batch to populate the dropdown
  useEffect(() => {
    if (!filters.batch) {
      setStudents([]);
      setFilters(prev => ({ ...prev, enrollmentId: '' }));
      return;
    }
    
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'students'), where('batch', '==', filters.batch));
        const snap = await getDocs(q);
        const batchStudents = [];
        snap.forEach(d => batchStudents.push({ id: d.id, ...d.data() }));
        setStudents(batchStudents);
      } catch (err) {
        console.error("Error fetching students for report:", err);
      }
    };

    fetchStudents();
  }, [filters.batch]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!filters.enrollmentId) {
      setError('Please select a student.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Fetch the student's personal info
      const studentDoc = await getDoc(doc(db, 'students', filters.enrollmentId));
      if (!studentDoc.exists()) throw new Error("Student not found in DB");
      const student = studentDoc.data();

      // 2. Fetch all their attendance logs
      const logsQuery = query(
        collection(db, 'attendance_logs'),
        where('enrollmentId', '==', filters.enrollmentId)
      );
      // In a real app add: orderBy('date', 'desc') but requires a composite index to be built first
      const logsSnap = await getDocs(logsQuery);
      
      const records = [];
      logsSnap.forEach(d => records.push(d.data()));

      // Sort logs locally to avoid requiring composite indexes for this simple app
      records.sort((a,b) => b.date.localeCompare(a.date));

      // 3. Calculate summary metrics to send to PDF Generator
      const present = records.filter(r => r.status === 'Present').length;
      const absent = records.filter(r => r.status === 'Absent').length;
      const pending = 0; 
      const summary = { present, absent, pending };

      // 4. Send the completely constructed raw payload to our Node PDF Microservice
      const res = await fetch(`${API}/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          summary,
          records
        }),
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to generate report');
      }

      // Convert response to blob and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${filters.enrollmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Generate Reports
        </h1>
        <p className="text-sm text-gray-500 mt-1">Download PDF attendance records for individual students.</p>
      </div>

      <div className="card-soft bg-white p-6 md:p-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
              <select
                value={filters.batch}
                onChange={e => setFilters({...filters, batch: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
                required
              >
                <option value="">Select a batch...</option>
                {batches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Student Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <select
                value={filters.enrollmentId}
                onChange={e => setFilters({...filters, enrollmentId: e.target.value})}
                disabled={!filters.batch || students.length === 0}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                required
              >
                <option value="">{filters.batch ? 'Select a student...' : 'Select a batch first'}</option>
                {students.map(s => (
                  <option key={s.enrollmentId} value={s.enrollmentId}>
                    {s.name} ({s.enrollmentId})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <div className="flex gap-4">
                {['Daily', 'Weekly', 'Monthly'].map(tf => (
                  <label key={tf} className="flex items-center gap-2 cursor-pointer border border-gray-100 p-3 rounded-lg flex-1 hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="timeframe"
                      value={tf}
                      checked={filters.timeframe === tf}
                      onChange={e => setFilters({...filters, timeframe: e.target.value})}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{tf}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                ✓ Report generated and downloaded successfully!
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || !filters.enrollmentId}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate & Download PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
