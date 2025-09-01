const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin first
const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
    try {
        // Use individual environment variables instead of JSON parsing
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
        };
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
        
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw error;
    }
}

// Import services AFTER Firebase Admin is initialized
const JournalService = require('./private/journal-service');
const AutomationService = require('./private/automation-service');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Import and use Claude API routes
const claudeApi = require('./private/claude-api');
app.use('/api/claude', claudeApi);

// Serve the main HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints that return code as strings
app.get('/api/script', (req, res) => {
    const script = fs.readFileSync('./private/script.js', 'utf8');
    res.json({ code: script });
});

app.get('/api/styles', (req, res) => {
    const styles = fs.readFileSync('./private/style.css', 'utf8');
    res.json({ code: styles });
});

// Serve sprites from private folder
app.get('/api/sprites/:filename', (req, res) => {
    const filename = req.params.filename;
    const spritePath = path.join(__dirname, 'private', 'sprites', filename);
    
    // Check if file exists
    if (!fs.existsSync(spritePath)) {
        return res.status(404).json({ error: 'Sprite not found' });
    }
    
    // Set proper content type for images
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.webp') contentType = 'image/webp';
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(spritePath);
});

// Get list of available sprites
app.get('/api/sprites', (req, res) => {
    const spritesDir = path.join(__dirname, 'private', 'sprites');
    if (!fs.existsSync(spritesDir)) {
        return res.json({ sprites: [] });
    }
    
    const files = fs.readdirSync(spritesDir)
        .filter(file => file.match(/\.(png|jpg|jpeg|gif|webp)$/i));
    
    res.json({ sprites: files });
});

app.get('/api/bundle', (req, res) => {
    try {
        const styles = fs.readFileSync('./private/style.css', 'utf8');
        const script = fs.readFileSync('./private/script.js', 'utf8');
        
        // Create Firebase config from environment variables
        const firebaseConfigCode = `
// Firebase configuration injected from environment variables
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "${process.env.FIREBASE_API_KEY}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.FIREBASE_APP_ID}"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Make available globally for the main script
window.db = db;
window.auth = auth;
window.app = app;

// Export for module usage
export { db };
        `;
        
        // Read and encode sprites as base64
        const spritesDir = path.join(__dirname, 'private', 'sprites');
        const sprites = {};
        
        if (fs.existsSync(spritesDir)) {
            const files = fs.readdirSync(spritesDir);
            files.forEach(file => {
                if (file.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
                    const filePath = path.join(spritesDir, file);
                    const base64 = fs.readFileSync(filePath, 'base64');
                    const ext = path.extname(file).toLowerCase();
                    let mimeType = 'image/png';
                    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
                    if (ext === '.gif') mimeType = 'image/gif';
                    if (ext === '.webp') mimeType = 'image/webp';
                    
                    sprites[file.replace(/\.[^/.]+$/, "")] = `data:${mimeType};base64,${base64}`;
                }
            });
        }
        
        // Create the bundle content
        const bundleContent = `
const style = document.createElement('style');
style.textContent = \`${styles}\`;
document.head.appendChild(style);

window.SPRITES = ${JSON.stringify(sprites)};

${firebaseConfigCode}

${script}
        `;
        
        // UTF-8 compatible encryption
        const key = 123;
        const encrypt = (text) => {
            const utf8Bytes = new TextEncoder().encode(text);
            const xorBytes = new Uint8Array(utf8Bytes.length);
            for (let i = 0; i < utf8Bytes.length; i++) {
                xorBytes[i] = utf8Bytes[i] ^ key;
            }
            let binary = '';
            for (let i = 0; i < xorBytes.length; i++) {
                binary += String.fromCharCode(xorBytes[i]);
            }
            return btoa(binary);
        };
        
        const encrypted = encrypt(bundleContent);
        
        const decryptorScript = `
const k = ${key};
const d = '${encrypted}';

function decrypt(encryptedData, key) {
    try {
        const decoded = atob(encryptedData);
        const xorBytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            xorBytes[i] = decoded.charCodeAt(i);
        }
        const utf8Bytes = new Uint8Array(xorBytes.length);
        for (let i = 0; i < xorBytes.length; i++) {
            utf8Bytes[i] = xorBytes[i] ^ key;
        }
        return new TextDecoder().decode(utf8Bytes);
    } catch (e) {
        console.error('Decryption failed:', e);
        return '';
    }
}

const code = decrypt(d, k);
if (code) {
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = code;
    document.head.appendChild(script);
}
        `;
        
        res.setHeader('Content-Type', 'application/javascript');
        res.send(decryptorScript);
    } catch (error) {
        console.error('Bundle error:', error);
        res.status(500).json({ error: 'Failed to create bundle' });
    }
});

// Admin authentication endpoint
app.post('/api/auth/admin-token', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        
        // Verify this is your admin wallet
        if (walletAddress !== 'sDoTsdt9QPDMcJg2u9kATMxsh8FVboz4eoTrxTvibqB') {
            return res.status(403).json({ error: 'Not authorized - invalid wallet address' });
        }
        
        // Create admin token with both admin and wallet claims
        const customToken = await admin.auth().createCustomToken(walletAddress, {
            admin: true,
            wallet: walletAddress
        });
        
        console.log('Admin token created for wallet:', walletAddress);
        res.json({ customToken });
        
    } catch (error) {
        console.error('Failed to create admin token:', error);
        res.status(500).json({ error: 'Failed to create admin token' });
    }
});

// Use secure admin routes
app.use('/api/admin', require('./private/secure-admin'));

// Add automation control endpoints
app.post('/api/automation/start', (req, res) => {
    if (global.automationService) {
        global.automationService.start();
        res.json({ message: 'Automation service started' });
    } else {
        res.status(500).json({ error: 'Automation service not initialized' });
    }
});

app.post('/api/automation/stop', (req, res) => {
    if (global.automationService) {
        global.automationService.stop();
        res.json({ message: 'Automation service stopped' });
    } else {
        res.status(500).json({ error: 'Automation service not initialized' });
    }
});

app.get('/api/automation/status', (req, res) => {
    if (global.automationService) {
        res.json({ 
            running: global.automationService.isRunning,
            message: global.automationService.isRunning ? 'Running' : 'Stopped'
        });
    } else {
        res.json({ running: false, message: 'Not initialized' });
    }
});

app.get('/api/automation/next-action', (req, res) => {
    if (global.automationService) {
        const timeRemaining = global.automationService.getTimeUntilNextAction();
        const totalTime = global.automationService.getTotalActionTime();
        res.json({ 
            timeRemaining: timeRemaining,
            totalTime: totalTime,
            isActive: global.automationService.isRunning
        });
    } else {
        res.json({ timeRemaining: 0, totalTime: 0, isActive: false });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize Journal Service after server starts
    console.log('Initializing Journal Service...');
    const journalService = new JournalService();
    console.log('Journal Service started - monitoring feed for journal creation...');
    
    // Initialize and start Automation Service
    console.log('Initializing Automation Service...');
    try {
        global.automationService = new AutomationService();
        
        // Wait a few seconds for Firebase to be fully ready, then start automation
        setTimeout(() => {
            global.automationService.start();
            console.log('Automation Service started - automated actions will begin shortly...');
        }, 5000);
        
    } catch (error) {
        console.error('Failed to initialize Automation Service:', error);
    }
});
