// ==========================================================================
// Cosmic Garden: Cloud Database Synchronization Engine (Firebase Firestore)
// ==========================================================================
'use strict';

(function () {
  const COLLECTION_NAME = 'cosmic_thoughts';
  let dbInstance = null;
  let isConnected = false;
  let thoughtsListener = null;

  /**
   * Initializes Firebase Firestore and binds listeners.
   * @param {Function} onThoughtsUpdated Callback receiving updated thoughts array from cloud.
   * @param {Function} onStatusChanged Callback receiving status: 'connected' | 'offline' | 'local'
   */
  function initCloudSync(onThoughtsUpdated, onStatusChanged) {
    if (!window.firebase) {
      console.warn('Firebase SDK not loaded. Running in local storage mode.');
      if (onStatusChanged) onStatusChanged('local');
      return;
    }

    const isConfigured = window.isFirebaseConfigured && window.isFirebaseConfigured();
    if (!isConfigured) {
      console.info('Firebase credentials not configured yet. Running in offline/local mode.');
      if (onStatusChanged) onStatusChanged('local');
      return;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(window.FIREBASE_CONFIG);
      }
      dbInstance = window.firebase.firestore();
      isConnected = true;
      if (onStatusChanged) onStatusChanged('connected');

      // Real-time live listener for thoughts across all devices
      thoughtsListener = dbInstance
        .collection(COLLECTION_NAME)
        .orderBy('timestamp', 'desc')
        .onSnapshot(
          (snapshot) => {
            const cloudThoughts = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              cloudThoughts.push({
                id: doc.id,
                dateKey: data.dateKey,
                dateFormatted: data.dateFormatted,
                timeFormatted: data.timeFormatted,
                mood: data.mood,
                text: data.text,
                timestamp: data.timestamp
              });
            });

            if (onThoughtsUpdated) {
              onThoughtsUpdated(cloudThoughts);
            }
          },
          (error) => {
            console.error('Error in Firestore live sync listener:', error);
            isConnected = false;
            if (onStatusChanged) onStatusChanged('offline');
          }
        );
    } catch (err) {
      console.error('Failed to initialize Firebase Firestore:', err);
      isConnected = false;
      if (onStatusChanged) onStatusChanged('local');
    }
  }

  /**
   * Saves or updates a thought in the cloud database.
   * @param {Object} thought The thought object { id, dateKey, dateFormatted, timeFormatted, mood, text }
   */
  async function saveThoughtToCloud(thought) {
    if (!dbInstance || !isConnected) return false;

    try {
      const docRef = dbInstance.collection(COLLECTION_NAME).doc(thought.id);
      await docRef.set(
        {
          id: thought.id,
          dateKey: thought.dateKey,
          dateFormatted: thought.dateFormatted,
          timeFormatted: thought.timeFormatted,
          mood: thought.mood,
          text: thought.text,
          timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Failed to save thought to cloud:', err);
      return false;
    }
  }

  /**
   * Deletes a thought from the cloud database.
   * @param {string} thoughtId
   */
  async function deleteThoughtFromCloud(thoughtId) {
    if (!dbInstance || !isConnected) return false;

    try {
      await dbInstance.collection(COLLECTION_NAME).doc(thoughtId).delete();
      return true;
    } catch (err) {
      console.error('Failed to delete thought from cloud:', err);
      return false;
    }
  }

  // Export to global window for main application integration
  window.CosmicDB = {
    init: initCloudSync,
    saveThought: saveThoughtToCloud,
    deleteThought: deleteThoughtFromCloud,
    isCloudActive: () => isConnected && dbInstance !== null
  };
})();
