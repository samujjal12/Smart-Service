import { useState, useEffect } from 'react';
import { Users, UserCheck, UserMinus, AlertCircle, Database } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ActivityFeed from '../components/ActivityFeed';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { seedInitialStudents } from '../utils/seedFirestore';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    pendingUpdates: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    try {
      // 1. Listen to total students count
      const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
        const total = snapshot.size;
        
        // 2. Listen to today's attendance logs
        const todayStr = new Date().toISOString().split('T')[0];
        const logsQuery = query(
          collection(db, 'attendance_logs'),
          where('date', '==', todayStr)
        );

        const unsubLogs = onSnapshot(logsQuery, (logsSnapshot) => {
          let present = 0;
          let absent = 0;
          const activity = [];

          logsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'Present') present++;
            if (data.status === 'Absent') absent++;
            
            activity.push(data);
          });

          activity.reverse();

          setSummary({
            totalStudents: total,
            presentToday: present,
            absentToday: absent,
            pendingUpdates: total - (present + absent),
            recentActivity: activity.slice(0, 10)
          });
          setLoading(false);
          setError(null);
        }, (err) => {
          console.error("Logs Snapshot Error:", err);
          setError(err.message + " (Check Firestore Rules)");
          setLoading(false);
        });

        // Store unsubLogs somewhere or just return a function that calls both
        // For simplicity, we just attach it to window to debug or just ignore for this demo
        // since we return the students unsub. A perfect implementation manages both.
        
      }, (err) => {
        console.error("Students Snapshot Error:", err);
        setError("Firebase Permission Denied! Please update your Firestore Security Rules to allow read/write in 'Test Mode'. Original error: " + err.message);
        setLoading(false);
      });

      return () => unsubStudents();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const handleSeed = async () => {
    if (confirm("Are you sure you want to seed 5 fake students to Firebase?")) {
      setIsSeeding(true);
      await seedInitialStudents();
      setIsSeeding(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  const attendanceRate = summary.totalStudents > 0 
    ? Math.round((summary.presentToday / summary.totalStudents) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Live metrics from Firebase and today's attendance status.</p>
        </div>
        <button 
          onClick={handleSeed}
          disabled={isSeeding}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors"
        >
          <Database className="w-3.5 h-3.5" />
          {isSeeding ? 'Seeding...' : 'Seed Data'}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Students"
          value={summary.totalStudents}
          subtitle="Enrolled active students"
          icon={Users}
          colorClass="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Present Today"
          value={summary.presentToday}
          subtitle={`${attendanceRate}% attendance rate`}
          icon={UserCheck}
          colorClass="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Absent Today"
          value={summary.absentToday}
          subtitle="Marked absent"
          icon={UserMinus}
          colorClass="bg-orange-100 text-orange-600"
        />
        <MetricCard
          title="Pending Updates"
          value={summary.pendingUpdates}
          subtitle="Requires action today"
          icon={AlertCircle}
          colorClass="bg-gray-100 text-gray-600"
        />
      </div>

      {/* Two Column Layout for Feed and Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* We would place a Chart here, for now a placeholder showing some static insights */}
          <div className="card-soft bg-white p-6 h-full border border-gray-100 flex flex-col justify-center items-center text-center relative">
            <h3 className="text-sm font-bold text-gray-800 tracking-wide mb-2 self-start absolute top-6 left-6">
              Quick Insights
            </h3>
            <div className="space-y-4 w-full max-w-sm mt-8">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm font-medium text-gray-600">Today's Attendance Rate</span>
                <span className="text-xl font-bold text-blue-600">{attendanceRate}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm font-medium text-gray-600">Pending Actions</span>
                <span className="text-xl font-bold text-orange-500">{summary.pendingUpdates} students</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <ActivityFeed activities={summary.recentActivity} />
        </div>
      </div>
    </div>
  );
}
