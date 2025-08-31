const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin first
require('./private/firebase-admin-init');

// Import services
const JournalService = require('./private/journal-service');
const AutomationService = require('./private/automation-service');

// Import Firebase Admin
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.static('public'));
// Add JSON parsing middleware
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

app.get('/api/firebase-config', (req, res) => {
    const config = fs.readFileSync('./private/firebase-config.js', 'utf8');
    res.json({ code: config });
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
        const firebaseConfig = fs.readFileSync('./private/firebase-config.js', 'utf8');
        const script = fs.readFileSync('./private/script.js', 'utf8');
        
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

${firebaseConfig}

${script}
        `;
        
// UTF-8 compatible encryption
const key = 123; // Single encryption key
const encrypt = (text) => {
    // Convert text to UTF-8 bytes
    const utf8Bytes = new TextEncoder().encode(text);
    
    // XOR each byte
    const xorBytes = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
        xorBytes[i] = utf8Bytes[i] ^ key;
    }
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < xorBytes.length; i++) {
        binary += String.fromCharCode(xorBytes[i]);
    }
    return btoa(binary);
};
        
        const encrypted = encrypt(bundleContent);
        
        // Create the decryption script
        const decryptorScript = `
const k = ${key};
const d = '${encrypted}';

function decrypt(encryptedData, key) {
    try {
        const decoded = atob(encryptedData);
        
        // Convert decoded string back to bytes
        const xorBytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            xorBytes[i] = decoded.charCodeAt(i);
        }
        
        // XOR each byte back
        const utf8Bytes = new Uint8Array(xorBytes.length);
        for (let i = 0; i < xorBytes.length; i++) {
            utf8Bytes[i] = xorBytes[i] ^ key;
        }
        
        // Convert back to UTF-8 string
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

// Add automation control endpoints (optional - for manual control)
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
