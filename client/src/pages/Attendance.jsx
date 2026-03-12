import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

export default function Attendance() {
  const [subjects, setSubjects] = useState(['CS101', 'EE201', 'ME301']);
  
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: 'CS101',
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch Students from Firestore and merge with any existing attendance logs for today
  useEffect(() => {
    if (!filters.date || !filters.subject) return;

    const loadRoster = async () => {
      setLoading(true);
      try {
        // 1. Get all students
        const studentsSnap = await getDocs(collection(db, 'students'));
        const allStudents = [];
        studentsSnap.forEach(doc => allStudents.push({ id: doc.id, ...doc.data() }));

        // 2. Get today's attendance logs for this subject
        const logsQuery = query(
          collection(db, 'attendance_logs'),
          where('date', '==', filters.date),
          where('subject', '==', filters.subject)
        );
        const logsSnap = await getDocs(logsQuery);
        
        // Create a map of enrollmentId -> status
        const existingLogs = {};
        logsSnap.forEach(doc => {
          const data = doc.data();
          existingLogs[data.enrollmentId] = data.status;
        });

        // 3. Merge them
        const mappedStudents = allStudents.map(s => ({
          ...s,
          // If a log exists and is 'Present', check the box. Otherwise default to un-checked (Absent)
          isPresent: existingLogs[s.enrollmentId] === 'Present'
        }));

        setStudents(mappedStudents);
      } catch (err) {
        console.error("Error loading roster:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [filters.date, filters.subject]);

  const toggleStatus = (enrollmentId) => {
    setStudents(prev => prev.map(s => {
      if (s.enrollmentId === enrollmentId) {
        return { ...s, isPresent: !s.isPresent };
      }
      return s;
    }));
  };

  const markAll = (isPresent) => {
    setStudents(prev => prev.map(s => ({ ...s, isPresent })));
  };

  const saveAttendance = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const batch = writeBatch(db);

      students.forEach(s => {
        // Use a composite ID so we overwrite existing logs for the same student/date/subject
        const logId = `${s.enrollmentId}_${filters.date}_${filters.subject}`;
        const logRef = doc(collection(db, 'attendance_logs'), logId);
        
        batch.set(logRef, {
          enrollmentId: s.enrollmentId,
          name: s.name,
          batch: s.batch, // from student doc
          date: filters.date,
          subject: filters.subject,
          status: s.isPresent ? 'Present' : 'Absent',
          timestamp: new Date().toISOString()
        });
      });

      await batch.commit();
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving attendance:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Section Layout */}
      <div className="card-soft bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row gap-6 flex-1">
          {/* Subject Dropdown */}
          <div className="w-full md:w-64">
            <label className="block text-sm text-gray-500 font-medium mb-1">Subject</label>
            <select
              value={filters.subject}
              onChange={e => setFilters({...filters, subject: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg text-gray-900 px-3 py-2 text-base focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Date Auto-filled */}
          <div className="w-full md:w-48">
            <label className="block text-sm text-gray-500 font-medium mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              disabled
              className="w-full bg-gray-50 border border-gray-100 rounded-lg text-gray-500 px-3 py-2 text-base cursor-not-allowed"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-end gap-2">
          <button
             onClick={saveAttendance}
             disabled={saving || students.length === 0}
             className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {saving ? 'Saving...' : 'Save Attendance'}
          </button>
          
          {saveSuccess && (
            <span className="text-sm font-medium text-green-600 absolute translate-y-12">
              ✓ Saved successfully
            </span>
          )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="card-soft bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Enrolled Students</h3>
          <div className="flex justify-end gap-3 text-sm">
            <button onClick={() => markAll(true)} className="text-blue-600 hover:text-blue-700 font-medium">Select All</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => markAll(false)} className="text-gray-500 hover:text-gray-700 font-medium">Clear All</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No students enrolled in this subject.</div>
          ) : (
            <table className="w-full text-left text-gray-700">
              <thead className="bg-gray-50/50 border-b border-gray-100 uppercase text-xs font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Student Name</th>
                  <th scope="col" className="px-6 py-4">Enrollment ID</th>
                  <th scope="col" className="px-6 py-4 text-center w-32">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr 
                    key={student.enrollmentId} 
                    className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${student.isPresent ? 'bg-blue-50/20' : ''}`}
                    onClick={() => toggleStatus(student.enrollmentId)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 border-l-[3px] border-transparent" style={{ borderLeftColor: student.isPresent ? '#3b82f6' : 'transparent' }}>
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                      {student.enrollmentId}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={student.isPresent}
                          onChange={() => toggleStatus(student.enrollmentId)}
                          onClick={(e) => e.stopPropagation()} 
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

