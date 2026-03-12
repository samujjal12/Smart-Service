import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './layout/Navbar';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Track from './pages/Track';
import Report from './pages/Report';
import Enroll from './pages/Enroll';
import Settings from './pages/Settings';
import StudentPortal from './pages/StudentPortal';

// Clear out old Socket/App state styles completely
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/track" element={<Track />} />
            <Route path="/report" element={<Report />} />
            <Route path="/enroll" element={<Enroll />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>



        </main>
      </div>
    </BrowserRouter>
  );
}
