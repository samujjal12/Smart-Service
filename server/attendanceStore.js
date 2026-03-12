/**
 * attendanceStore.js
 * In-memory data structures for the attendance tracking system.
 */
const { v4: uuidv4 } = require('uuid');

// ── Simulated-event structures ────────────────────────────────────────────────

// Map<studentId, sessionId> - currently logged-in students (simulated)
const activeStudents = new Map();

// Map<sessionId, Set<studentId>> - cumulative attendance per session (simulated)
const sessionAttendance = new Map([
  ['session_1', new Set()],
  ['session_2', new Set()],
  ['session_3', new Set()],
]);

// Sliding activity window – Array of StudentEvent objects (last 10 minutes)
const activityWindow = [];

// Total count of all processed events
let totalProcessed = 0;

// Running list of recent events for the feed (last 50)
const recentFeed = [];

const WINDOW_DURATION_MS = 10 * 60 * 1000;

// ── Manual Student Registry ───────────────────────────────────────────────────
// Map<studentId, StudentRecord>
// StudentRecord: { studentId, name, course, batch, isPresent, sessionId, markedAt }
const studentRegistry = new Map();

/**
 * Register a new student (or update existing).
 */
function registerStudent({ name, course, studentId, batch }) {
  const id = studentId || `REG-${uuidv4().slice(0, 6).toUpperCase()}`;
  const record = {
    studentId: id,
    name: name.trim(),
    course: course.trim(),
    batch: batch.trim(),
    isPresent: false,
    sessionId: null,
    markedAt: null,
  };
  studentRegistry.set(id, record);
  return record;
}

/**
 * Mark a registered student present – generates a real LOGIN event.
 * Returns the created event (so the caller can enqueue + broadcast it).
 */
function markPresent(studentId, sessionId) {
  const record = studentRegistry.get(studentId);
  if (!record) return null;

  record.isPresent = true;
  record.sessionId = sessionId;
  record.markedAt = Date.now();

  const event = {
    timestamp: Date.now(),
    eventId: uuidv4(),
    studentId,
    sessionId,
    eventType: 'LOGIN',
    deviceId: 'manual-registry',
    meta: { name: record.name, course: record.course, batch: record.batch },
  };

  return event;
}

/**
 * Mark a registered student absent – generates a LOGOUT event.
 */
function markAbsent(studentId) {
  const record = studentRegistry.get(studentId);
  if (!record || !record.isPresent) return null;

  const sessionId = record.sessionId;
  record.isPresent = false;
  record.sessionId = null;
  record.markedAt = null;

  const event = {
    timestamp: Date.now(),
    eventId: uuidv4(),
    studentId,
    sessionId,
    eventType: 'LOGOUT',
    deviceId: 'manual-registry',
    meta: { name: record.name, course: record.course, batch: record.batch },
  };

  return event;
}

/**
 * Return the full registry as an array, sorted by name.
 */
function getRegistry() {
  return Array.from(studentRegistry.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// ── Event processing ──────────────────────────────────────────────────────────

function processLogin(event) {
  activeStudents.set(event.studentId, event.sessionId);

  const sess = sessionAttendance.get(event.sessionId);
  if (sess) sess.add(event.studentId);

  pushToWindow(event);
  pushToFeed(event);
  totalProcessed++;
}

function processLogout(event) {
  activeStudents.delete(event.studentId);

  pushToWindow(event);
  pushToFeed(event);
  totalProcessed++;
}

function pushToWindow(event) {
  activityWindow.push(event);
  pruneWindow();
}

function pruneWindow() {
  const cutoff = Date.now() - WINDOW_DURATION_MS;
  while (activityWindow.length > 0 && activityWindow[0].timestamp < cutoff) {
    activityWindow.shift();
  }
}

function pushToFeed(event) {
  recentFeed.unshift(event);
  if (recentFeed.length > 50) recentFeed.pop();
}

function getStats() {
  pruneWindow();

  const logins = activityWindow.filter(e => e.eventType === 'LOGIN').length;
  const logouts = activityWindow.filter(e => e.eventType === 'LOGOUT').length;

  const sessionCounts = {};
  for (const [sessionId, students] of sessionAttendance.entries()) {
    sessionCounts[sessionId] = students.size;
  }

  return {
    activeStudentCount: activeStudents.size,
    sessionCounts,
    windowLogins: logins,
    windowLogouts: logouts,
    windowEvents: activityWindow.length,
    totalProcessed,
    recentFeed: recentFeed.slice(0, 20),
    registry: getRegistry(),
    timestamp: Date.now(),
  };
}

module.exports = {
  processLogin,
  processLogout,
  getStats,
  registerStudent,
  markPresent,
  markAbsent,
  getRegistry,
};
