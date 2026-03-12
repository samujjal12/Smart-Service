import { useState, useEffect } from 'react';
import { UserPlus, Server, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const API = 'http://localhost:4000/api';

export default function Enroll() {
  const [batches, setBatches] = useState(['Batch A', 'Batch B', 'Batch C']); // Hardcoded default
  const [subjects] = useState(['CS101', 'EE201', 'ME301']); // Optional extended meta
  
  const [formData, setFormData] = useState({
    name: '',
    enrollmentId: '',
    batch: '',
    subject: 'CS101' // Optional default
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Attempt to fetch batches from server meta if running
  useEffect(() => {
    fetch(`${API}/attendance/meta`)
      .then(res => res.json())
      .then(data => {
        if (data.batches?.length > 0) {
           setBatches(data.batches);
           setFormData(prev => ({ ...prev, batch: data.batches[0] }));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch meta api, using fallbacks");
        setFormData(prev => ({ ...prev, batch: batches[0] }));
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.name || !formData.enrollmentId || !formData.batch) {
        throw new Error("Please fill out all required fields.");
      }

      // Use enrollmentId as the document ID for absolute uniqueness
      const docRef = doc(collection(db, 'students'), formData.enrollmentId);
      
      await setDoc(docRef, {
        enrollmentId: formData.enrollmentId,
        name: formData.name,
        batch: formData.batch,
        subjectEnrolled: formData.subject, // optional
        createdAt: new Date().toISOString()
      }, { merge: true }); // Merge ensures we update if it exists, without blowing away other fields

      setSuccess(true);
      // Reset
      setFormData({
        name: '',
        enrollmentId: '',
        batch: formData.batch, // keep batch selected
        subject: formData.subject
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-emerald-600" />
          Enroll New Student
        </h1>
        <p className="text-sm text-gray-500 mt-1">Register a student to the system and synchronize with Firebase.</p>
      </div>

      <div className="card-soft bg-white p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alice Johnson"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment ID *</label>
              <input
                type="text"
                name="enrollmentId"
                value={formData.enrollmentId}
                onChange={handleChange}
                placeholder="e.g. ENR1005"
                className="w-full font-mono bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 transition-colors uppercase"
                required
              />
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                 <Server className="w-3 h-3" /> Acts as uniquely identifying Document ID in Firestore.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 transition-colors"
                  required
                >
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Subject Enroll (Optional)</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 transition-colors"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium">
                ✓ Student enrolled successfully and saved to Firebase!
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 font-medium rounded-lg text-sm px-6 py-3 focus:outline-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Enroll Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
