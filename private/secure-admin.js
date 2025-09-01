const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const nacl = require('tweetnacl');

const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS;
const SIGNATURE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Store used nonces to prevent replay attacks
const usedNonces = new Set();

// Clean up old nonces periodically
setInterval(() => {
    usedNonces.clear();
}, SIGNATURE_TIMEOUT);

function verifySignature(message, signature, publicKey) {
    try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = new Uint8Array(signature);
        
        // Convert base58 public key to bytes
        const bs58 = require('bs58');
        const publicKeyBytes = bs58.decode(publicKey);
        
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

async function validateAdminRequest(req, res, next) {
    const { walletAddress, message, signature, timestamp, nonce } = req.body;
    
    // Check if wallet is admin
    if (!walletAddress || walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({ error: 'Access denied: Not an admin wallet' });
    }
    
    // Check timestamp (prevent old signatures)
    const now = Date.now();
    if (!timestamp || Math.abs(now - timestamp) > SIGNATURE_TIMEOUT) {
        return res.status(400).json({ error: 'Request expired or invalid timestamp' });
    }
    
    // Check nonce (prevent replay attacks)
    if (!nonce || usedNonces.has(nonce)) {
        return res.status(400).json({ error: 'Invalid or reused nonce' });
    }
    
    // Verify signature
    if (!verifySignature(message, signature, walletAddress)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Mark nonce as used
    usedNonces.add(nonce);
    
    next();
}

// Apply validation middleware to all admin routes
router.use(validateAdminRequest);

// Use existing automation service methods
router.post('/buildHouse', async (req, res) => {
    try {
        await global.automationService.performBuilding();
        res.json({ message: 'House built successfully' });
    } catch (error) {
        console.error('Failed to build house:', error);
        res.status(500).json({ error: 'Failed to build house' });
    }
});

router.post('/buildApartment', async (req, res) => {
    try {
        await global.automationService.performApartmentBuilding();
        res.json({ message: 'Apartment built successfully' });
    } catch (error) {
        console.error('Failed to build apartment:', error);
        res.status(500).json({ error: 'Failed to build apartment' });
    }
});

router.post('/breeding', async (req, res) => {
    try {
        await global.automationService.performBreeding();
        res.json({ message: 'Breeding initiated successfully' });
    } catch (error) {
        console.error('Failed to initiate breeding:', error);
        res.status(500).json({ error: 'Failed to initiate breeding' });
    }
});

// Add all other routes following the same pattern...
router.post('/plantTree', async (req, res) => {
    try {
        await global.automationService.performPlantTree();
        res.json({ message: 'Tree planted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to plant tree' });
    }
});

router.post('/buildFirepit', async (req, res) => {
    try {
        await global.automationService.performBuildFirepit();
        res.json({ message: 'Firepit built successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to build firepit' });
    }
});

router.post('/discoverBones', async (req, res) => {
    try {
        await global.automationService.performDiscoverBones();
        res.json({ message: 'Bones discovered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to discover bones' });
    }
});

router.post('/dropEgg', async (req, res) => {
    try {
        await global.automationService.performDropEgg();
        res.json({ message: 'Egg dropped successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to drop egg' });
    }
});

router.post('/crashUFO', async (req, res) => {
    try {
        await global.automationService.performCrashUFO();
        res.json({ message: 'UFO crashed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to crash UFO' });
    }
});

router.post('/death', async (req, res) => {
    try {
        await global.automationService.performDeath();
        res.json({ message: 'Lightning strike executed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to execute lightning strike' });
    }
});

router.post('/fire', async (req, res) => {
    try {
        await global.automationService.performFire();
        res.json({ message: 'Fire executed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to execute fire' });
    }
});

router.post('/rain', async (req, res) => {
    try {
        await global.automationService.triggerRainEvent();
        res.json({ message: 'Rain triggered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger rain' });
    }
});

router.post('/tornado', async (req, res) => {
    try {
        await global.automationService.triggerTornadoEvent();
        res.json({ message: 'Tornado triggered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger tornado' });
    }
});

router.post('/snow', async (req, res) => {
    try {
        await global.automationService.triggerSnowEvent();
        res.json({ message: 'Snow triggered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger snow' });
    }
});

module.exports = router;
