const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

try {
  let serviceAccount;

  // Check if we are in production/Vercel with the env var set
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fall back to local file for development
    serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  initialized = true;
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase Admin. Is FIREBASE_SERVICE_ACCOUNT set or firebase-service-account.json present?", error);
}

module.exports = { admin, initialized };
