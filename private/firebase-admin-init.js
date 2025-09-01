const admin = require('firebase-admin');

// Initialize Firebase Admin only once
if (!admin.apps.length) {
    try {
        // Parse the service account from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        console.error('Make sure FIREBASE_SERVICE_ACCOUNT environment variable contains valid JSON');
        throw error;
    }
} else {
    console.log('Firebase Admin already initialized');
}

module.exports = admin;
