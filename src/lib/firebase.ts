import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjm2rR2H57hj1kP5iXjBDXDpZhV7xAE6E",
  authDomain: "lovematch-e5642.firebaseapp.com",
  databaseURL: "https://lovematch-e5642-default-rtdb.firebaseio.com",
  projectId: "lovematch-e5642",
  storageBucket: "lovematch-e5642.firebasestorage.app",
  messagingSenderId: "756020356395",
  appId: "1:756020356395:web:da0072c699f43ded1b516e",
  measurementId: "G-1X0FCLF7LH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const database = getDatabase(app);

// Test database connection
const connectedRef = ref(database, '.info/connected');
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log('Connected to Firebase Database');
  } else {
    console.log('Not connected to Firebase Database');
  }
});

const storage = getStorage(app);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { database, storage, analytics, firestore };