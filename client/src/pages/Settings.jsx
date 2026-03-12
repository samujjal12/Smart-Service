import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Settings() {
  const [config, setConfig] = useState({
    requiredSessionMinutes: 60 // Default fallback
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setConfig(snap.data());
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Could not load global settings: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const docRef = doc(db, 'settings', 'global');
      await setDoc(docRef, {
        requiredSessionMinutes: Number(config.requiredSessionMinutes),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-gray-700" />
          Global Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure automated rules for the student self-service portal.</p>
      </div>

      <div className="card-soft bg-white p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                 <Clock className="w-4 h-4 text-blue-500" /> Required Session Duration (Minutes)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                 When students log into the portal, they must keep their session active for at least this many minutes to automatically be marked 'Present'. If they log out earlier, they will be marked 'Absent'.
              </p>
              <input
                type="number"
                min="1"
                max="480" // 8 hours max
                value={config.requiredSessionMinutes}
                onChange={e => setConfig({...config, requiredSessionMinutes: e.target.value})}
                className="w-full md:w-64 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 font-medium tracking-wide">
                ✓ System settings updated successfully!
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 font-medium rounded-lg text-sm px-6 py-2.5 focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
