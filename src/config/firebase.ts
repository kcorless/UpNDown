import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, onValue, ref, serverTimestamp, Database } from 'firebase/database';
import { getAnalytics, Analytics, setConsent } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
} as const;

// Initialize Firebase
console.log('Initializing Firebase with full config:', {
    ...firebaseConfig,
    apiKey: '[HIDDEN]'
});

let app: FirebaseApp;
let database: Database;
let analytics: Analytics;

try {
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize Realtime Database with explicit URL
    database = getDatabase(app, firebaseConfig.databaseURL);
    console.log('Database initialized with URL:', firebaseConfig.databaseURL);
    
    // Initialize analytics with privacy settings
    analytics = getAnalytics(app);
    setConsent({
        analytics_storage: 'denied',
        ad_storage: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
    });

    // Test database connection
    const testRef = ref(database, '.info/connected');
    onValue(testRef, (snapshot) => {
        const connected = snapshot.val();
        console.log('Firebase connection state:', connected ? 'connected' : 'disconnected');
    });
} catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
}

// Helper function to get server timestamp
export function getServerTimestamp(): ReturnType<typeof serverTimestamp> {
    return serverTimestamp();
}

export { app, database, analytics };
