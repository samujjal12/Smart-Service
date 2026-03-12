/**
 * eventProcessor.js
 * In-memory event queue with asynchronous processing loop.
 */
const { processLogin, processLogout } = require('./attendanceStore');

const queue = [];
let processing = false;

/**
 * Push a new event onto the queue.
 */
function enqueue(event) {
  queue.push(event);
  if (!processing) startProcessing();
}

/**
 * Continuously drain the queue, processing each event.
 */
async function startProcessing() {
  processing = true;

  while (queue.length > 0) {
    const event = queue.shift();
    try {
      if (event.eventType === 'LOGIN') {
        processLogin(event);
      } else if (event.eventType === 'LOGOUT') {
        processLogout(event);
      }
    } catch (err) {
      console.error('Error processing event:', err);
    }

    // Yield to the event loop occasionally so other async ops aren't starved
    if (queue.length % 10 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  processing = false;
}

module.exports = { enqueue };
