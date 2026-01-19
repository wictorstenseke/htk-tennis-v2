#!/usr/bin/env node

/**
 * Script to initialize a test ladder in Firestore
 * 
 * Usage:
 *   node scripts/init-test-ladder.js
 * 
 * This will create a "Stegen 2026" ladder in your Firestore database.
 * Make sure you have the Firebase Admin SDK configured.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Make sure to set up your service account key
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestLadder() {
  try {
    const ladderData = {
      name: "Stegen 2026",
      year: 2026,
      startDate: admin.firestore.Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      status: "active",
      participants: [],
      createdAt: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection('ladders').add(ladderData);
    console.log('✅ Test ladder created successfully!');
    console.log('📝 Ladder ID:', docRef.id);
    console.log('📊 Ladder Data:', ladderData);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test ladder:', error);
    process.exit(1);
  }
}

createTestLadder();
