const admin = require('firebase-admin');

class AutomationService {
    constructor() {
    // Firebase Admin should already be initialized in server.js
    if (!admin.apps.length) {
        throw new Error('Firebase Admin not initialized. Make sure server.js initializes it first.');
    }

    // KEEP all your actions array exactly as it was
    this.actions = [
        { name: 'buildHouse', weight: 8, method: this.performBuilding.bind(this) },
        { name: 'buildApartment', weight: 1, method: this.performApartmentBuilding.bind(this) },
        { name: 'plantTree', weight: 50, method: this.performPlantTree.bind(this) },
        { name: 'buildFirepit', weight: 20, method: this.performBuildFirepit.bind(this) },
        { name: 'breeding', weight: 45, method: this.performBreeding.bind(this) },
        { name: 'rain', weight: 5, method: this.triggerRainEvent.bind(this) },
        { name: 'tornado', weight: 2, method: this.triggerTornadoEvent.bind(this) },
        { name: 'snow', weight: 2, method: this.triggerSnowEvent.bind(this) }
    ];

    this.db = admin.firestore();
    this.auth = admin.auth();
    this.isRunning = false;
    this.currentTimeout = null;
    this.nextActionTime = null;
    this.actionDuration = 0;

    // Remove complex authentication - Firebase Admin SDK works directly
    console.log('AutomationService initialized with Firebase Admin SDK');
    
    // Initialize server stats
    this.initializeServerStats();
}

    async initializeAuth() {
        try {
            // Create a custom token for the automation service with admin claims
            this.customToken = await this.auth.createCustomToken('automation-service', {
                admin: true,
                service: 'automation'
            });
            
            console.log('Automation service authenticated with admin privileges');
        } catch (error) {
            console.error('Failed to create automation service token:', error);
        }
    }

    async initializeServerStats() {
    try {
        const statsDocRef = this.db.collection('serverStats').doc('global');
        const statsDoc = await statsDocRef.get();
        
        if (!statsDoc.exists) {
            console.log('Creating initial server stats document...');
            await statsDocRef.set({
                happiness: 50,
                sentience: 50,
                mysteries: 0,
                created: admin.firestore.FieldValue.serverTimestamp(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('Initial server stats created');
        }
    } catch (error) {
        console.error('Error initializing server stats:', error);
    }
}

start() {
    if (this.isRunning) {
        console.log('Automation service already running');
        return;
    }

    this.isRunning = true;
    console.log('Starting automation service...');
    this.scheduleNextAction();
}

    start() {
        if (this.isRunning) {
            console.log('Automation service already running');
            return;
        }

        this.isRunning = true;
        console.log('Starting automation service...');
        this.scheduleNextAction();
    }

    stop() {
        this.isRunning = false;
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        console.log('Automation service stopped');
    }

    getTimeUntilNextAction() {
        if (!this.nextActionTime || !this.isRunning) return 0;
        const now = Date.now();
        return Math.max(0, this.nextActionTime - now);
    }

    getTotalActionTime() {
        return this.actionDuration;
    }

scheduleNextAction() {
    if (!this.isRunning) return;
    
    // Random delay between 1-3 minutes (60000ms - 180000ms)
    const delay = Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000;
    this.actionDuration = delay;
    this.nextActionTime = Date.now() + delay;
    
    const minutes = Math.round(delay / 60000 * 10) / 10;
    console.log(`Next automated action scheduled in ${minutes} minutes`);
    this.currentTimeout = setTimeout(() => {
        this.executeRandomAction();
        this.scheduleNextAction(); // Schedule the next one
    }, delay);
}

    executeRandomAction() {
        const selectedAction = this.selectWeightedAction();
        console.log(`Executing automated action: ${selectedAction.name}`);
        
        try {
            selectedAction.method();
        } catch (error) {
            console.error(`Error executing automated action ${selectedAction.name}:`, error);
        }
    }

    selectWeightedAction() {
        const totalWeight = this.actions.reduce((sum, action) => sum + action.weight, 0);
        let random = Math.random() * totalWeight;

        for (const action of this.actions) {
            random -= action.weight;
            if (random <= 0) {
                return action;
            }
        }

        // Fallback to first action if something goes wrong
        return this.actions[0];
    }

    // Helper method to get virtual world size (matches client-side logic)
    getVirtualWorldSize() {
        // Using same logic as client - 150% of a standard viewport
        const viewportWidth = 1600; // Standard desktop width
        const viewportHeight = 900; // Standard desktop height
        
        return {
            width: viewportWidth * 1.5,
            height: viewportHeight * 1.5
        };
    }

    // Helper method to find valid house position
    async findValidHousePosition() {
        const worldSize = this.getVirtualWorldSize();
        const houseWidth = 126;
        const houseHeight = 120;
        const edgeBuffer = 25;
        
        // Get existing houses and apartments to avoid collisions
        const housesSnapshot = await this.db.collection('houses').get();
        const apartmentsSnapshot = await this.db.collection('apartments').get();
        
        const existingBuildings = [];
        housesSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 126, height: 120 });
        });
        apartmentsSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 156, height: 213 });
        });

        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * (worldSize.width - houseWidth - edgeBuffer * 2) + edgeBuffer;
            const y = Math.random() * (worldSize.height - houseHeight - edgeBuffer * 2) + edgeBuffer;
            
            // Check for collisions
            let validPosition = true;
            for (const building of existingBuildings) {
                const buffer = 10;
                const dx = Math.abs(x - building.x);
                const dy = Math.abs(y - building.y);
                const combinedBufferX = (houseWidth + building.width) / 2 + buffer;
                const combinedBufferY = (houseHeight + building.height) / 2 + buffer;
                
                if (dx < combinedBufferX && dy < combinedBufferY) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            attempts++;
        }
        
        // Fallback position if no valid position found
        return {
            x: Math.random() * (worldSize.width - houseWidth),
            y: Math.random() * (worldSize.height - houseHeight)
        };
    }

    // Helper method to find valid apartment position
    async findValidApartmentPosition() {
        const worldSize = this.getVirtualWorldSize();
        const apartmentWidth = 156;
        const apartmentHeight = 213;
        const edgeBuffer = 25;
        
        // Get existing houses and apartments
        const housesSnapshot = await this.db.collection('houses').get();
        const apartmentsSnapshot = await this.db.collection('apartments').get();
        
        const existingBuildings = [];
        housesSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 126, height: 120 });
        });
        apartmentsSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 156, height: 213 });
        });

        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * (worldSize.width - apartmentWidth - edgeBuffer * 2) + edgeBuffer;
            const y = Math.random() * (worldSize.height - apartmentHeight - edgeBuffer * 2) + edgeBuffer;
            
            // Check for collisions
            let validPosition = true;
            for (const building of existingBuildings) {
                const buffer = 10;
                const dx = Math.abs(x - building.x);
                const dy = Math.abs(y - building.y);
                const combinedBufferX = (apartmentWidth + building.width) / 2 + buffer;
                const combinedBufferY = (apartmentHeight + building.height) / 2 + buffer;
                
                if (dx < combinedBufferX && dy < combinedBufferY) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            attempts++;
        }
        
        return {
            x: Math.random() * (worldSize.width - apartmentWidth),
            y: Math.random() * (worldSize.height - apartmentHeight)
        };
    }

    // Helper method to find valid tree position
    async findValidTreePosition() {
        const worldSize = this.getVirtualWorldSize();
        const treeWidth = 39;
        const treeHeight = 69;
        const houseBuffer = 25;
        
        // Get existing houses to avoid placing trees too close
        const housesSnapshot = await this.db.collection('houses').get();
        const apartmentsSnapshot = await this.db.collection('apartments').get();
        
        const existingBuildings = [];
        housesSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 126, height: 120 });
        });
        apartmentsSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 156, height: 213 });
        });

        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * (worldSize.width - treeWidth);
            const y = Math.random() * (worldSize.height - treeHeight);
            
            let validPosition = true;
            for (const building of existingBuildings) {
                const dx = Math.abs(x - building.x);
                const dy = Math.abs(y - building.y);
                
                if (dx < (building.width + treeWidth) / 2 + houseBuffer && 
                    dy < (building.height + treeHeight) / 2 + houseBuffer) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            attempts++;
        }
        
        return {
            x: Math.random() * (worldSize.width - treeWidth),
            y: Math.random() * (worldSize.height - treeHeight)
        };
    }

    async findValidFirepitPosition() {
        const worldSize = this.getVirtualWorldSize();
        const firepitWidth = 48;
        const firepitHeight = 54;
        const edgeBuffer = 25;
        
        // Get existing buildings to avoid collisions
        const housesSnapshot = await this.db.collection('houses').get();
        const apartmentsSnapshot = await this.db.collection('apartments').get();
        const firepitsSnapshot = await this.db.collection('firepits').get();
        
        const existingBuildings = [];
        housesSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 126, height: 120 });
        });
        apartmentsSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 156, height: 213 });
        });
        firepitsSnapshot.forEach(doc => {
            const data = doc.data();
            existingBuildings.push({ x: data.x, y: data.y, width: 48, height: 54 });
        });

        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * (worldSize.width - firepitWidth - edgeBuffer * 2) + edgeBuffer;
            const y = Math.random() * (worldSize.height - firepitHeight - edgeBuffer * 2) + edgeBuffer;
            
            // Check for collisions
            let validPosition = true;
            for (const building of existingBuildings) {
                const buffer = 10;
                const dx = Math.abs(x - building.x);
                const dy = Math.abs(y - building.y);
                const combinedBufferX = (firepitWidth + building.width) / 2 + buffer;
                const combinedBufferY = (firepitHeight + building.height) / 2 + buffer;
                
                if (dx < combinedBufferX && dy < combinedBufferY) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            attempts++;
        }
        
        // Fallback position if no valid position found
        return {
            x: Math.random() * (worldSize.width - firepitWidth),
            y: Math.random() * (worldSize.height - firepitHeight)
        };
    }

    // Action implementations
    async performBuilding() {
        try {
            const position = await this.findValidHousePosition();
            const houseId = 'house_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const houseType = 'house1';
            const buildingEventId = `building-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
            
            // Create house document
            const house = {
                id: houseId,
                x: position.x,
                y: position.y,
                type: houseType,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: buildingEventId
            };
            
            // Create both house and feed entry
            const batch = this.db.batch();
            batch.set(this.db.collection('houses').doc(houseId), house);
            batch.set(this.db.collection('feed').doc(buildingEventId), {
                title: 'House Built',
                description: 'A new house has been constructed! The settlement grows stronger.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'building',
                houseId: houseId,
                eventId: buildingEventId
            });
            
            await batch.commit();
            console.log('Automated house building completed:', houseId);
            
        } catch (error) {
            console.error('Failed to perform automated building:', error);
        }
    }

    async performApartmentBuilding() {
        try {
            const position = await this.findValidApartmentPosition();
            const apartmentId = 'apartment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const apartmentType = 'apartment1';
            const buildingEventId = `apartment-building-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
            
            const apartment = {
                id: apartmentId,
                x: position.x,
                y: position.y,
                type: apartmentType,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: buildingEventId
            };
            
            const batch = this.db.batch();
            batch.set(this.db.collection('apartments').doc(apartmentId), apartment);
            batch.set(this.db.collection('feed').doc(buildingEventId), {
                title: 'Apartment Built',
                description: 'A new apartment building has been constructed! The settlement grows ever taller.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'apartment-building',
                apartmentId: apartmentId,
                eventId: buildingEventId
            });
            
            await batch.commit();
            console.log('Automated apartment building completed:', apartmentId);
            
        } catch (error) {
            console.error('Failed to perform automated apartment building:', error);
        }
    }

    async performBuildFirepit() {
        try {
            const position = await this.findValidFirepitPosition();
            const firepitId = 'firepit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const firepitType = 'firepit1';
            const firepitEventId = `firepit-build-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
            
            // Create firepit document
            const firepit = {
                id: firepitId,
                x: position.x,
                y: position.y,
                type: firepitType,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: firepitEventId
            };
            
            // Create both firepit and feed entry
            const batch = this.db.batch();
            batch.set(this.db.collection('firepits').doc(firepitId), firepit);
            batch.set(this.db.collection('feed').doc(firepitEventId), {
                title: 'Firepit Built',
                description: 'A cozy firepit has been constructed! Warm flames dance and smoke rises into the sky.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'buildfirepit',
                firepitId: firepitId,
                eventId: firepitEventId
            });
            
            await batch.commit();
            console.log('Automated firepit building completed:', firepitId);
            
        } catch (error) {
            console.error('Failed to perform automated firepit building:', error);
        }
    }

    async performPlantTree() {
        try {
            const position = await this.findValidTreePosition();
            const treeId = 'tree_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const treeTypes = ['tree1', 'tree2'];
            const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            const plantingEventId = `planting-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
            
            const tree = {
                id: treeId,
                x: position.x,
                y: position.y,
                type: treeType,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: plantingEventId
            };
            
            const batch = this.db.batch();
            batch.set(this.db.collection('trees').doc(treeId), tree);
            batch.set(this.db.collection('feed').doc(plantingEventId), {
                title: 'Tree Planted',
                description: 'A beautiful tree has been planted! Nature flourishes in the world.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'planttree',
                treeId: treeId,
                eventId: plantingEventId
            });
            
            await batch.commit();
            console.log('Automated tree planting completed:', treeId);
            
        } catch (error) {
            console.error('Failed to perform automated tree planting:', error);
        }
    }

    async performDiscoverBones() {
        try {
            const worldSize = this.getVirtualWorldSize();
            const boneWidth = 60;
            const boneHeight = 40;
            
            const x = Math.random() * (worldSize.width - boneWidth);
            const y = Math.random() * (worldSize.height - boneHeight);
            
            const boneId = 'bone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const boneTypes = ['bones1', 'bones2'];
            const boneType = boneTypes[Math.floor(Math.random() * boneTypes.length)];
            const discoveryEventId = `bone-discovery-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
            
            const bone = {
                id: boneId,
                x: x,
                y: y,
                type: boneType,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: discoveryEventId
            };
            
            const batch = this.db.batch();
            batch.set(this.db.collection('bones').doc(boneId), bone);
            batch.set(this.db.collection('feed').doc(discoveryEventId), {
                title: 'Ancient Bones Discovered!',
                description: 'Mysterious ancient bones have been unearthed! What secrets do they hold?',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'discoverbones',
                boneId: boneId,
                eventId: discoveryEventId
            });
            
            await batch.commit();
            console.log('Automated bone discovery completed:', boneId);
            
        } catch (error) {
            console.error('Failed to discover bones:', error);
        }
    }

    async performDropEgg() {
        try {
            const worldSize = this.getVirtualWorldSize();
            const eggWidth = 48;
            const eggHeight = 48;
            
            const targetX = Math.random() * (worldSize.width - eggWidth);
            const targetY = Math.random() * (worldSize.height - eggHeight);
            
            const eggEventId = `egg-drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const eggId = 'egg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Create the egg drop action for animation
            await this.db.collection('actions').add({
                type: 'dropegg',
                targetX: targetX,
                targetY: targetY,
                eggId: eggId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: eggEventId
            });
            
            // Create the permanent egg document
            await this.db.collection('eggs').doc(eggId).set({
                id: eggId,
                x: targetX,
                y: targetY,
                type: 'egg',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: eggEventId
            });
            
            // Create feed entry immediately
            await this.db.collection('feed').doc(`egg-drop-${eggEventId}`).set({
                title: 'Egg Dropped!',
                description: 'A mysterious egg has fallen from the sky! What could be inside?',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'dropegg',
                eventId: eggEventId,
                eggId: eggId
            });
            
            console.log('Automated egg drop triggered with event ID:', eggEventId);
            
        } catch (error) {
            console.error('Failed to drop egg:', error);
        }
    }

    async performCrashUFO() {
        try {
            const worldSize = this.getVirtualWorldSize();
            const ufoWidth = 84;
            const ufoHeight = 51;
            
            const targetX = Math.random() * (worldSize.width - ufoWidth);
            const targetY = Math.random() * (worldSize.height - ufoHeight);
            
            const ufoEventId = `ufo-crash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const ufoId = 'ufo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Create the UFO crash action for animation
            await this.db.collection('actions').add({
                type: 'crashufo',
                targetX: targetX,
                targetY: targetY,
                ufoId: ufoId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: ufoEventId
            });
            
            // Create the permanent UFO document
            await this.db.collection('ufos').doc(ufoId).set({
                id: ufoId,
                x: targetX,
                y: targetY,
                type: 'crashed',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                eventId: ufoEventId
            });
            
            // Create feed entry immediately
            await this.db.collection('feed').doc(`ufo-crash-${ufoEventId}`).set({
                title: 'UFO CRASH!',
                description: 'A mysterious UFO has crashed from the sky! Smoke billows from the wreckage.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'crashufo',
                eventId: ufoEventId,
                ufoId: ufoId
            });
            
            console.log('Automated UFO crash triggered with event ID:', ufoEventId);
            
        } catch (error) {
            console.error('Failed to crash UFO:', error);
        }
    }

async performBreeding() {
    try {
        console.log('Automation service auth token:', this.customToken ? 'EXISTS' : 'MISSING');
        // Get all existing throngs
        const throngsSnapshot = await this.db.collection('throngs').get();
        const throngs = [];
        throngsSnapshot.forEach(doc => {
            throngs.push({ id: doc.id, ...doc.data() });
        });

        if (throngs.length < 2) {
            console.log('Not enough throngs for breeding (need at least 2)');
            
            // Create feed entry about breeding failure
            await this.db.collection('feed').add({
                title: 'Breeding Failed',
                description: 'You need at least 2 throngs to start breeding!',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'breeding'
            });
            return;
        }

        // Select two random parents
        const shuffled = throngs.sort(() => 0.5 - Math.random());
        const parent1 = shuffled[0];
        const parent2 = shuffled[1];

        // Generate completely random meeting point anywhere on the map
        const worldSize = this.getVirtualWorldSize();
        const edgeBuffer = 100; // Keep away from edges
        
        const meetingX = edgeBuffer + Math.random() * (worldSize.width - edgeBuffer * 2);
        const meetingY = edgeBuffer + Math.random() * (worldSize.height - edgeBuffer * 2);

        const newThrongId = 'throng_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const sortedParentIds = [parent1.id, parent2.id].sort();
        const breedingEventId = `breeding-${sortedParentIds[0]}-${sortedParentIds[1]}-${Date.now()}`;

// Generate AI traits server-side using Claude API
let traits = ['Mysterious', 'Curious', 'Brave']; // Fallback

try {
    console.log('=== AUTOMATION SERVICE TRAIT GENERATION ===');
    console.log('Attempting to call Claude API...');
    
    // Since the automation service runs on the same server as the API,
    // we can call it internally using localhost
    const apiUrl = 'http://localhost:3000/api/claude/generate-traits';
    
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', JSON.stringify(data, null, 2));
        
        if (data.traits && Array.isArray(data.traits) && data.traits.length === 3) {
            traits = data.traits;
            console.log('✅ Successfully generated AI traits:', traits);
        } else {
            console.log('❌ Invalid API response format, using fallback traits');
            console.log('Expected: {traits: [string, string, string]}');
            console.log('Received:', data);
        }
    } else {
        const errorText = await response.text();
        console.log('❌ API call failed with status:', response.status);
        console.log('Error response:', errorText);
    }
} catch (error) {
    console.error('❌ Exception calling Claude API:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
}

console.log('Final traits being used:', traits);
console.log('=== END TRAIT GENERATION DEBUG ===');

        // Create breeding action
        await this.db.collection('actions').add({
            type: 'breeding',
            parent1Id: parent1.id,
            parent2Id: parent2.id,
            newThrongId: newThrongId,
            meetingX: meetingX,
            meetingY: meetingY,
            parent1StartX: parent1.x,
            parent1StartY: parent1.y,
            parent2StartX: parent2.x,
            parent2StartY: parent2.y,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            eventId: breedingEventId,
            preGeneratedTraits: traits // Pass the generated traits
        });

        // Create breeding notification
        await this.db.collection('feed').doc(`breeding-start-${breedingEventId}`).set({
            title: 'Breeding',
            description: 'Two Emulites have found love! They are coming together to begin breeding.',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            action: 'breeding',
            eventId: breedingEventId
        });

        // After creating the breeding action, schedule the throng creation server-side
        setTimeout(async () => {
            try {
                console.log('Starting server-side throng creation for:', newThrongId);
                console.log('Using traits:', traits);
                
                const worldSize = this.getVirtualWorldSize();
                const offsetDistance = 60;
                const angle = Math.random() * 2 * Math.PI;
                const babyX = meetingX + Math.cos(angle) * offsetDistance;
                const babyY = meetingY + Math.sin(angle) * offsetDistance;
                
                const finalBabyX = Math.max(0, Math.min(worldSize.width - 48, babyX));
                const finalBabyY = Math.max(0, Math.min(worldSize.height - 48, babyY));

                const newThrong = {
                    id: newThrongId,
                    x: finalBabyX,
                    y: finalBabyY,
                    currentSprite: 'idle',
                    direction: 'down',
                    animationFrame: 0,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    traits: traits // Use the AI-generated traits
                };

                // Create throng first
                await this.db.collection('throngs').doc(newThrongId).set(newThrong);
                console.log('Throng created successfully with traits:', traits);
                
                // Create birth feed entry
                await this.db.collection('feed').doc(`birth-${newThrongId}`).set({
                    title: 'Birth',
                    description: 'A new Emulite has been born! The group grows with this precious new life.',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    action: 'birth',
                    throngId: newThrongId
                });
                console.log('Birth feed entry created successfully');
                
                console.log('Server-side throng creation completed successfully:', newThrongId);
                
            } catch (error) {
                console.error('Failed to create throng server-side:', error);
                console.error('Error details:', error.message);
            }
        }, 15000); // Wait 15 seconds for breeding animation to complete

        console.log('Automated breeding initiated:', breedingEventId);

    } catch (error) {
        console.error('Failed to perform automated breeding:', error);
    }
}

    async performDeath() {
        // This method can remain the same as it was in your original code
        // Only adding it here for completeness if it was missing
        console.log('performDeath called but not implemented in automation service');
    }

    async performFire() {
        // This method can remain the same as it was in your original code
        // Only adding it here for completeness if it was missing
        console.log('performFire called but not implemented in automation service');
    }

    async triggerRainEvent() {
        try {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 180000); // 3 minutes from now

            // Create weather document
            await this.db.collection('weather').add({
                type: 'rain',
                title: 'Thunderstorm!',
                description: 'Dark clouds gather overhead as a mighty thunderstorm rolls in! Rain pours down across the land, nourishing the earth and bringing life to all creatures.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                startTime: startTime,
                endTime: endTime,
                active: true
            });

            // Also add to main feed
            await this.db.collection('feed').add({
                title: 'Thunderstorm!',
                description: 'Dark clouds gather overhead as a mighty thunderstorm rolls in! Rain pours down across the land.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'weather'
            });

            console.log('Automated rain event triggered');

        } catch (error) {
            console.error('Failed to trigger automated rain event:', error);
        }
    }

    async triggerTornadoEvent() {
        try {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 180000); // 3 minutes from now

            await this.db.collection('weather').add({
                type: 'tornado',
                title: 'Sand Storm Warning!',
                description: 'A massive sand storm tears across the landscape! Powerful winds whip dust and debris through the air.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                startTime: startTime,
                endTime: endTime,
                active: true
            });

            await this.db.collection('feed').add({
                title: 'Sand Storm Warning!',
                description: 'A massive sand storm tears across the landscape! Powerful winds whip dust and debris through the air.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'weather'
            });

            console.log('Automated sand storm event triggered');

        } catch (error) {
            console.error('Failed to trigger automated sand storm event:', error);
        }
    }

    async triggerSnowEvent() {
        try {
            // Check if snow is already active
            const weatherSnapshot = await this.db.collection('weather').get();
            let snowAlreadyActive = false;
            
            weatherSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'snow' && data.active) {
                    snowAlreadyActive = true;
                }
            });
            
            if (snowAlreadyActive) {
                console.log('Snow event already active, skipping automated snow');
                return;
            }

            const snowEventId = `snow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 180000);

            // Create weather document
            await this.db.collection('weather').add({
                type: 'snow',
                title: 'Blizzard Alert!',
                description: 'A fierce blizzard sweeps through the world! Thick snowflakes dance through the air as winter shows its magnificent power.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                startTime: startTime,
                endTime: endTime,
                active: true,
                eventId: snowEventId
            });

            // Create blizzard feed entry
            await this.db.collection('feed').doc(`blizzard-${snowEventId}`).set({
                title: 'Blizzard Alert!',
                description: 'A fierce blizzard sweeps through the world! Thick snowflakes dance through the air as winter shows its power.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                action: 'weather',
                eventId: snowEventId
            });

            // Pick a random throng to freeze to death if any exist
            const throngsSnapshot = await this.db.collection('throngs').get();
            if (!throngsSnapshot.empty) {
                const throngs = [];
                throngsSnapshot.forEach(doc => {
                    throngs.push({ id: doc.id, ...doc.data() });
                });

                if (throngs.length > 0) {
                    const victim = throngs[Math.floor(Math.random() * throngs.length)];

                    // Create freeze action
                    await this.db.collection('actions').add({
                        type: 'freeze',
                        victimId: victim.id,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        eventId: snowEventId
                    });

                    // Create freeze death feed entry
                    await this.db.collection('feed').doc(`freeze-death-${snowEventId}`).set({
                        title: 'FROZEN TO DEATH!',
                        description: 'The bitter cold claims a victim! An Emulite has frozen solid in the blizzard.',
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        action: 'freeze',
                        eventId: snowEventId
                    });
                }
            }

            console.log('Automated snow event triggered with freeze death:', snowEventId);

        } catch (error) {
            console.error('Failed to trigger automated snow event:', error);
        }
    }
}

module.exports = AutomationService;
