/**
 * StudentRegistry.jsx
 * Left panel: registration form.
 * Right panel: searchable student list with per-student mark-present toggle.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:4000';

const SESSIONS = ['session_1', 'session_2', 'session_3'];
const SESSION_LABELS = { session_1: 'Session 1', session_2: 'Session 2', session_3: 'Session 3' };
const SESSION_COLORS = { session_1: 'text-violet-400', session_2: 'text-sky-400', session_3: 'text-teal-400' };

// ── Registration Form ─────────────────────────────────────────────────────────
function RegistrationForm({ onRegistered }) {
  const [form, setForm] = useState({ name: '', course: '', studentId: '', batch: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.course || !form.batch) {
      setError('Name, Course and Batch are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const record = await res.json();
      setSuccess(`✓ ${record.name} registered (ID: ${record.studentId})`);
      setForm({ name: '', course: '', studentId: '', batch: '' });
      onRegistered();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass glow-violet p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Register Student</span>
        <span className="text-base">🎓</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {[
          { name: 'name',      placeholder: 'Full Name *',         type: 'text' },
          { name: 'course',    placeholder: 'Course (e.g. CS101) *', type: 'text' },
          { name: 'batch',     placeholder: 'Batch (e.g. 2024-A) *', type: 'text' },
          { name: 'studentId', placeholder: 'Student ID (optional – auto-generated)', type: 'text' },
        ].map(f => (
          <input
            key={f.name}
            name={f.name}
            type={f.type}
            placeholder={f.placeholder}
            value={form[f.name]}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600
                       focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors"
          />
        ))}

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
              {success}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit" disabled={loading}
          className="mt-1 bg-violet-600/80 hover:bg-violet-600 border border-violet-500/40 text-white text-sm font-semibold
                     rounded-lg px-4 py-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering…' : 'Register Student'}
        </button>
      </form>
    </div>
  );
}

// ── Student Row ───────────────────────────────────────────────────────────────
function StudentRow({ student, onToggle }) {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState('session_1');

  const toggle = async () => {
    setLoading(true);
    await onToggle(student.studentId, student.isPresent, session);
    setLoading(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors
        ${student.isPresent
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}
    >
      {/* Status indicator */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 transition-colors
        ${student.isPresent ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-slate-700'}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{student.name}</p>
        <p className="text-[10px] text-slate-500 mono truncate">
          {student.studentId} &nbsp;·&nbsp; {student.course} &nbsp;·&nbsp; {student.batch}
        </p>
        {student.isPresent && student.sessionId && (
          <p className={`text-[10px] mono mt-0.5 ${SESSION_COLORS[student.sessionId] || 'text-slate-400'}`}>
            ✓ Present in {SESSION_LABELS[student.sessionId]}
          </p>
        )}
      </div>

      {/* Session selector (only when marking present) */}
      {!student.isPresent && (
        <select
          value={session}
          onChange={e => setSession(e.target.value)}
          className="bg-white/5 border border-white/10 text-slate-400 text-[10px] rounded-lg px-1.5 py-1
                     focus:outline-none focus:border-violet-500/50 mr-1"
        >
          {SESSIONS.map(s => (
            <option key={s} value={s} className="bg-[#0d1117]">{SESSION_LABELS[s]}</option>
          ))}
        </select>
      )}

      {/* Toggle button */}
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all active:scale-95 flex-shrink-0
          ${student.isPresent
            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}
          disabled:opacity-50`}
      >
        {loading ? '…' : student.isPresent ? 'Mark Absent' : 'Mark Present'}
      </button>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentRegistry({ registry = [], onAction }) {
  const [search, setSearch] = useState('');

  const filtered = registry.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.course.toLowerCase().includes(search.toLowerCase()) ||
    s.batch.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (studentId, isPresent, sessionId) => {
    const endpoint = isPresent ? 'absent' : 'present';
    const body = isPresent ? {} : { sessionId };
    await fetch(`${API}/students/${studentId}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // The socket broadcast will refresh the registry in App.jsx automatically
  };

  const present = registry.filter(s => s.isPresent).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Registration form */}
      <RegistrationForm onRegistered={onAction} />

      {/* Student list */}
      <div className="glass glow-cyan p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Student List</span>
            <span className="text-base">📋</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] mono text-emerald-400">{present} present</span>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] mono text-slate-500">{registry.length} registered</span>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, ID, course or batch…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600
                     focus:outline-none focus:border-sky-500/50 transition-colors"
        />

        {/* List */}
        <div className="flex flex-col gap-1.5 overflow-y-auto pr-1" style={{ maxHeight: '360px' }}>
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-slate-600 text-sm py-8"
              >
                {registry.length === 0 ? 'No students registered yet. Add one above.' : 'No matches found.'}
              </motion.p>
            )}
            {filtered.map(student => (
              <StudentRow key={student.studentId} student={student} onToggle={handleToggle} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
