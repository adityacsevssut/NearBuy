/**
 * shopTimings.js
 * Shared utility for computing dynamic shop open/closed status based on
 * day-wise timing slots stored in vendor_profiles.shop_timings (JSONB).
 *
 * shop_timings format:
 * {
 *   "mon": [{ "open": "09:00", "close": "12:00" }, { "open": "16:00", "close": "21:00" }],
 *   "tue": [...],
 *   "wed": [],   <-- empty = closed all day
 *   ...
 *   "sun": [{ "open": "10:00", "close": "22:00" }]
 * }
 */

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Get current IST time as { dayKey, minutes }
 * minutes = total minutes since midnight
 */
function getISTNow() {
  const now = new Date();
  // IST = UTC + 5:30 = UTC + 330 minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 330 * 60000;
  const ist = new Date(istMs);
  const dayKey = DAY_KEYS[ist.getDay()];
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  return { dayKey, minutes, ist };
}

/**
 * Parse "HH:MM" into total minutes since midnight
 */
function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Returns true if the shop should be live right now based on its timings.
 * @param {Object|Array} timings - the shop_timings JSONB value
 */
function isShopLiveNow(timings) {
  if (!timings) return false;
  // Support legacy flat array (old format) — treat as today's slots
  if (Array.isArray(timings)) {
    const { minutes } = getISTNow();
    return timings.some(slot => {
      const open = toMinutes(slot.open);
      const close = toMinutes(slot.close);
      return open < close && minutes >= open && minutes < close;
    });
  }
  const { dayKey, minutes } = getISTNow();
  const slots = timings[dayKey];
  if (!slots || slots.length === 0) return false;
  return slots.some(slot => {
    const open = toMinutes(slot.open);
    const close = toMinutes(slot.close);
    return open < close && minutes >= open && minutes < close;
  });
}

/**
 * Returns minutes until the next opening slot.
 * Looks ahead up to 7 days. Returns Infinity if no future slot found.
 * @param {Object|Array} timings
 */
function minutesToNextOpen(timings) {
  if (!timings) return Infinity;
  const { dayKey, minutes: nowMin, ist } = getISTNow();

  let todayIdx = DAY_KEYS.indexOf(dayKey);

  for (let d = 0; d < 8; d++) {
    const checkDayIdx = (todayIdx + d) % 7;
    const checkDayKey = DAY_KEYS[checkDayIdx];

    let slots;
    if (Array.isArray(timings)) {
      // Legacy flat array — only for today
      slots = d === 0 ? timings : [];
    } else {
      slots = timings[checkDayKey] || [];
    }

    for (const slot of slots) {
      const openMin = toMinutes(slot.open);
      const closeMin = toMinutes(slot.close);
      if (openMin >= closeMin) continue; // invalid slot

      const slotStartInFuture = d * 1440 + openMin; // minutes from now-midnight
      const nowFromMidnight = nowMin; // minutes from today-midnight

      const diff = slotStartInFuture - nowFromMidnight;
      if (diff > 0) return diff; // positive = in the future
    }
  }
  return Infinity;
}

/**
 * Format minutes into a human-readable string e.g. "2h 15m", "45m"
 */
function formatMinutes(mins) {
  if (!isFinite(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Returns a summary string of today's slots, e.g. "9am–12pm · 4pm–9pm"
 */
function todayTimingSummary(timings) {
  if (!timings) return null;
  const { dayKey } = getISTNow();
  const slots = Array.isArray(timings) ? timings : (timings[dayKey] || []);
  if (!slots.length) return 'Closed today';
  return slots.map(slot => {
    const fmt = t => {
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'pm' : 'am';
      const h12 = h % 12 || 12;
      return m > 0 ? `${h12}:${String(m).padStart(2,'0')}${ampm}` : `${h12}${ampm}`;
    };
    return `${fmt(slot.open)}–${fmt(slot.close)}`;
  }).join(' · ');
}

module.exports = { isShopLiveNow, minutesToNextOpen, formatMinutes, todayTimingSummary, getISTNow, DAY_KEYS };
