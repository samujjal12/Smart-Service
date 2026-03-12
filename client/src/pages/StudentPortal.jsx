import { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export default function StudentPortal() {
  const [sessionState, setSessionState] = useState('LOGGED_OUT'); // LOGGED_OUT, ACTIVE
  const [enrollmentId, setEnrollmentId] = useState('');
  
  const [studentData, setStudentData] = useState(null);
  const [settings, setSettings] = useState({ requiredSessionMinutes: 60 });
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Global Settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) setSettings(snap.data());
      } catch (err) {
        console.error("Could not load global settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (sessionState === 'ACTIVE' && studentData) {
      interval = setInterval(() => {
        // Calculate difference from login timestamp to now
        const now = new Date().getTime();
        const start = new Date(studentData.loginTime).getTime();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState, studentData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!enrollmentId) return;
    
    setLoading(true);
    setError(null);

    try {
      const studentIdForm = enrollmentId.toUpperCase();
      
      // 1. Verify Student Exists
      const studentSnap = await getDoc(doc(db, 'students', studentIdForm));
      
      if (!studentSnap.exists()) {
        throw new Error("Invalid Enrollment ID. Not found in system.");
      }

      const studentInfo = studentSnap.data();

      // 2. Check if already active
      const sessionSnap = await getDoc(doc(db, 'active_sessions', studentIdForm));
      
      let loginTimeString;

      if (sessionSnap.exists()) {
         // resume session
         loginTimeString = sessionSnap.data().loginTime;
      } else {
         // start new session
         loginTimeString = new Date().toISOString();
         await setDoc(doc(db, 'active_sessions', studentIdForm), {
           ...studentInfo,
           loginTime: loginTimeString
         });
      }

      setStudentData({ ...studentInfo, loginTime: loginTimeString });
      setSessionState('ACTIVE');
      setEnrollmentId(''); // clear input
      
      // Init timer immediately
      const now = new Date().getTime();
      const start = new Date(loginTimeString).getTime();
      setElapsedSeconds(Math.floor((now - start) / 1000));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!studentData) return;
    setLoading(true);

    try {
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const isPresent = elapsedMinutes >= settings.requiredSessionMinutes;
      
      const statusStr = isPresent ? 'Present' : 'Absent';

      // 1. Write the final Attendance Log
      const todayDate = new Date().toISOString().split('T')[0];
      const subject = studentData.subjectEnrolled || 'General';
      const logId = `${studentData.enrollmentId}_${todayDate}_${subject}`;
      
      await setDoc(doc(db, 'attendance_logs', logId), {
        enrollmentId: studentData.enrollmentId,
        name: studentData.name,
        batch: studentData.batch,
        date: todayDate,
        subject: subject,
        status: statusStr,
        timestamp: new Date().toISOString(),
        totalSessionMinutes: elapsedMinutes
      });

      // 2. Delete the active session document
      await deleteDoc(doc(db, 'active_sessions', studentData.enrollmentId));

      // 3. Reset UI
      setStudentData(null);
      setElapsedSeconds(0);
      setSessionState('LOGGED_OUT');

      // Optional: Show a quick toast or alert "Marked as Present!" before it unmounts
      alert(`Session Ended.\nLogged Time: ${elapsedMinutes} mins.\nStatus Recorded: ${statusStr}`);

    } catch (err) {
      console.error(err);
      alert("Error logging out and saving to database.");
    } finally {
      setLoading(false);
    }
  };

  // Formatting helpers
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  const requiredSeconds = settings.requiredSessionMinutes * 60;
  const progressPercent = Math.min((elapsedSeconds / requiredSeconds) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
      
      <AnimatePresence mode="wait">
        
        {sessionState === 'LOGGED_OUT' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          >
            <div className="bg-blue-600 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Student Portal</h1>
              <p className="text-blue-100 mt-2 text-sm">Sign in to start your class session.</p>
            </div>

            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment ID</label>
                  <input
                    type="text"
                    value={enrollmentId}
                    onChange={e => setEnrollmentId(e.target.value)}
                    placeholder="e.g. ENR1000"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-950 font-mono text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 transition-colors uppercase text-center tracking-widest"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !enrollmentId}
                  className="w-full flex justify-center items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 font-medium rounded-xl text-lg px-6 py-4 focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Start Session
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {sessionState === 'ACTIVE' && studentData && (
          <motion.div 
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          >
            <div className="p-8 pb-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{studentData.name}</h2>
                <p className="text-gray-500 font-mono text-sm mt-1">{studentData.enrollmentId} • {studentData.batch}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="p-8 space-y-8">
              
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4" /> Active Session Time
                </p>
                <h1 className="text-5xl font-extrabold text-blue-600 tabular-nums tracking-tight">
                  {formatTime(elapsedSeconds)}
                </h1>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500">Progress</span>
                  <span className={elapsedSeconds >= requiredSeconds ? "text-emerald-600" : "text-blue-600"}>
                    {Math.floor(progressPercent)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${elapsedSeconds >= requiredSeconds ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-400 font-medium">
                  {settings.requiredSessionMinutes} minutes required to be marked present.
                </p>
              </div>

              <button
                onClick={handleLogout}
                disabled={loading}
                className={`w-full flex justify-center items-center gap-2 text-white focus:ring-4 font-medium rounded-xl text-lg px-6 py-4 focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                  elapsedSeconds >= requiredSeconds 
                    ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200' 
                    : 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-200'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    {elapsedSeconds >= requiredSeconds ? 'End Session (Present)' : 'End Session Early (Absent)'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
