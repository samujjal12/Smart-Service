/**
 * eventGenerator.js
 * Simulates realistic student login/logout events.
 * Also simulates a "lecture start spike" at initialization.
 */
const { v4: uuidv4 } = require('uuid');

const SESSIONS = ['session_1', 'session_2', 'session_3'];
const TOTAL_STUDENTS = 200;
const LOGIN_PROBABILITY = 0.70;
const MIN_INTERVAL_MS = 50;
const MAX_INTERVAL_MS = 100;

/**
 * Pick a random integer in [min, max].
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Create a single StudentEvent object.
 */
function createEvent(eventType, studentId, sessionId) {
  return {
    timestamp: Date.now(),
    eventId: uuidv4(),
    studentId,
    sessionId,
    eventType,
    deviceId: `device_${randInt(1, 500)}`,
  };
}

/**
 * Generate a "lecture start" burst: many students log in rapidly
 * across all sessions to bootstrap the activity window.
 * Returns an array of events.
 */
function generateLectureSpike(count = 120) {
  const events = [];
  for (let i = 0; i < count; i++) {
    const studentId = `student_${randInt(1, TOTAL_STUDENTS)}`;
    const sessionId = SESSIONS[i % SESSIONS.length];
    events.push(createEvent('LOGIN', studentId, sessionId));
  }
  return events;
}

/**
 * Start continuous event generation.
 * Calls onEvent(event) for each generated event.
 * Returns a stop function.
 */
function startGenerator(onEvent) {
  let running = true;

  async function loop() {
    while (running) {
      const studentId = `student_${randInt(1, TOTAL_STUDENTS)}`;
      const sessionId = pick(SESSIONS);
      const eventType = Math.random() < LOGIN_PROBABILITY ? 'LOGIN' : 'LOGOUT';
      onEvent(createEvent(eventType, studentId, sessionId));

      const delay = randInt(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  loop();

  return () => { running = false; };
}

module.exports = { startGenerator, generateLectureSpike };
