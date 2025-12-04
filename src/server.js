const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 6958;

// Static files
app.use(express.static(__dirname + '/public/'));
app.use(bodyParser.json());

// Load challenges
const coords = require('./challs.json');

// -------------------------
// GLOBAL CHALLENGE RATE LIMITER
// -------------------------

// Map: challengeKey → array of timestamps
const challengeRateLimits = new Map();

/**
 * Rate-limit checker
 * @param {string} challKey - key like "practice-sea"
 * @param {number} limit - max attempts allowed
 * @param {number} windowMs - time window
 * @returns {object} { allowed: boolean, retryAfterMs: number }
 */
function checkChallengeRateLimit(challKey, limit = 3, windowMs = 60_000) {
  const now = Date.now();
  const attempts = challengeRateLimits.get(challKey) || [];

  // Keep only attempts inside the time window
  const recent = attempts.filter(ts => now - ts < windowMs);

  // Too many attempts
  if (recent.length >= limit) {
    const retryAfterMs = windowMs - (now - recent[0]);
    return { allowed: false, retryAfterMs };
  }

  // Add current attempt
  recent.push(now);
  challengeRateLimits.set(challKey, recent);

  return { allowed: true, retryAfterMs: 0 };
}

// -------------------------

// Home
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Routes for each challenge
for (const [comp, challs] of Object.entries(coords)) {
  for (const [name, challenge] of Object.entries(challs)) {
    const { lat, lng, flag, panoType = 1 } = challenge;

    // Lightweight metadata endpoint consumed by the client to pick pano mode
    app.get(`/${comp}-${name}/meta`, (req, res) => {
      res.json({ panoType });
    });

    // Challenge page
    app.get(`/${comp}-${name}`, function (req, res) {
      res.sendFile(__dirname + '/chall.html');
    });

    // Challenge submit
    app.post(`/${comp}-${name}/submit`, (req, res) => {

      // ---------------------------------
      // RATE LIMIT FOR THIS CHALLENGE
      // ---------------------------------
      const challKey = `${comp}-${name}`;
      const { allowed, retryAfterMs } = checkChallengeRateLimit(challKey);

      if (!allowed) {
        const seconds = Math.ceil(retryAfterMs / 1000);
        return res.send(
          `CALM DOWN MY FRIEND you reached the rate limit: max 3 attempts per minute on this challenge. Try again in ${seconds} seconds.`
        );
      }
      // ---------------------------------

      const [guess_lat, guess_lng] = req.body;
      const dist = distance(guess_lat, guess_lng, lat, lng, 'K');

      if (dist == 0.0) {
        res.send('How did you even find that? : ' + flag);
      } else {
        res.send('Not here, try again. Hint: place your marker closer to the correct location!');
      }
    });
  }
}

// Distance function (in km)
function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0;
  } else {
    var radlat1 = Math.PI * lat1/180;
    var radlat2 = Math.PI * lat2/180;
    var theta = lon1-lon2;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) +
               Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    if (dist > 1) dist = 1;

    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") dist = dist * 1.609344;
    if (unit == "N") dist = dist * 0.8684;

    return (dist / 1.609).toFixed(1);
  }
}

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
