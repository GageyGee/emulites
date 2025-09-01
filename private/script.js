import { 
    collection, 
    addDoc, 
    onSnapshot, 
    doc,
    getDoc,
    setDoc, 
    deleteDoc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    runTransaction
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

class ThronsGame {
    constructor() {
        this.db = window.db;
        
        if (!this.db) {
            setTimeout(() => {
                this.db = window.db;
                if (this.db) {
                    this.initializeGame();
                }
            }, 100);
            return;
        }
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.throngs = new Map();
        this.houses = new Map();
        this.apartments = new Map();
        this.trees = new Map();
        this.eggs = new Map();
        this.ufos = new Map();
        this.bones = new Map();
        this.firepits = new Map();
        this.worldArea = document.getElementById('worldArea');
        this.worldContainer = document.getElementById('worldContainer');
        this.chooseActionBtn = document.getElementById('chooseActionBtn');
        this.actionDropdown = document.getElementById('actionDropdown');
        this.callActionBtn = document.getElementById('callActionBtn');
        this.activityFeed = document.getElementById('activityFeed');
        this.serverStatsContainer = document.getElementById('serverStatsContainer');
        this.connectWalletBtn = document.getElementById('connectWalletBtn');
        this.tokenBalanceEl = document.getElementById('tokenBalance');
        this.throngBalanceContainer = document.getElementById('throngBalanceContainer');
        this.currentHighlightedElement = null;
        this.processedBreedingActions = new Set();
        this.processedBuildingActions = new Set();
        this.feedLimit = 50;
        this.feedLastDoc = null;
        this.feedItems = [];
        this.feedUnsubscribe = null;
        this.lastSnowEventTime = 0;
        this.lastFireEventTime = 0;
        this.lastDeathEventTime = 0;
        this.initialHouseLoadComplete = false;
        this.initialApartmentLoadComplete = false;
        this.initialTreeLoadComplete = false;
        this.initialBoneLoadComplete = false;
        this.initialFirepitLoadComplete = false;
        this.isHudVisible = true;
        this.hudToggleBtn = document.getElementById('hudToggleBtn');
        this.hudToggleBtn = document.getElementById('hudToggleBtn');
        this.automationStatusContainer = null;
        this.automationStatusText = null;
        this.automationDots = null;
        this.automationInterval = null;
        this.dotAnimationInterval = null;
        this.currentPhase = '';
        this.automationTimeRemaining = 0;
        this.automationTotalTime = 0;
        // CA Display elements
        this.caContainer = document.getElementById('caContainer');
        this.caText = document.getElementById('caText');
        this.walletSocialContainer = document.getElementById('walletSocialContainer');
        this.viewJournalsContainer = document.getElementById('viewJournalsContainer');
        this.documentationContainer = document.getElementById('documentationBtn');
        this.journals = new Map(); // Store journal entries
        this.journalInterface = null; // Journal UI reference
        this.documentationInterface = null;

        // Use your existing THRONG_TOKEN_MINT as the contract address
        this.getContractAddress = () => {
        return this.THRONG_TOKEN_MINT || 'B9iPvm8YybydhvMiKAuJuygEKuzspgxdavhFNzzUpump';
};
        
this.serverStats = {
    happiness: null, // Will be loaded from Firebase
    sentience: null, // Will be loaded from Firebase
    population: 0,
    mysteries: null, // Will be loaded from Firebase
    stats24h: {
        throngsBirthed: 0,
        throngsDead: 0,
        housesBuilt: 0,
        housesLost: 0,
        treesPlanted: 0,
        treesLost: 0,
        weatherChanges: 0
    }
};
        this.statsElements = {
    happiness: document.getElementById('happinessBar'),
    happinessText: document.getElementById('happinessText'),
    sentience: document.getElementById('sentienceBar'),
    sentienceText: document.getElementById('sentienceText'),
    population: document.getElementById('populationValue'),
    mysteries: document.getElementById('mysteriesValue'),
    throngsBirthed24h: document.getElementById('throngsBirthed24h'),
    throngsDead24h: document.getElementById('throngsDead24h'),
    housesBuilt24h: document.getElementById('housesBuilt24h'),
    housesLost24h: document.getElementById('housesLost24h'),
    treesPlanted24h: document.getElementById('treesPlanted24h'),
    treesLost24h: document.getElementById('treesLost24h'),
    weatherChanges24h: document.getElementById('weatherChanges24h')
};
        
        if (!this.worldArea || !this.worldContainer) return;
        
        // Wallet and Solana setup - real implementation
        this.wallet = null;
        this.connection = null;
        // Use the correct token from solana-config.js
        this.THRONG_TOKEN_MINT = window.SOLANA_CONFIG?.THRONG_TOKEN_MINT || 'B9iPvm8YybydhvMiKAuJuygEKuzspgxdavhFNzzUpump';
        this.ADMIN_WALLET = 'sDoTsdt9QPDMcJg2u9kATMxsh8FVboz4eoTrxTvibqB';
        this.RPC_URL = window.SOLANA_CONFIG?.RPC_URL || 'https://radial-chaotic-pool.solana-mainnet.quiknode.pro/192e8e76f0a288f5a32ace0b676f7f34778f219f/';
        this.BURN_ADDRESS = window.SOLANA_CONFIG?.BURN_ADDRESS || '1nc1nerator11111111111111111111111111111111';
        this.tokenBalance = 0;
        this.isNamingMode = false;
        this.selectedThrong = null;
        this.solanaLoaded = false;
        
        this.actions = ['Building', 'Breeding', 'Death', 'Fire'];
        
        this.loadThrongPositions();
        
        setInterval(() => {
            this.saveThrongPositions();
        }, 5000);
        
        this.sprites = {
            idle: window.SPRITES?.idle || '/api/sprites/idle.png',
            lookleft: window.SPRITES?.lookleft || '/api/sprites/lookleft.png',
            lookright: window.SPRITES?.lookright || '/api/sprites/lookright.png',
            lookup: window.SPRITES?.lookup || '/api/sprites/lookup.png',
            sitleft: window.SPRITES?.sitleft || '/api/sprites/sitleft.png',
            sitright: window.SPRITES?.sitright || '/api/sprites/sitright.png',
            walkingdown: [
                window.SPRITES?.walkingdown1 || '/api/sprites/walkingdown1.png', 
                window.SPRITES?.walkingdown2 || '/api/sprites/walkingdown2.png'
            ],
            walkingleft: [
                window.SPRITES?.walkingleft1 || '/api/sprites/walkingleft1.png', 
                window.SPRITES?.walkingleft2 || '/api/sprites/walkingleft2.png'
            ],
            walkingright: [
                window.SPRITES?.walkingright1 || '/api/sprites/walkingright1.png', 
                window.SPRITES?.walkingright2 || '/api/sprites/walkingright2.png'
            ],
            walkingup: [
                window.SPRITES?.walkingup1 || '/api/sprites/walkingup1.png', 
                window.SPRITES?.walkingup2 || '/api/sprites/walkingup2.png'
            ]
        };

        // Add this new section for egg sprites
this.eggSprites = {
    egg: window.SPRITES?.egg || '/api/sprites/egg.png'
};

// Add UFO sprites
this.ufoSprites = {
    ufo1: window.SPRITES?.ufo1 || '/api/sprites/ufo1.png',
    ufo2: window.SPRITES?.ufo2 || '/api/sprites/ufo2.png'
};
        
        this.houseSprites = {
            house1: window.SPRITES?.house1 || '/api/sprites/house1.png'
        };

        this.apartmentSprites = {
    apartment1: window.SPRITES?.apartment1 || '/api/sprites/apartment.png'
};
        
        this.treeSprites = {
            tree1: window.SPRITES?.tree1 || '/api/sprites/tree1.png',
            tree2: window.SPRITES?.tree2 || '/api/sprites/tree2.png'
        };

        this.boneSprites = {
    bones1: window.SPRITES?.bones1 || '/api/sprites/bones1.png',
    bones2: window.SPRITES?.bones2 || '/api/sprites/bones2.png'
};
        // Add this after the boneSprites definition
this.firepitSprites = {
    firepit1: window.SPRITES?.fire1 || '/api/sprites/fire1.png',
    firepit2: window.SPRITES?.fire2 || '/api/sprites/fire2.png', 
    firepit3: window.SPRITES?.fire3 || '/api/sprites/fire3.png'
};
        this.effectSprites = {
            lightning: window.SPRITES?.lightning || '/api/sprites/lightning.png',
            love: window.SPRITES?.love || '/api/sprites/love.png'
        };
        
        this.grassColors = [
            '#468819', '#60a22f', '#438511', '#438511', '#3e7a15', '#47831e'
        ];
        
        this.newHouses = new Set();
        this.newApartments = new Set();
        this.newTrees = new Set();
        this.newBones = new Set();
        this.newFirepits = new Set();
        this.newThrongs = new Set();
        this.newEggs = new Set();
        this.newUFOs = new Set();
        this.animatingUFOs = new Set(); // Track UFOs currently being animated
        this.animatingEggs = new Set();
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.cameraOffset = { x: 0, y: 0 };
        this.zoomLevel = 1.0;
        this.minZoom = 0.7;
        this.maxZoom = 4.0;
        
        this.init();
    }
    
async initializeServerStats() {
    // Load stats from Firebase FIRST
    await this.loadServerStats();
    
    // Update UI with loaded stats
    this.updateServerStatsUI();
    
    // THEN start listening for changes
    this.listenToServerStats();
    
    // Calculate 24h stats
    await this.calculate24hStats();
    
    // Set up interval to recalculate 24h stats every 5 minutes
    setInterval(() => {
        this.calculate24hStats();
    }, 300000); // 5 minutes
}

    async initializeAutomationStatus() {
    this.automationStatusContainer = document.getElementById('automationStatusContainer');
    this.automationStatusText = document.getElementById('automationStatusText');
    this.automationDots = document.getElementById('automationDots');
    
    // Start polling for automation status
    this.startAutomationStatusPolling();
    
    // Start dot animation immediately
    this.startDotAnimation();
}

startAutomationStatusPolling() {
    // Poll every 1 second for smooth updates
    this.automationInterval = setInterval(async () => {
        await this.updateAutomationStatus();
    }, 1000);
    
    // Initial update
    this.updateAutomationStatus();
}

async updateAutomationStatus() {
    try {
        const response = await fetch('/api/automation/next-action');
        const data = await response.json();
        
        if (data.isActive && data.timeRemaining > 0 && data.totalTime > 0) {
            this.automationTimeRemaining = data.timeRemaining;
            this.automationTotalTime = data.totalTime;
            this.updateAutomationPhase();
        } else {
            // Show idle state when no automation is running
            this.showIdleState();
        }
    } catch (error) {
        console.error('Error fetching automation status:', error);
        this.showIdleState();
    }
}

showIdleState() {
    if (this.automationStatusText) {
        this.currentPhase = 'idle';
        this.automationStatusText.innerHTML = `Idle<span class="dots" id="automationDots">.</span>`;
        this.automationDots = document.getElementById('automationDots');
        this.automationStatusText.className = 'automation-status-text idle';
    }
}

updateAutomationPhase() {
    if (!this.automationStatusText || this.automationTotalTime === 0) return;
    
    const elapsed = this.automationTotalTime - this.automationTimeRemaining;
    const progress = elapsed / this.automationTotalTime;
    
    let phase = '';
    let phaseClass = '';
    
    if (progress < 0.4) {
        phase = 'Thinking';
        phaseClass = 'thinking';
    } else if (progress < 0.7) {
        phase = 'Preparing';
        phaseClass = 'preparing';
    } else if (progress < 0.9) {
        phase = 'Plotting';
        phaseClass = 'plotting';
    } else {
        phase = 'Deploying';
        phaseClass = 'deploying';
    }
    
if (this.currentPhase !== phase) {
    this.currentPhase = phase;
    
    // Update text content
    this.automationStatusText.innerHTML = `${phase}<span class="dots" id="automationDots"></span>`;
    this.automationDots = document.getElementById('automationDots');
    
    // Update CSS class
    this.automationStatusText.className = `automation-status-text ${phaseClass}`;
    
    // Restart dot animation from beginning
    this.restartDotAnimation();
}
}

startDotAnimation() {
    let dotCount = 1;
    
    this.dotAnimationInterval = setInterval(() => {
        if (this.automationDots) {
            const dots = '.'.repeat(dotCount);
            this.automationDots.textContent = dots;
            
            dotCount = dotCount >= 3 ? 1 : dotCount + 1;
        }
    }, 500);
}

restartDotAnimation() {
    // Clear existing interval
    if (this.dotAnimationInterval) {
        clearInterval(this.dotAnimationInterval);
    }
    
    // Start fresh with count at 0 so first update shows no dots, then 1, 2, 3
    let dotCount = 0;
    
    this.dotAnimationInterval = setInterval(() => {
        if (this.automationDots) {
            const dots = '.'.repeat(dotCount);
            this.automationDots.textContent = dots;
            
            dotCount = dotCount >= 3 ? 0 : dotCount + 1;
        }
    }, 500);
}
    
async loadServerStats() {
    try {
        console.log('Loading server stats...');
        
        // Get the specific global stats document
        const statsDocRef = doc(this.db, 'serverStats', 'global');
        const statsDoc = await getDoc(statsDocRef);
        
        if (!statsDoc.exists()) {
            console.log('Server stats document does not exist, using defaults');
            // Set defaults but don't try to create - let automation service handle that
            this.serverStats.happiness = 50;
            this.serverStats.sentience = 50;
            this.serverStats.mysteries = 0;
        } else {
            // Load existing stats
            const statsData = statsDoc.data();
            console.log('Loaded server stats:', statsData);
            
            this.serverStats.happiness = statsData.happiness !== undefined ? statsData.happiness : 50;
            this.serverStats.sentience = statsData.sentience !== undefined ? statsData.sentience : 50;
            this.serverStats.mysteries = statsData.mysteries !== undefined ? statsData.mysteries : 0;
        }
        
        console.log('Server stats initialized:', this.serverStats);
    } catch (error) {
        console.error('Error loading server stats:', error);
        // Use defaults on any error
        this.serverStats.happiness = 50;
        this.serverStats.sentience = 50;
        this.serverStats.mysteries = 0;
        
        // Don't show error notification for read-only users
        console.log('Using default server stats due to read error');
    }
}
    
async saveServerStats() {
    try {
        const statsDocRef = doc(this.db, 'serverStats', 'global');
        await setDoc(statsDocRef, {
            happiness: this.serverStats.happiness,
            sentience: this.serverStats.sentience, // Make sure this matches
            mysteries: this.serverStats.mysteries,
            lastUpdated: serverTimestamp()
        }, { merge: true });
        
        console.log('Server stats saved:', {
            happiness: this.serverStats.happiness,
            sentience: this.serverStats.sentience,
            mysteries: this.serverStats.mysteries
        });
    } catch (error) {
        console.error('Error saving server stats:', error);
    }
}
    
listenToServerStats() {
    onSnapshot(doc(this.db, 'serverStats', 'global'), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            
            const newHappiness = Math.max(0, Math.min(100, data.happiness || 50));
            const newSentience = Math.max(0, Math.min(100, data.sentience || 50));
            const newMysteries = data.mysteries || 0;
            
            if (this.serverStats.happiness !== newHappiness || 
                this.serverStats.sentience !== newSentience || 
                this.serverStats.mysteries !== newMysteries) {
                
                this.serverStats.happiness = newHappiness;
                this.serverStats.sentience = newSentience;
                this.serverStats.mysteries = newMysteries;
                
                this.updateServerStatsUI();
            }
        }
    });
}
    
    
    async calculate24hStats() {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        try {
            // Query feed for events in the last 24 hours
            const feedQuery = query(
                collection(this.db, 'feed'),
                orderBy('timestamp', 'desc')
            );
            
            const feedSnapshot = await getDocs(feedQuery);
            
            // Reset counters
            this.serverStats.stats24h = {
                throngsBirthed: 0,
                throngsDead: 0,
                housesBuilt: 0,
                housesLost: 0,
                treesPlanted: 0,
                treesLost: 0,
                weatherChanges: 0
            };
            
            feedSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.timestamp && data.timestamp.toDate) {
                    const eventTime = data.timestamp.toDate();
                    
                    // Only count events from the last 24 hours
                    if (eventTime > yesterday) {
                        switch (data.action) {
                            case 'birth':
                                this.serverStats.stats24h.throngsBirthed++;
                                break;
                            case 'death':
                            case 'fire':
                            case 'freeze':
                                this.serverStats.stats24h.throngsDead++;
                                break;
                            case 'building':
                                this.serverStats.stats24h.housesBuilt++;
                                break;
                            case 'houselost':
                                this.serverStats.stats24h.housesLost++;
                                break;
                            case 'planttree':
                                this.serverStats.stats24h.treesPlanted++;
                                break;
                            case 'treelost':
                                this.serverStats.stats24h.treesLost++;
                                break;
                            case 'weather':
                                this.serverStats.stats24h.weatherChanges++;
                                break;
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Error calculating 24h stats:', error);
        }
        
        this.updateServerStatsUI();
    }
    
    updateServerStatsUI() {
        // Update happiness bar
        if (this.statsElements.happiness && this.statsElements.happinessText) {
            this.statsElements.happiness.style.width = this.serverStats.happiness + '%';
            this.statsElements.happinessText.textContent = Math.round(this.serverStats.happiness) + '%';
        }
        
        // Update sentience bar
if (this.statsElements.sentience && this.statsElements.sentienceText) {
    this.statsElements.sentience.style.width = this.serverStats.sentience + '%';
    this.statsElements.sentienceText.textContent = Math.round(this.serverStats.sentience) + '%';
}
        
        // Update population
        if (this.statsElements.population) {
            this.statsElements.population.textContent = this.throngs.size;
        }

// Calculate mysteries dynamically (like population)
const currentMysteries = this.bones.size + this.ufos.size + this.eggs.size;
if (this.statsElements.mysteries) {
    this.statsElements.mysteries.textContent = currentMysteries;
}
        
        // Update 24h stats
        Object.keys(this.serverStats.stats24h).forEach(key => {
            const element = this.statsElements[key + '24h'];
            if (element) {
                element.textContent = this.serverStats.stats24h[key];
            }
        });
    }
    
// Event handlers for stats updates - FIXED VERSIONS
async onThrongBirth() {
    this.serverStats.happiness = Math.max(0, Math.min(100, this.serverStats.happiness + 2));
    this.serverStats.sentience = Math.max(0, Math.min(100, this.serverStats.sentience + 1));
    
    await setDoc(doc(this.db, 'serverStats', 'global'), {
        happiness: this.serverStats.happiness,
        sentience: this.serverStats.sentience,
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    this.updateServerStatsUI();
}

async onThrongDeath() {
    this.serverStats.happiness = Math.max(0, Math.min(100, this.serverStats.happiness - 5));
    this.serverStats.sentience = Math.max(0, Math.min(100, this.serverStats.sentience - 1));
    
    await setDoc(doc(this.db, 'serverStats', 'global'), {
        happiness: this.serverStats.happiness,
        sentience: this.serverStats.sentience,
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    this.updateServerStatsUI();
}

async onHouseBuild() {
    this.serverStats.happiness = Math.max(0, Math.min(100, this.serverStats.happiness + 3));
    
    await setDoc(doc(this.db, 'serverStats', 'global'), {
        happiness: this.serverStats.happiness,
        sentience: this.serverStats.sentience,
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    this.updateServerStatsUI();
}

async onHouseLost() {
    this.serverStats.happiness = Math.max(0, Math.min(100, this.serverStats.happiness - 2));
    
    await setDoc(doc(this.db, 'serverStats', 'global'), {
        happiness: this.serverStats.happiness,
        sentience: this.serverStats.sentience,
        mysteries: this.serverStats.mysteries,
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    this.updateServerStatsUI();
}

async onTreePlant() {
    this.serverStats.happiness = Math.max(0, Math.min(100, this.serverStats.happiness + 1));
    
    await setDoc(doc(this.db, 'serverStats', 'global'), {
        happiness: this.serverStats.happiness,
        sentience: this.serverStats.sentience,
        mysteries: this.serverStats.mysteries,
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    this.updateServerStatsUI();
}

async onTreeLost() {
    this.serverStats.happiness = Math.max(0, Math.min(100, this.serverStats.happiness - 2));
    
    await setDoc(doc(this.db, 'serverStats', 'global'), {
        happiness: this.serverStats.happiness,
        sentience: this.serverStats.sentience,
        mysteries: this.serverStats.mysteries,
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    this.updateServerStatsUI();
}
    
    // Notification System
    createNotificationContainer() {
        if (!document.querySelector('.notification-container')) {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }
    
    showNotification(type, title, message, duration = 5000) {
    this.createNotificationContainer();
    const container = document.querySelector('.notification-container');
    
    // Ensure notification container is always visible
    container.classList.remove('hud-hidden');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    progressBar.style.animationDuration = `${duration}ms`;
    
    notification.innerHTML = '<div class="notification-title">' + title + '</div>' +
        '<div class="notification-text">' + message + '</div>';
    notification.appendChild(progressBar);
    
    container.appendChild(notification);
    
    // Auto remove notification
    const timeout = setTimeout(() => {
        this.removeNotification(notification);
    }, duration);
    
    // Store timeout for potential early removal
    notification.timeoutId = timeout;
    
    return notification;
}
    
    removeNotification(notification) {
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }
        
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    saveThrongPositions() {
        const positions = {};
        this.throngs.forEach((throng, id) => {
            positions[id] = {
                x: throng.data.x,
                y: throng.data.y,
                currentSprite: throng.data.currentSprite
            };
        });
        localStorage.setItem('throngPositions', JSON.stringify(positions));
    }
    
    loadThrongPositions() {
        const saved = localStorage.getItem('throngPositions');
        if (saved) {
            this.savedPositions = JSON.parse(saved);
        } else {
            this.savedPositions = {};
        }
    }

    // NEW: Get virtual world size instead of using getBoundingClientRect
    getVirtualWorldSize() {
        // Use the viewport size to calculate virtual world size instead of getBoundingClientRect
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate the actual virtual world size based on the CSS dimensions (150% of viewport)
        return {
            width: viewportWidth * 1.5,
            height: viewportHeight * 1.5
        };
    }
    
   async init() {
    // Load server stats FIRST before anything else
    await this.initializeServerStats();
    
    // Initialize game components
    this.setupWallet();
    this.setupActionDropdown();
    this.setupZoomControls();
    this.setupCameraControls();
    this.setupHudToggle();
    this.setupAudioToggle();
    this.setupCADisplay();
    this.setupViewJournalsButton();
    this.setupDocumentationButton();
    this.generateBackground();
    
    this.updateMaxOffset();
    
    this.listenToThrongs();
    this.listenToHouses();
    this.listenToApartments();
    this.listenToTrees();
    this.listenToBones();
    this.listenToFirepits();
    this.listenToEggs();
    this.listenToUFOs();
    this.listenToFeed();
    this.listenToActions();
    this.listenToWeather();
    this.initializeAutomationStatus();

    // Initialize Solana if available
    this.initSolana();
}
    
    initSolana() {
        try {
            console.log('Checking Solana availability...');
            
            if (window.solanaWeb3) {
                this.connection = new window.solanaWeb3.Connection(this.RPC_URL, 'confirmed');
                this.solanaLoaded = true;
                console.log('Solana Web3 initialized successfully');
                
                // Set up token mint public key
                this.tokenMintPubkey = new window.solanaWeb3.PublicKey(this.THRONG_TOKEN_MINT);
                
                // Update wallet button to show it's ready
                if (this.connectWalletBtn) {
                    this.connectWalletBtn.disabled = false;
                    this.connectWalletBtn.style.opacity = '1';
                    this.connectWalletBtn.style.display = 'block'; // Ensure button is visible
                }
            } else {
                console.warn('Solana Web3 not available - wallet features disabled');
                this.showSolanaError();
            }
        } catch (error) {
            console.error('Failed to initialize Solana:', error);
            this.showSolanaError();
        }
    }
    
    showSolanaError() {
        if (this.connectWalletBtn) {
            this.connectWalletBtn.textContent = 'Wallet Unavailable';
            this.connectWalletBtn.disabled = true;
            this.connectWalletBtn.style.opacity = '0.5';
            this.connectWalletBtn.style.cursor = 'not-allowed';
            this.connectWalletBtn.style.display = 'block'; // Ensure button is visible even when disabled
        }
    }
    
    setupWallet() {
        // Ensure wallet button is visible initially
        if (this.connectWalletBtn) {
            this.connectWalletBtn.style.display = 'block';
            this.connectWalletBtn.addEventListener('click', () => {
                if (this.wallet) {
                    this.disconnectWallet();
                } else {
                    this.connectWallet();
                }
            });

            // Add hover effect for connected state
            this.connectWalletBtn.addEventListener('mouseenter', () => {
                if (this.wallet && this.connectWalletBtn.classList.contains('connected')) {
                    const addressText = this.wallet.toString();
                    this.connectWalletBtn.textContent = `${addressText.slice(0, 4)}...${addressText.slice(-4)} Disconnect`;
                }
            });

            this.connectWalletBtn.addEventListener('mouseleave', () => {
                if (this.wallet && this.connectWalletBtn.classList.contains('connected')) {
                    const addressText = this.wallet.toString();
                    this.connectWalletBtn.textContent = `${addressText.slice(0, 4)}...${addressText.slice(-4)} Connected`;
                }
            });
        }
        
        // Check if wallet is already connected
        if (window.solana && window.solana.isConnected) {
            this.onWalletConnect();
        }
    }
    
async connectWallet() {
    try {
        if (!window.solana) {
            this.showNotification('error', 'Wallet Error', 'Phantom wallet not found! Please install Phantom wallet.', 5000);
            return;
        }
        
        if (!this.solanaLoaded) {
            this.showNotification('error', 'Connection Error', 'Solana libraries are still loading. Please try again in a moment.', 5000);
            return;
        }
        
        const response = await window.solana.connect();
        this.wallet = response.publicKey;
        
        // Simple admin detection - no Firebase auth needed
        if (this.isAdminWallet()) {
            console.log('Admin wallet detected');
        }
        
        this.onWalletConnect();
        this.updateTokenBalance();
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        if (error.code === 4001) {
            this.showNotification('error', 'Connection Cancelled', 'Wallet connection was cancelled by user.', 5000);
        } else {
            this.showNotification('error', 'Connection Failed', 'Failed to connect wallet. Please try again.', 5000);
        }
    }
}

    
async disconnectWallet() {
    try {
        if (window.solana) {
            await window.solana.disconnect();
        }
        
        this.wallet = null;
        this.tokenBalance = 0;
        
        // Reset UI
        if (this.connectWalletBtn && this.throngBalanceContainer) {
            this.connectWalletBtn.textContent = 'Connect Phantom';
            this.connectWalletBtn.classList.remove('connected');
            this.throngBalanceContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to disconnect wallet:', error);
    }
}
    
    onWalletConnect() {
    if (this.wallet && this.connectWalletBtn && this.throngBalanceContainer) {
        const addressText = this.wallet.toString();
        this.connectWalletBtn.textContent = `${addressText.slice(0, 4)}...${addressText.slice(-4)} Connected`;
        this.connectWalletBtn.classList.add('connected');
        this.throngBalanceContainer.style.display = 'block';
        this.updateActionButtons(); // This will now handle admin vs regular user logic
    }
}

    
    
    async updateTokenBalance() {
        if (!this.wallet || !this.solanaLoaded) return;
        
        try {
            console.log('Fetching token balance for:', this.THRONG_TOKEN_MINT);
            
            // Get associated token address using our helper
            const associatedTokenAddress = await window.splTokenSimple.getAssociatedTokenAddress(
                this.tokenMintPubkey,
                this.wallet
            );
            
            console.log('Associated token address:', associatedTokenAddress.toString());
            
            // Get account info
            const accountInfo = await this.connection.getAccountInfo(associatedTokenAddress);
            
            if (accountInfo && accountInfo.data.length > 0) {
                // Parse token account data using our helper
                const parsedData = window.splTokenSimple.parseTokenAccountData(accountInfo.data);
                
                // Get token mint info to determine decimals
                const mintInfo = await this.connection.getAccountInfo(this.tokenMintPubkey);
                let decimals = 9; // default
                
                if (mintInfo && mintInfo.data.length >= 44) {
                    // Mint account structure: decimals is at byte 44
                    decimals = mintInfo.data[44];
                }
                
                console.log('Token decimals:', decimals);
                console.log('Raw token amount:', parsedData.amount.toString());
                
                // Convert from smallest unit using the actual decimals
                this.tokenBalance = Number(parsedData.amount) / Math.pow(10, decimals);
                console.log('Calculated token balance:', this.tokenBalance);
            } else {
                this.tokenBalance = 0;
                console.log('No token account found or account is empty');
            }
            
            if (this.tokenBalanceEl) {
                this.tokenBalanceEl.textContent = `$EMULITES: ${this.formatTokenBalance(this.tokenBalance)}`;
            }
            
            this.updateActionButtons();
        } catch (error) {
            console.error('Failed to get token balance:', error);
            // For testing, set a default balance
            this.tokenBalance = 100;
            if (this.tokenBalanceEl) {
                this.tokenBalanceEl.textContent = `$EMULITES: ${this.formatTokenBalance(this.tokenBalance)} (simulated)`;
            }
            this.updateActionButtons();
        }
    }
    
updateActionButtons() {
    // Get all action buttons
    const nameThrongBtn = document.getElementById('nameThrongBtn');
    const adminSection = document.getElementById('adminSection');
    
    // Weather buttons - visible to all connected wallets
    const weatherButtons = [
        document.getElementById('rainBtn'),
        document.getElementById('tornadoBtn'),
        document.getElementById('snowBtn')
    ].filter(btn => btn !== null);

    if (!this.wallet) {
        // No wallet connected - hide all buttons
        if (nameThrongBtn) nameThrongBtn.style.display = 'none';
        if (adminSection) adminSection.style.display = 'none';
        weatherButtons.forEach(btn => btn.style.display = 'none');
        return;
    }

    // Wallet is connected
    const isAdmin = this.isAdminWallet();

    console.log('Current wallet:', this.wallet.toString());

    // Name Throng button - visible to all connected wallets
    if (nameThrongBtn) {
        nameThrongBtn.style.display = 'block';
        if (this.tokenBalance < 1) {
            nameThrongBtn.classList.add('disabled');
            nameThrongBtn.disabled = true;
        } else {
            nameThrongBtn.classList.remove('disabled');
            nameThrongBtn.disabled = false;
        }
    }

    // Admin section and dropdown - only visible to admin wallet
    if (adminSection) {
        if (isAdmin) {
            adminSection.style.display = 'block';
        } else {
            adminSection.style.display = 'none';
        }
    }

    // Admin dropdown - only enabled for admin wallet
    const adminDropdown = document.getElementById('adminDropdown');
    if (adminDropdown) {
        if (isAdmin) {
            adminDropdown.style.display = 'block';
            adminDropdown.disabled = false;
        } else {
            adminDropdown.style.display = 'none';
            adminDropdown.disabled = true;
        }
    }

    // Weather buttons - visible to all connected wallets
    weatherButtons.forEach(btn => {
        btn.style.display = 'block';
        btn.classList.remove('disabled');
        btn.disabled = false;
    });
}
    
    async burnToken() {
        if (!this.wallet || this.tokenBalance < 1) {
            this.showNotification('error', 'Insufficient Tokens', 'You need at least 1 $EMULITES to perform actions.', 5000);
            return false;
        }
        
        if (!this.solanaLoaded) {
            this.showNotification('error', 'Wallet Unavailable', 'Wallet features not available. Please refresh and try again.', 5000);
            return false;
        }
        
        try {
            console.log('Starting token burn process...');
            console.log('Using token mint:', this.THRONG_TOKEN_MINT);
            console.log('Burn address:', this.BURN_ADDRESS);
            
            // Get token mint info to determine decimals
            const mintInfo = await this.connection.getAccountInfo(this.tokenMintPubkey);
            let decimals = 9; // default
            
            if (mintInfo && mintInfo.data.length >= 44) {
                // Mint account structure: decimals is at byte 44
                decimals = mintInfo.data[44];
            }
            
            console.log('Token decimals:', decimals);
            
            // Calculate the actual amount to burn (1 token with correct decimals)
            const burnAmount = BigInt(1 * Math.pow(10, decimals));
            console.log('Burning amount (smallest units):', burnAmount.toString());
            console.log('This equals 1 token');
            
            // Get associated token address for the correct token
            const associatedTokenAddress = await window.splTokenSimple.getAssociatedTokenAddress(
                this.tokenMintPubkey,
                this.wallet
            );
            
            console.log('User token account:', associatedTokenAddress.toString());
            
            // Get burn address associated token account
            const burnAddressPubkey = new window.solanaWeb3.PublicKey(this.BURN_ADDRESS);
            const burnTokenAddress = await window.splTokenSimple.getAssociatedTokenAddress(
                this.tokenMintPubkey,
                burnAddressPubkey
            );
            
            console.log('Burn token account:', burnTokenAddress.toString());
            
            // Create transaction
            const transaction = new window.solanaWeb3.Transaction();
            
            // Check if burn token account exists, if not create it
            try {
                const burnAccountInfo = await this.connection.getAccountInfo(burnTokenAddress);
                if (!burnAccountInfo) {
                    console.log('Creating burn token account...');
                    const createAccountInstruction = window.splTokenSimple.createAssociatedTokenAccountInstruction(
                        this.wallet,
                        burnTokenAddress,
                        burnAddressPubkey,
                        this.tokenMintPubkey
                    );
                    transaction.add(createAccountInstruction);
                }
            } catch (error) {
                console.log('Error checking burn account, will try to create:', error.message);
                const createAccountInstruction = window.splTokenSimple.createAssociatedTokenAccountInstruction(
                    this.wallet,
                    burnTokenAddress,
                    burnAddressPubkey,
                    this.tokenMintPubkey
                );
                transaction.add(createAccountInstruction);
            }
            
            // Create transfer instruction to burn address (1 token with correct decimals)
            const transferInstruction = window.splTokenSimple.createTransferInstruction(
                associatedTokenAddress,
                burnTokenAddress,
                this.wallet,
                burnAmount
            );
            
            transaction.add(transferInstruction);
            
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.wallet;
            
            console.log('Requesting wallet signature for burn transaction...');
            // Show transaction confirmation notification
            const txNotification = this.showNotification('info', 'Transaction Pending', 'Confirming transaction on blockchain...', 30000);
            
            // Sign and send transaction
            const signedTransaction = await window.solana.signAndSendTransaction(transaction);
            
            console.log('Burn transaction sent:', signedTransaction.signature);
            
            // Wait for confirmation
            console.log('Waiting for transaction confirmation...');
            await this.connection.confirmTransaction(signedTransaction.signature);
            
            console.log('Token burn confirmed successfully!');
            // Remove pending notification and show success
            this.removeNotification(txNotification);
            this.showNotification('info', 'Transaction Confirmed', 'Token burned successfully!', 3000);
            
            // Update balance after successful burn
            setTimeout(() => {
                this.updateTokenBalance();
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Failed to burn token:', error);
            // Remove pending notification on error
            this.removeNotification(txNotification);
            if (error.message.includes('User rejected')) {
                this.showNotification('error', 'Transaction Cancelled', 'Transaction was cancelled by user.', 5000);
            } else if (error.message.includes('insufficient funds')) {
                this.showNotification('error', 'Insufficient SOL', 'Insufficient SOL for transaction fees.', 5000);
            } else if (error.message.includes('insufficient lamports')) {
                this.showNotification('error', 'Insufficient SOL', 'Insufficient SOL for transaction fees.', 5000);
            } else {
                this.showNotification('error', 'Transaction Failed', 'Failed to burn token: ' + error.message, 5000);
            }
            return false;
        }
    }
    
  setupActionDropdown() {
    // Name Throng button - always visible when wallet connected, costs tokens
    const nameThrongBtn = document.getElementById('nameThrongBtn');
    if (nameThrongBtn) {
        nameThrongBtn.addEventListener('click', async () => {
            if (await this.burnToken()) {
                this.startNamingMode();
            }
        });
    }

    // Admin dropdown - Set up event listener for dropdown selection
    const adminDropdown = document.getElementById('adminDropdown');
    if (adminDropdown) {
        adminDropdown.addEventListener('change', (e) => {
            const selectedAction = e.target.value;
            
            if (!selectedAction) return;
            
            // Execute the selected action
            this.executeAdminAction(selectedAction);
            
            // Reset dropdown to default selection
            setTimeout(() => {
                adminDropdown.value = '';
            }, 100);
        });
    }
    
    // Weather event buttons (always free for everyone when wallet connected)
    const rainBtn = document.getElementById('rainBtn');
    if (rainBtn) {
        rainBtn.addEventListener('click', () => {
            this.triggerRainEvent();
        });
    }

    const tornadoBtn = document.getElementById('tornadoBtn');
    if (tornadoBtn) {
        tornadoBtn.addEventListener('click', () => {
            this.triggerTornadoEvent();
        });
    }

    const snowBtn = document.getElementById('snowBtn');
    if (snowBtn) {
        snowBtn.addEventListener('click', () => {
            this.triggerSnowEvent();
        });
    }
}

  async executeAdminAction(action) {
    if (!this.isAdminWallet()) {
        this.showNotification('error', 'Access Denied', 'Admin privileges required.', 3000);
        return;
    }
    
    try {
        this.showNotification('info', 'Processing', `Executing ${action}...`, 3000);
        
        // Call backend directly instead of doing client-side auth
        const response = await fetch(`/api/admin/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: this.wallet.toString()
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            this.showNotification('success', 'Success', result.message || `${action} completed successfully!`, 3000);
        } else {
            const error = await response.json();
            this.showNotification('error', 'Failed', error.error || `${action} failed`, 5000);
        }
    } catch (error) {
        console.error('Admin action failed:', error);
        this.showNotification('error', 'Error', 'Network error occurred', 5000);
    }
}
    
    isAdminWallet() {
    return this.wallet && this.wallet.toString() === this.ADMIN_WALLET;
}
    
    startNamingMode() {
        this.isNamingMode = true;
        document.body.style.cursor = 'crosshair';
        
        // OPTIMIZED: Use single CSS class instead of individual element filters
        console.log('Adding naming-mode class to worldContainer');
        this.worldContainer.classList.add('naming-mode');
        
        // Show notification
        this.namingNotification = this.showNotification(
            'warning', 
            'Select a Throng', 
            'Click on the Throng you would like to rename. This will expire in 3 minutes.', 
            180000 // 3 minutes
        );
        
        // OPTIMIZED: Add visual feedback to throngs in batch
        const throngElements = Array.from(this.throngs.values()).map(throng => throng.element);
        requestAnimationFrame(() => {
            throngElements.forEach(element => {
                const throngData = Array.from(this.throngs.values()).find(t => t.element === element);
                if (throngData && throngData.data.name && throngData.data.name.trim() !== '') {
                    // Already named throngs get different styling
                    element.classList.add('already-named');
                } else {
                    // Unnamed throngs get normal naming mode styling
                    element.classList.add('naming-mode');
                }
            });
        });
        
        // Add click listeners to throngs
        this.setupThrongNaming();
        
        // Auto-exit naming mode after 3 minutes
        this.namingModeTimeout = setTimeout(() => {
            if (this.isNamingMode) {
                this.exitNamingMode();
            }
        }, 180000); // 3 minutes
    }
    
    exitNamingMode() {
        this.isNamingMode = false;
        document.body.style.cursor = 'default';
        
        // OPTIMIZED: Remove single CSS class instead of individual element filters
        this.worldContainer.classList.remove('naming-mode');
        
        // Clear timeout if it exists
        if (this.namingModeTimeout) {
            clearTimeout(this.namingModeTimeout);
            this.namingModeTimeout = null;
        }
        
        // Remove notification if it exists
        if (this.namingNotification) {
            this.removeNotification(this.namingNotification);
            this.namingNotification = null;
        }
        
        this.hideCombinedInfoPopup();
        
        // OPTIMIZED: Remove visual feedback in batch
        const throngElements = Array.from(this.throngs.values()).map(throng => throng.element);
        requestAnimationFrame(() => {
            throngElements.forEach(element => {
                element.classList.remove('naming-mode');
                element.classList.remove('already-named');
                // Remove click handlers
                if (element._nameClickHandler) {
                    element.removeEventListener('click', element._nameClickHandler);
                    element._nameClickHandler = null;
                }
            });
        });
    }
    
    setupThrongNaming() {
        this.throngs.forEach((throng, id) => {
            const clickHandler = (e) => {
                e.stopPropagation();
                
                // Check if throng is already named
                if (throng.data.name && throng.data.name.trim() !== '') {
                    this.showNotification('error', 'Throng Already Named', 'This throng has already been named and cannot be renamed. Choose another one!', 5000);
                    // DON'T exit naming mode - let them try another throng
                    return;
                }
                
                this.selectedThrong = id;
                
                // Keep the selected throng above overlay until naming is complete
                throng.element.classList.add('selected-for-naming');
                throng.element.classList.remove('naming-mode');
                
                this.showNamePopup();
                this.exitNamingMode();
            };
            
            throng.element.addEventListener('click', clickHandler);
            // Store reference for cleanup
            throng.element._nameClickHandler = clickHandler;
        });
    }
    
    showNamePopup() {
        const popup = document.createElement('div');
        popup.className = 'name-popup';
        popup.innerHTML = '<h3>Name Your Emulite</h3>' +
    '<input type="text" id="throngNameInput" placeholder="Enter throng name..." maxlength="12">' +
    '<div class="button-container">' +
        '<button id="saveNameBtn">Save</button>' +
        '<button id="cancelNameBtn" class="cancel-button">Cancel</button>' +
    '</div>';
        
        document.body.appendChild(popup);
        
        const input = document.getElementById('throngNameInput');
        const saveBtn = document.getElementById('saveNameBtn');
        const cancelBtn = document.getElementById('cancelNameBtn');
        
        input.focus();
        
        const saveName = async () => {
            const name = input.value.trim();
            if (name && this.selectedThrong) {
                await this.saveThrongName(this.selectedThrong, name);
                popup.remove();
                this.selectedThrong = null;
            }
        };
        
        const cancel = () => {
            // Remove styling when cancelled
            if (this.selectedThrong) {
                const throng = this.throngs.get(this.selectedThrong);
                if (throng) {
                    throng.element.classList.remove('selected-for-naming');
                }
            }
            popup.remove();
            this.selectedThrong = null;
        };
        
        saveBtn.addEventListener('click', saveName);
        cancelBtn.addEventListener('click', cancel);
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveName();
            } else if (e.key === 'Escape') {
                cancel();
            }
        });
    }
    
async saveThrongName(throngId, name) {
    try {
        // Check if already named
        const throng = this.throngs.get(throngId);
        if (throng && throng.data.name && throng.data.name.trim() !== '') {
            this.showNotification('error', 'Naming Failed', 'This throng was just named by someone else. Please try another throng.', 5000);
            throng.element.classList.remove('selected-for-naming');
            return;
        }
        
        // Only save naming data - NO position data
        await setDoc(doc(this.db, 'throngs', throngId), {
            name: name.trim(),
            namedAt: serverTimestamp(),
            namedBy: this.wallet ? this.wallet.toString() : 'anonymous'
        }, { merge: true });
        
        // Immediate local update for the namer
        if (throng) {
            throng.element.classList.remove('selected-for-naming');
            throng.data.name = name.trim();
            throng.data.namedAt = new Date();
            throng.data.namedBy = this.wallet ? this.wallet.toString() : 'anonymous';
            
            this.createThrongNameLabel(throng, name.trim());
            this.addTraitsHover(throng, throng.data.traits || []);
        }
        
        // Create feed entry
        await addDoc(collection(this.db, 'feed'), {
            title: 'Emulite Named',
            description: `An Emulite has been named "${name.trim()}"! They now have an identity and can never be renamed.`,
            timestamp: serverTimestamp(),
            action: 'naming',
            throngId: throngId
        });
        
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to save throng name:', error);
        this.showNotification('error', 'Save Failed', 'Failed to save throng name. Please try again.', 5000);
        
        const throng = this.throngs.get(throngId);
        if (throng) {
            throng.element.classList.remove('selected-for-naming');
        }
    }
}
    
createThrongNameLabel(throng, name) {
    // Remove existing name label if any
    const existingLabel = throng.element.querySelector('.throng-name');
    if (existingLabel) {
        existingLabel.remove();
    }
    
    if (name && name.trim()) {
        const nameLabel = document.createElement('div');
        nameLabel.className = 'throng-name';
        nameLabel.textContent = name.trim();
        
        // Make entire throng clickable for solscan if named
        if (throng.data.namedBy && throng.data.namedBy !== 'anonymous') {
            throng.element.style.cursor = 'pointer';
            
            // Remove any existing click handlers to prevent duplicates
            throng.element.onclick = null;
            throng.element.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(`https://solscan.io/account/${throng.data.namedBy}`, '_blank');
            });
        }
        
        throng.element.appendChild(nameLabel);
    }
}
    

// Fix 2: Update addTraitsHover to handle missing traits gracefully
addTraitsHover(throng, traits) {
    // Remove any existing event listeners first to prevent duplicates
    throng.element.removeEventListener('mouseenter', throng._hoverEnterHandler);
    throng.element.removeEventListener('mouseleave', throng._hoverLeaveHandler);
    
    // Create new event handlers
    throng._hoverEnterHandler = (e) => {
        // Don't show popup if we're in naming mode
        if (this.isNamingMode) return;
        
        // Use traits from current throng data if provided traits are empty
        const currentTraits = traits && traits.length > 0 ? traits : (throng.data.traits || []);
        this.showCombinedInfoPopup(e, currentTraits, throng.data);
    };
    
    throng._hoverLeaveHandler = () => {
        this.hideCombinedInfoPopup();
    };
    
    // Add the event listeners
    throng.element.addEventListener('mouseenter', throng._hoverEnterHandler);
    throng.element.addEventListener('mouseleave', throng._hoverLeaveHandler);
}

showCombinedInfoPopup(e, traits, throngData) {
    // Remove any existing popup
    this.hideCombinedInfoPopup();
    
    // Always show popup even if no traits (just show naming info if available)
    const popup = document.createElement('div');
    popup.className = 'traits-popup';
    
    // EMULITES INFO header
    const header = document.createElement('div');
    header.className = 'traits-header';
    header.textContent = 'EMULITE INFO';
    popup.appendChild(header);
    
    // Traits section
    const traitsSection = document.createElement('div');
    traitsSection.className = 'traits-section';
    
    // Only show traits label and container if there are traits
    if (traits && Array.isArray(traits) && traits.length > 0) {
        const traitsLabel = document.createElement('div');
        traitsLabel.className = 'traits-label';
        traitsLabel.textContent = 'Traits:';
        traitsSection.appendChild(traitsLabel);
        
        const traitsContainer = document.createElement('div');
        traitsContainer.className = 'traits-container';

        traits.forEach(trait => {
            const traitTag = document.createElement('div');
            traitTag.className = 'trait-tag';
            traitTag.textContent = trait;
            traitsContainer.appendChild(traitTag);
        });

        traitsSection.appendChild(traitsContainer);
    } else {
        // Show a message if no traits
        const noTraitsLabel = document.createElement('div');
        noTraitsLabel.className = 'traits-label';
        noTraitsLabel.textContent = 'No traits yet';
        noTraitsLabel.style.opacity = '0.7';
        traitsSection.appendChild(noTraitsLabel);
    }
    
    // Add age display - ALWAYS show this for all throngs
    const ageRow = document.createElement('div');
    ageRow.className = 'age-row';
    
    const ageLabel = document.createElement('span');
    ageLabel.className = 'age-label';
    ageLabel.textContent = 'Age: ';
    ageRow.appendChild(ageLabel);
    
    const ageValue = document.createElement('span');
    ageValue.className = 'age-value';
    ageValue.textContent = this.calculateAge(throngData.timestamp);
    ageRow.appendChild(ageValue);
    
    traitsSection.appendChild(ageRow);
    
    // Add naming info directly in traits section if emulite is named
    if (throngData.name && throngData.namedBy && throngData.namedAt) {
        const namedByRow = document.createElement('div');
        namedByRow.className = 'named-by-row';
        
        const namedByLabel = document.createElement('span');
        namedByLabel.className = 'named-by-label';
        namedByLabel.textContent = 'Named by: ';
        namedByRow.appendChild(namedByLabel);
        
        const walletAddress = throngData.namedBy;
        const shortAddress = walletAddress === 'anonymous' ? 'Anonymous' : 
            `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        
        const addressSpan = document.createElement('span');
        addressSpan.className = 'named-address';
        addressSpan.textContent = shortAddress;
        namedByRow.appendChild(addressSpan);
        
        traitsSection.appendChild(namedByRow);
        
        // Format timestamp
        if (throngData.namedAt && throngData.namedAt.toDate) {
            const date = throngData.namedAt.toDate();
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                hour12: true
            };
            const timeFormat = date.toLocaleTimeString('en-US', options);
            const dateFormat = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
            const timeString = `${timeFormat} UTC ${dateFormat}`;
            
            const timeRow = document.createElement('div');
            timeRow.className = 'time-row';
            
            const timeLabel = document.createElement('span');
            timeLabel.className = 'time-label';
            timeLabel.textContent = 'Time: ';
            timeRow.appendChild(timeLabel);
            
            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'named-timestamp';
            timestampSpan.textContent = timeString;
            timeRow.appendChild(timestampSpan);
            
            traitsSection.appendChild(timeRow);
        }
    }
    
    popup.appendChild(traitsSection);
    
    // Temporarily add popup to get dimensions
    popup.style.visibility = 'hidden';
    popup.style.position = 'fixed';
    document.body.appendChild(popup);
    
    // Get popup dimensions
    const popupRect = popup.getBoundingClientRect();
    const popupWidth = popupRect.width;
    const popupHeight = popupRect.height;
    
    // Calculate initial position
    let leftPos = e.clientX + 10;
    let topPos = e.clientY - 30;
    
    // Check right boundary
    if (leftPos + popupWidth > window.innerWidth) {
        leftPos = e.clientX - popupWidth - 10;
    }
    
    // Check bottom boundary
    if (topPos + popupHeight > window.innerHeight) {
        topPos = e.clientY - popupHeight - 10;
    }
    
    // Check left boundary
    if (leftPos < 0) {
        leftPos = 10;
    }
    
    // Check top boundary
    if (topPos < 0) {
        topPos = 10;
    }
    
    // Apply final position and make visible
    popup.style.left = leftPos + 'px';
    popup.style.top = topPos + 'px';
    popup.style.visibility = 'visible';
    popup.style.zIndex = '10002';
    
    // Real-time age updates while popup is open
    if (throngData.timestamp) {
        const updateAge = () => {
            if (this.currentTraitsPopup && this.currentTraitsPopup.contains(ageValue)) {
                ageValue.textContent = this.calculateAge(throngData.timestamp);
            } else {
                clearInterval(ageUpdateInterval);
            }
        };
        
        const ageUpdateInterval = setInterval(updateAge, 1000); // Update every second
        
        // Store interval reference for cleanup
        popup._ageUpdateInterval = ageUpdateInterval;
    }
    
    this.currentTraitsPopup = popup;
}
    
hideCombinedInfoPopup() {
    if (this.currentTraitsPopup) {
        // Clean up age update interval if it exists
        if (this.currentTraitsPopup._ageUpdateInterval) {
            clearInterval(this.currentTraitsPopup._ageUpdateInterval);
        }
        
        this.currentTraitsPopup.remove();
        this.currentTraitsPopup = null;
    }
}
    
    updatePopulationCounter() {
        // Update server stats instead of old population counter
        this.updateServerStatsUI();
    }
    
    generateBackground() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const tileSize = 300;
        canvas.width = tileSize;
        canvas.height = tileSize;
        const pixelSize = 3;
        const pixelsPerTile = tileSize / pixelSize;
        
        for (let x = 0; x < pixelsPerTile; x++) {
            for (let y = 0; y < pixelsPerTile; y++) {
                ctx.fillStyle = this.getRandomGrassColor();
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
        
        const dataURL = canvas.toDataURL();
        this.worldContainer.style.backgroundImage = 'url(' + dataURL + ')';
        this.worldContainer.style.backgroundRepeat = 'repeat';
        this.worldContainer.style.backgroundSize = tileSize + 'px ' + tileSize + 'px';
    }
    
    getRandomGrassColor() {
        return this.grassColors[Math.floor(Math.random() * this.grassColors.length)];
    }
    
    setupCameraControls() {
        this.worldArea.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStart.x = e.clientX - this.cameraOffset.x;
            this.dragStart.y = e.clientY - this.cameraOffset.y;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const newOffsetX = e.clientX - this.dragStart.x;
            const newOffsetY = e.clientY - this.dragStart.y;
            
            // Calculate proper bounds based on zoom level
            const maxOffset = this.getMaxOffset();
            
            this.cameraOffset.x = Math.max(-maxOffset.x, Math.min(maxOffset.x, newOffsetX));
            this.cameraOffset.y = Math.max(-maxOffset.y, Math.min(maxOffset.y, newOffsetY));
            
            this.updateWorldTransform();
        });
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }
    
    getMaxOffset() {
        const worldRect = this.worldArea.getBoundingClientRect();
        const worldContainerRect = { width: worldRect.width * 1.5, height: worldRect.height * 1.5 };
        
        // Calculate how much we can pan based on zoom level
        const scaledWorldWidth = worldContainerRect.width * this.zoomLevel;
        const scaledWorldHeight = worldContainerRect.height * this.zoomLevel;
        
        // At zoom level 1.0, we want to be able to see the edges
        // At higher zoom levels, we need more panning range
        const maxOffsetX = Math.max(0, (scaledWorldWidth - worldRect.width) / 2);
        const maxOffsetY = Math.max(0, (scaledWorldHeight - worldRect.height) / 2);
        
        return { x: maxOffsetX, y: maxOffsetY };
    }
    
    setupZoomControls() {
        // Mouse wheel zoom
        this.worldArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomFactor = 0.1;
            const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
            const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
            
            if (newZoom !== this.zoomLevel) {
                // Get mouse position relative to world area
                const rect = this.worldArea.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate zoom center
                const worldCenterX = rect.width / 2;
                const worldCenterY = rect.height / 2;
                
                // Adjust camera offset to zoom towards mouse position
                const zoomRatio = newZoom / this.zoomLevel;
                this.cameraOffset.x = (this.cameraOffset.x - (mouseX - worldCenterX)) * zoomRatio + (mouseX - worldCenterX);
                this.cameraOffset.y = (this.cameraOffset.y - (mouseY - worldCenterY)) * zoomRatio + (mouseY - worldCenterY);
                
                this.zoomLevel = newZoom;
                this.constrainCamera();
                this.updateWorldTransform();
                this.updateZoomDisplay();
            }
        });
        
        // Create zoom display
        this.zoomDisplay = document.querySelector('.zoom-value');
    }

    setupHudToggle() {
    if (!this.hudToggleBtn) return;
    
    this.hudToggleBtn.addEventListener('click', () => {
        this.toggleHud();
    });
}

setupAudioToggle() {
    this.audioToggleBtn = document.getElementById('audioToggleBtn');
    this.backgroundMusic = document.getElementById('backgroundMusic');
    
    if (!this.audioToggleBtn || !this.backgroundMusic) {
        console.error('Audio elements not found');
        return;
    }
    
    // Set initial state
    this.isAudioEnabled = false;
    this.audioInitialized = false;
    this.updateAudioButton();
    
    // Set audio properties
    this.backgroundMusic.volume = 0.3; // 30% volume - adjust as needed
    this.backgroundMusic.loop = true;
    
    // Try to initialize audio immediately
    this.initializeAudio();
    
    // Add click event listener
    this.audioToggleBtn.addEventListener('click', () => {
        this.toggleAudio();
    });
    
    // Handle audio loading errors
    this.backgroundMusic.addEventListener('error', (e) => {
        console.error('Audio loading error:', e);
        this.audioToggleBtn.textContent = 'Audio Error';
        this.audioToggleBtn.disabled = true;
        this.audioToggleBtn.style.opacity = '0.5';
    });
    
    // Multiple event listeners to catch when audio is ready
    this.backgroundMusic.addEventListener('loadeddata', () => {
        console.log('Background music loaded via loadeddata event');
        this.audioInitialized = true;
        this.updateAudioButton();
    });
    
    this.backgroundMusic.addEventListener('canplay', () => {
        console.log('Background music can play via canplay event');
        this.audioInitialized = true;
        this.updateAudioButton();
    });
    
    this.backgroundMusic.addEventListener('loadedmetadata', () => {
        console.log('Background music metadata loaded');
        this.audioInitialized = true;
        this.updateAudioButton();
    });
}

async initializeAudio() {
    try {
        // Force load the audio
        this.backgroundMusic.load();
        
        // Wait a bit then check if we can play
        setTimeout(() => {
            if (this.backgroundMusic.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                console.log('Audio initialized via readyState check');
                this.audioInitialized = true;
                this.updateAudioButton();
            }
        }, 1000);
        
        // Fallback - mark as initialized after 2 seconds regardless
        setTimeout(() => {
            if (!this.audioInitialized) {
                console.log('Audio marked as initialized via fallback timeout');
                this.audioInitialized = true;
                this.updateAudioButton();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error initializing audio:', error);
        this.audioInitialized = false;
    }
}

async toggleAudio() {
    // If not initialized, try to initialize now
    if (!this.audioInitialized) {
        console.log('Audio not initialized, attempting to initialize...');
        await this.initializeAudio();
        
        // Wait a moment for initialization
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!this.backgroundMusic) {
        console.error('Background music element not found');
        return;
    }
    
    try {
        if (this.isAudioEnabled) {
            // Turn audio OFF
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0; // Reset to beginning
            this.isAudioEnabled = false;
            console.log('Audio turned OFF');
        } else {
            // Turn audio ON
            // Force the audio to be ready
            if (this.backgroundMusic.readyState < 2) {
                this.backgroundMusic.load();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            await this.backgroundMusic.play();
            this.isAudioEnabled = true;
            console.log('Audio turned ON');
        }
        
        this.updateAudioButton();
        
    } catch (error) {
        console.error('Error toggling audio:', error);
        
        // More specific error handling
        if (error.name === 'NotAllowedError') {
            console.log('Audio play blocked by browser - user interaction required');
            if (this.showNotification) {
                this.showNotification('warning', 'Audio Blocked', 
                    'Browser blocked audio. Click the button again to enable.', 5000);
            }
        } else if (error.name === 'NotSupportedError') {
            console.log('Audio format not supported');
            if (this.showNotification) {
                this.showNotification('error', 'Audio Error', 
                    'Audio format not supported by your browser.', 5000);
            }
        } else {
            if (this.showNotification) {
                this.showNotification('error', 'Audio Error', 
                    'Unable to play audio. Please try again.', 5000);
            }
        }
    }
}
    
updateAudioButton() {
    if (!this.audioToggleBtn) return;
    
    if (this.isAudioEnabled) {
        this.audioToggleBtn.textContent = '🔊';
        this.audioToggleBtn.classList.remove('audio-off');
        this.audioToggleBtn.classList.add('audio-on');
    } else {
        this.audioToggleBtn.textContent = '🔈';
        this.audioToggleBtn.classList.remove('audio-on');
        this.audioToggleBtn.classList.add('audio-off');
    }
}

toggleHud() {
    this.isHudVisible = !this.isHudVisible;
    
    // Get HUD elements (CA container is now part of sidebar, so remove it from this list)
   const hudElements = [
    this.throngBalanceContainer,
    document.querySelector('.zoom-container'),
    document.querySelector('.sidebar'),
    this.walletSocialContainer
].filter(el => el !== null);
    
    // Toggle HUD visibility
    hudElements.forEach(element => {
        if (this.isHudVisible) {
            element.classList.remove('hud-hidden');
        } else {
            element.classList.add('hud-hidden');
        }
    });
    
    // Update button text only (no visual state changes)
    if (this.isHudVisible) {
        this.hudToggleBtn.textContent = 'Hide HUD';
    } else {
        this.hudToggleBtn.textContent = 'Show HUD';
    }
    
    // Show notification (always visible since notifications are never hidden)
    const message = this.isHudVisible ? 'HUD is now visible' : 'HUD is now hidden';
    this.showNotification('info', 'HUD Toggle', message, 2000);
}
    
    updateMaxOffset() {
        // This method is called but the actual calculation is now done in getMaxOffset()
        // to ensure it's always current based on zoom level
    }
    
    constrainCamera() {
        const maxOffset = this.getMaxOffset();
        this.cameraOffset.x = Math.max(-maxOffset.x, Math.min(maxOffset.x, this.cameraOffset.x));
        this.cameraOffset.y = Math.max(-maxOffset.y, Math.min(maxOffset.y, this.cameraOffset.y));
    }
    
    updateWorldTransform() {
        // Apply both zoom and translation with pixel-perfect scaling
        this.worldContainer.style.transform = 
            `translate(${this.cameraOffset.x}px, ${this.cameraOffset.y}px) scale(${this.zoomLevel})`;
        this.worldContainer.style.transformOrigin = 'center center';
        
        // Ensure crisp pixel rendering at all zoom levels
        this.worldContainer.style.imageRendering = 'pixelated';
        this.worldContainer.style.imageRendering = '-moz-crisp-edges';
        this.worldContainer.style.imageRendering = 'crisp-edges';
    }
    
    updateZoomDisplay() {
        if (this.zoomDisplay) {
            this.zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }
    
    listenToThrongs() {
        onSnapshot(collection(this.db, 'throngs'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    this.createThrong(change.doc.id, change.doc.data());
                } else if (change.type === 'removed') {
                    this.removeThrong(change.doc.id);
                } else if (change.type === 'modified') {
                    this.updateThrong(change.doc.id, change.doc.data());
                }
            });
            
            this.updateZIndexes();
            this.updatePopulationCounter();
        });
    }
    
    listenToHouses() {
    onSnapshot(collection(this.db, 'houses'), (snapshot) => {
        // On first snapshot, mark initial load as complete after processing
        const isInitialLoad = !this.initialHouseLoadComplete;
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // If this is initial load, don't animate
                // If this is after initial load, always animate (it's truly new)
                this.createHouse(change.doc.id, change.doc.data(), !isInitialLoad);
            } else if (change.type === 'removed') {
                this.removeHouse(change.doc.id);
            }
        });
        
        // Mark initial load as complete after first snapshot
        if (isInitialLoad) {
            this.initialHouseLoadComplete = true;
        }
    });
}
    
    listenToTrees() {
    onSnapshot(collection(this.db, 'trees'), (snapshot) => {
        // On first snapshot, mark initial load as complete after processing
        const isInitialLoad = !this.initialTreeLoadComplete;
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // If this is initial load, don't animate
                // If this is after initial load, always animate (it's truly new)
                this.createTree(change.doc.id, change.doc.data(), !isInitialLoad);
            } else if (change.type === 'removed') {
                this.removeTree(change.doc.id);
            }
        });
        
        // Mark initial load as complete after first snapshot
        if (isInitialLoad) {
            this.initialTreeLoadComplete = true;
        }
    });
}

listenToBones() {
    onSnapshot(collection(this.db, 'bones'), (snapshot) => {
        // On first snapshot, mark initial load as complete after processing
        const isInitialLoad = !this.initialBoneLoadComplete;
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // If this is initial load, don't animate
                // If this is after initial load, always animate (it's truly new)
                this.createBone(change.doc.id, change.doc.data(), !isInitialLoad);
            } else if (change.type === 'removed') {
                this.removeBone(change.doc.id);
            }
        });
        
        // Mark initial load as complete after first snapshot
        if (isInitialLoad) {
            this.initialBoneLoadComplete = true;
        }
    });
}

// Add this entire method right after listenToBones()
listenToFirepits() {
    onSnapshot(collection(this.db, 'firepits'), (snapshot) => {
        // On first snapshot, mark initial load as complete after processing
        const isInitialLoad = !this.initialFirepitLoadComplete;
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // If this is initial load, don't animate
                // If this is after initial load, always animate (it's truly new)
                this.createFirepit(change.doc.id, change.doc.data(), !isInitialLoad);
            } else if (change.type === 'removed') {
                this.removeFirepit(change.doc.id);
            }
        });
        
        // Mark initial load as complete after first snapshot
        if (isInitialLoad) {
            this.initialFirepitLoadComplete = true;
        }
    });
}
    
    listenToEggs() {
    onSnapshot(collection(this.db, 'eggs'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                this.createEgg(change.doc.id, change.doc.data());
            } else if (change.type === 'removed') {
                this.removeEgg(change.doc.id);
            }
        });
        
        this.updateZIndexes();
    });
}

    async performBuilding() {
    const position = this.findValidHousePosition();
    const houseId = 'house_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const houseType = 'house1';
    
    // Create a unique building event ID with timestamp to prevent any possibility of collision
    const buildingEventId = `building-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    
    try {
        // IMPORTANT: Mark house as new BEFORE creating the document to ensure animation timing
        this.newHouses.add(houseId);
        
        // Step 1: Create the house document with serverTimestamp for proper sync
        const house = {
            id: houseId,
            x: position.x,
            y: position.y,
            type: houseType,
            timestamp: serverTimestamp(), // FIXED: Use serverTimestamp() instead of new Date()
            eventId: buildingEventId
        };
        
        // Step 2: Create both house and feed entry atomically
        await Promise.all([
            setDoc(doc(this.db, 'houses', houseId), house),
            setDoc(doc(this.db, 'feed', buildingEventId), {
                title: 'House Built',
                description: 'A new house has been constructed! The settlement grows stronger.',
                timestamp: serverTimestamp(),
                action: 'building',
                houseId: houseId,
                eventId: buildingEventId
            })
        ]);
        
        console.log('Building completed with event ID:', buildingEventId);
        
        // Update server stats for house build
        this.onHouseBuild();
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to create building:', error);
        this.showNotification('error', 'Building Failed', 'Failed to create house. Please try again.', 5000);
        // Remove from newHouses if creation failed
        this.newHouses.delete(houseId);
    }
}

    async performPlantTree() {
    const position = this.findValidTreePosition();
    const treeId = 'tree_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const treeTypes = ['tree1', 'tree2'];
    const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    
    // Create a unique planting event ID with timestamp to prevent any possibility of collision
    const plantingEventId = `planting-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    
    try {
        // IMPORTANT: Mark tree as new BEFORE creating the document to ensure animation timing
        this.newTrees.add(treeId);
        
        // Step 1: Create the tree document with serverTimestamp for proper sync
        const tree = {
            id: treeId,
            x: position.x,
            y: position.y,
            type: treeType,
            timestamp: serverTimestamp(), // Use serverTimestamp() for proper sync
            eventId: plantingEventId
        };
        
        // Step 2: Create both tree and feed entry atomically
        await Promise.all([
            setDoc(doc(this.db, 'trees', treeId), tree),
            setDoc(doc(this.db, 'feed', plantingEventId), {
                title: 'Tree Planted',
                description: 'A beautiful tree has been planted! Nature flourishes in the world.',
                timestamp: serverTimestamp(),
                action: 'planttree',
                treeId: treeId,
                eventId: plantingEventId
            })
        ]);
        
        console.log('Tree planting completed with event ID:', plantingEventId);
        
        // Update server stats for tree plant
        this.onTreePlant();
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to plant tree:', error);
        this.showNotification('error', 'Planting Failed', 'Failed to plant tree. Please try again.', 5000);
        // Remove from newTrees if creation failed
        this.newTrees.delete(treeId);
    }
}

async performDiscoverBones() {
    const position = this.findValidBonePosition();
    const boneId = 'bone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const boneTypes = ['bones1', 'bones2'];
    const boneType = boneTypes[Math.floor(Math.random() * boneTypes.length)];
    
    // Create a unique discovery event ID with timestamp to prevent any possibility of collision
    const discoveryEventId = `bone-discovery-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    
    try {
        // IMPORTANT: Mark bone as new BEFORE creating the document to ensure animation timing
        this.newBones.add(boneId);
        
        // Step 1: Create the bone document with serverTimestamp for proper sync
        const bone = {
            id: boneId,
            x: position.x,
            y: position.y,
            type: boneType,
            timestamp: serverTimestamp(), // Use serverTimestamp() for proper sync
            eventId: discoveryEventId
        };
        
        // Step 2: Create both bone and feed entry atomically
        await Promise.all([
            setDoc(doc(this.db, 'bones', boneId), bone),
            setDoc(doc(this.db, 'feed', discoveryEventId), {
                title: 'Ancient Bones Discovered!',
                description: 'Mysterious ancient bones have been unearthed! What secrets do they hold?',
                timestamp: serverTimestamp(),
                action: 'discoverbones',
                boneId: boneId,
                eventId: discoveryEventId
            })
        ]);
        
        console.log('Bone discovery completed with event ID:', discoveryEventId);
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to discover bones:', error);
        this.showNotification('error', 'Discovery Failed', 'Failed to discover bones. Please try again.', 5000);
        // Remove from newBones if creation failed
        this.newBones.delete(boneId);
    }
}

  // Add this entire method right after performDiscoverBones()
async performBuildFirepit() {
    const position = this.findValidFirepitPosition();
    const firepitId = 'firepit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const firepitType = 'firepit1'; // Always start with fire1, animation will cycle through all
    
    // Create a unique firepit event ID with timestamp to prevent any possibility of collision
    const firepitEventId = `firepit-build-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    
    try {
        // IMPORTANT: Mark firepit as new BEFORE creating the document to ensure animation timing
        this.newFirepits.add(firepitId);
        
        // Step 1: Create the firepit document with serverTimestamp for proper sync
        const firepit = {
            id: firepitId,
            x: position.x,
            y: position.y,
            type: firepitType,
            timestamp: serverTimestamp(), // Use serverTimestamp() for proper sync
            eventId: firepitEventId
        };
        
        // Step 2: Create both firepit and feed entry atomically
        await Promise.all([
            setDoc(doc(this.db, 'firepits', firepitId), firepit),
            setDoc(doc(this.db, 'feed', firepitEventId), {
                title: 'Firepit Built',
                description: 'A cozy firepit has been constructed! Warm flames dance and smoke rises into the sky.',
                timestamp: serverTimestamp(),
                action: 'buildfirepit',
                firepitId: firepitId,
                eventId: firepitEventId
            })
        ]);
        
        console.log('Firepit building completed with event ID:', firepitEventId);
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to build firepit:', error);
        this.showNotification('error', 'Building Failed', 'Failed to build firepit. Please try again.', 5000);
        // Remove from newFirepits if creation failed
        this.newFirepits.delete(firepitId);
    }
}  

    async performDropEgg() {
    // Generate random position for egg drop
    const worldSize = this.getVirtualWorldSize();
    const eggWidth = 48; // Same size as throngs
    const eggHeight = 48;
    
    const targetX = Math.random() * (worldSize.width - eggWidth);
    const targetY = Math.random() * (worldSize.height - eggHeight);
    
    // Create unique egg event ID
    const eggEventId = `egg-drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const eggId = 'egg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
        // IMPORTANT: Mark egg as new BEFORE creating the document to ensure animation timing
        this.newEggs.add(eggId);
        
        // Create the egg drop action for animation
        await addDoc(collection(this.db, 'actions'), {
            type: 'dropegg',
            targetX: targetX,
            targetY: targetY,
            eggId: eggId, // Add egg ID to action
            timestamp: serverTimestamp(),
            eventId: eggEventId
        });
        
        // Create the permanent egg document
        await setDoc(doc(this.db, 'eggs', eggId), {
            id: eggId,
            x: targetX,
            y: targetY,
            type: 'egg',
            timestamp: serverTimestamp(),
            eventId: eggEventId
        });
        
        // Create feed entry immediately
        await setDoc(doc(this.db, 'feed', `egg-drop-${eggEventId}`), {
            title: 'Egg Dropped!',
            description: 'A mysterious egg has fallen from the sky! What could be inside?',
            timestamp: serverTimestamp(),
            action: 'dropegg',
            eventId: eggEventId,
            eggId: eggId
        });
        
        console.log('Egg drop triggered with event ID:', eggEventId);
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to drop egg:', error);
        this.showNotification('error', 'Egg Drop Failed', 'Failed to drop egg. Please try again.', 5000);
        // Remove from newEggs if creation failed
        this.newEggs.delete(eggId);
    }
}

   async performCrashUFO() {
    // Generate random position for UFO crash
    const worldSize = this.getVirtualWorldSize();
    const ufoWidth = 84; // Correct UFO width
    const ufoHeight = 51; // Correct UFO height
    
    const targetX = Math.random() * (worldSize.width - ufoWidth);
    const targetY = Math.random() * (worldSize.height - ufoHeight);
    
    // Create unique UFO event ID
    const ufoEventId = `ufo-crash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ufoId = 'ufo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
    // IMPORTANT: Mark UFO as new AND animating BEFORE creating the document
    this.newUFOs.add(ufoId);
    this.animatingUFOs.add(ufoId); // Mark as currently animating
        
        // Create the UFO crash action for animation
        await addDoc(collection(this.db, 'actions'), {
            type: 'crashufo',
            targetX: targetX,
            targetY: targetY,
            ufoId: ufoId, // Add UFO ID to action
            timestamp: serverTimestamp(),
            eventId: ufoEventId
        });
        
        // Create the permanent UFO document
        await setDoc(doc(this.db, 'ufos', ufoId), {
            id: ufoId,
            x: targetX,
            y: targetY,
            type: 'crashed',
            timestamp: serverTimestamp(),
            eventId: ufoEventId
        });
        
        // Create feed entry immediately
        await setDoc(doc(this.db, 'feed', `ufo-crash-${ufoEventId}`), {
            title: 'UFO CRASH!',
            description: 'A mysterious UFO has crashed from the sky! Smoke billows from the wreckage.',
            timestamp: serverTimestamp(),
            action: 'crashufo',
            eventId: ufoEventId,
            ufoId: ufoId
        });
        
        console.log('UFO crash triggered with event ID:', ufoEventId);
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to crash UFO:', error);
        this.showNotification('error', 'UFO Crash Failed', 'Failed to crash UFO. Please try again.', 5000);
        // Remove from newUFOs if creation failed
        this.newUFOs.delete(ufoId);
    }
}
    
createThrong(id, data) {
    if (this.throngs.has(id)) return;
    
    let finalData = Object.assign({}, data);
    
    if (this.savedPositions[id]) {
        finalData.x = this.savedPositions[id].x;
        finalData.y = this.savedPositions[id].y;
        finalData.currentSprite = this.savedPositions[id].currentSprite;
    } else {
        const worldSize = this.getVirtualWorldSize();
        
        const centerX = worldSize.width * 0.3 + Math.random() * (worldSize.width * 0.4);
        const centerY = worldSize.height * 0.3 + Math.random() * (worldSize.height * 0.4);
        
        finalData.x = centerX;
        finalData.y = centerY;
    }
    
    // Ensure timestamp exists - if not, add current time
    if (!finalData.timestamp) {
        finalData.timestamp = new Date();
    }
    
    // Ensure traits exist in finalData
    if (!finalData.traits) {
        finalData.traits = []; // Empty array if no traits
    }
    
    const throngElement = document.createElement('div');
    throngElement.className = 'throng';
    throngElement.id = id;
    throngElement.style.position = 'absolute';
    throngElement.style.left = finalData.x + 'px';
    throngElement.style.top = finalData.y + 'px';
    throngElement.style.width = '48px';
    throngElement.style.height = '48px';
    throngElement.style.backgroundSize = 'contain';
    throngElement.style.backgroundRepeat = 'no-repeat';
    throngElement.style.imageRendering = 'pixelated';
    
    const spriteUrl = this.sprites[finalData.currentSprite] || this.sprites.idle;
    throngElement.style.backgroundImage = 'url(' + spriteUrl + ')';
    
    const timeDiff = data.timestamp ? Date.now() - new Date(data.timestamp).getTime() : 0;
    const isNewborn = timeDiff < 15000;
    
    if (isNewborn || this.newThrongs.has(id)) {
        this.createBirthAnimation(throngElement, finalData.x, finalData.y);
        this.newThrongs.delete(id);
    }
    
    this.worldContainer.appendChild(throngElement);
    
    const throng = {
        element: throngElement,
        data: finalData,
        behaviorInterval: null,
        animationInterval: null
    };
    
    this.throngs.set(id, throng);
    this.startThronsAI(id);
    
    // Add name label if throng has a name
    if (finalData.name) {
        this.createThrongNameLabel(throng, finalData.name);
    }

    // Always add hover functionality with traits (even if empty)
    this.addTraitsHover(throng, finalData.traits || []);
    
    this.refreshFeedHoverability();
}

    updateThrong(id, data) {
    const throng = this.throngs.get(id);
    if (!throng) return;
    
    // Store old data for comparison - handle undefined/null cases
    const oldName = throng.data.name || '';
    const oldTraits = throng.data.traits;
    
    // Check if this is a naming update
    const isNamingUpdate = data.name && data.namedAt && data.namedBy;
    
    // Only update position if this is NOT a naming update and we're not using saved positions
    if (!isNamingUpdate && !this.savedPositions[id] && data.x !== undefined && data.y !== undefined) {
        throng.data.x = data.x;
        throng.data.y = data.y;
        throng.element.style.left = data.x + 'px';
        throng.element.style.top = data.y + 'px';
    }
    
    // Update all non-position data
    Object.keys(data).forEach(key => {
        if (key !== 'x' && key !== 'y') {
            throng.data[key] = data[key];
        }
    });
    
    // IMPROVED: More robust name change detection and handling
    const newName = data.name || '';
    if (newName && newName !== oldName) {
        // Always create/update the name label when there's a name change
        this.createThrongNameLabel(throng, newName);
        // Refresh hover functionality
        this.addTraitsHover(throng, throng.data.traits || []);
    }
    
    // Handle trait changes
    if (data.traits !== undefined && JSON.stringify(data.traits) !== JSON.stringify(oldTraits)) {
        this.addTraitsHover(throng, data.traits || []);
    }
    
    this.updateZIndexes();
}
    
    createBirthAnimation(throngElement, x, y) {
        throngElement.style.transform = 'scale(0)';
        throngElement.style.animation = 'popWithGoldenParticles 1.2s ease-out forwards';
        
        if (!document.getElementById('popStyles')) {
            const style = document.createElement('style');
            style.id = 'popStyles';
            style.textContent = `
                @keyframes popWithGoldenParticles { 
                    0% { 
                        transform: scale(0);
                        filter: drop-shadow(0 0 0 transparent);
                    } 
                    20% {
                        transform: scale(1.3);
                        filter: drop-shadow(0 0 8px #ffd700) drop-shadow(4px 4px 4px #ffed4e) drop-shadow(-4px -4px 4px #fff700);
                    }
                    40% { 
                        transform: scale(1.3);
                        filter: drop-shadow(0 0 12px #ffd700) drop-shadow(6px 0 6px #ffb347) drop-shadow(-6px 0 6px #ffe135);
                    }
                    60% {
                        transform: scale(1.1);
                        filter: drop-shadow(0 0 8px #ffd700) drop-shadow(0 6px 4px #ffdf00) drop-shadow(0 -6px 4px #ffc107);
                    }
                    80% {
                        transform: scale(1.05);
                        filter: drop-shadow(0 0 4px #ffd700);
                    }
                    100% { 
                        transform: scale(1);
                        filter: drop-shadow(0 0 0 transparent);
                    } 
                }
            `;
            document.head.appendChild(style);
        }
    }
    
pdateThrong(id, data) {
    const throng = this.throngs.get(id);
    if (!throng) return;
    
    // Store old data for comparison
    const oldName = throng.data.name;
    const oldTraits = throng.data.traits;
    
    // FIXED: Only update position if this is NOT a naming update and we're not using saved positions
    const isNamingUpdate = data.name && data.namedAt && data.namedBy;
    
    if (!isNamingUpdate && !this.savedPositions[id] && data.x !== undefined && data.y !== undefined) {
        // This is a real position update (like from breeding, spawning, etc.)
        throng.data.x = data.x;
        throng.data.y = data.y;
        throng.element.style.left = data.x + 'px';
        throng.element.style.top = data.y + 'px';
    }
    
    // Always update non-position data like name, traits, etc.
    Object.keys(data).forEach(key => {
        if (key !== 'x' && key !== 'y') {
            throng.data[key] = data[key];
        }
    });
    
    // Handle name changes - just add name tag, no position change
    if (data.name && data.name !== oldName) {
        this.createThrongNameLabel(throng, data.name);
        // Force refresh of hover functionality when name is added
        this.addTraitsHover(throng, throng.data.traits || []);
    }
    
    // Handle trait changes
    if (data.traits !== undefined && JSON.stringify(data.traits) !== JSON.stringify(oldTraits)) {
        // Always refresh hover functionality when traits change
        this.addTraitsHover(throng, data.traits || []);
    }
    
    this.updateZIndexes();
}
    
// Fix 5: Update removeThrong to clean up event listeners properly
removeThrong(id) {
    const throng = this.throngs.get(id);
    if (throng) {
        clearInterval(throng.behaviorInterval);
        clearInterval(throng.animationInterval);
        if (throng.walkingInterval) clearInterval(throng.walkingInterval);
        if (throng.loveEffectCleanup) throng.loveEffectCleanup();
        
        // ADDED: Clean up hover event listeners
        if (throng._hoverEnterHandler) {
            throng.element.removeEventListener('mouseenter', throng._hoverEnterHandler);
        }
        if (throng._hoverLeaveHandler) {
            throng.element.removeEventListener('mouseleave', throng._hoverLeaveHandler);
        }
        
        throng.element.remove();
        this.throngs.delete(id);
        
        delete this.savedPositions[id];
        this.saveThrongPositions();
    }
}
    
// Update createHouse to accept shouldAnimate parameter:
createHouse(id, data, shouldAnimate = false) {
    if (this.houses.has(id)) return;
    
    const houseContainer = document.createElement('div');
    houseContainer.className = 'house';
    houseContainer.id = id;
    houseContainer.style.position = 'absolute';
    houseContainer.style.left = data.x + 'px';
    houseContainer.style.top = data.y + 'px';
    houseContainer.style.zIndex = '50';
    
    this.worldContainer.appendChild(houseContainer);
    this.houses.set(id, { element: houseContainer, data: data });
    
    // Check if this client initiated the building OR if explicitly told to animate
    const clientInitiated = this.newHouses.has(id);
    if (clientInitiated) {
        this.newHouses.delete(id);
    }
    
    if (clientInitiated || shouldAnimate) {
        this.buildHouseAnimation(houseContainer, data.type, data.x, data.y);
    } else {
        this.buildHouseInstantly(houseContainer, data.type);
    }
}

    createTree(id, data, shouldAnimate = false) {
    if (this.trees.has(id)) return;
    
    const treeContainer = document.createElement('div');
    treeContainer.className = 'tree';
    treeContainer.id = id;
    treeContainer.style.position = 'absolute';
    treeContainer.style.left = data.x + 'px';
    treeContainer.style.top = data.y + 'px';
    treeContainer.style.zIndex = '50';
    
    this.worldContainer.appendChild(treeContainer);
    this.trees.set(id, { element: treeContainer, data: data });
    
    // Check if this client initiated the planting OR if explicitly told to animate
    const clientInitiated = this.newTrees.has(id);
    if (clientInitiated) {
        this.newTrees.delete(id);
    }
    
    if (clientInitiated || shouldAnimate) {
        this.buildTreeAnimation(treeContainer, data.type, data.x, data.y);
    } else {
        this.buildTreeInstantly(treeContainer, data.type);
    }
}

    createEgg(id, data) {
    if (this.eggs.has(id)) return;
    
    const eggContainer = document.createElement('div');
    eggContainer.className = 'egg';
    eggContainer.id = id;
    eggContainer.style.position = 'absolute';
    eggContainer.style.left = data.x + 'px';
    eggContainer.style.top = data.y + 'px';
    eggContainer.style.zIndex = '50';
    
    this.worldContainer.appendChild(eggContainer);
    this.eggs.set(id, { element: eggContainer, data: data });
        // Update mysteries counter

    
    // Check if this client initiated the drop OR if it's currently being animated by any client
    const clientInitiated = this.newEggs.has(id);
    const currentlyAnimating = this.animatingEggs.has(id);
    
    if (clientInitiated || currentlyAnimating) {
        this.newEggs.delete(id);
        // Don't show the egg immediately - let the animation handle it
        eggContainer.style.display = 'none';
    } else {
        // This is an existing egg, show it immediately
        this.buildEggInstantly(eggContainer);
    }
}

buildEggInstantly(container) {
    const eggSprite = this.eggSprites.egg;
    
    const eggImg = document.createElement('img');
    eggImg.src = eggSprite;
    eggImg.style.imageRendering = 'pixelated';
    eggImg.style.display = 'block';
    eggImg.style.width = '36px';
    eggImg.style.height = '48px';
    
    container.appendChild(eggImg);
}

removeEgg(id) {
    const egg = this.eggs.get(id);
    if (egg) {
        egg.element.remove();
        this.eggs.delete(id);
    }
}

listenToUFOs() {
    onSnapshot(collection(this.db, 'ufos'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                this.createUFO(change.doc.id, change.doc.data());
            } else if (change.type === 'removed') {
                this.removeUFO(change.doc.id);
            }
        });
        
        this.updateZIndexes();
    });
}

createUFO(id, data) {
    if (this.ufos.has(id)) return;
    
    const ufoContainer = document.createElement('div');
    ufoContainer.className = 'ufo';
    ufoContainer.id = id;
    ufoContainer.style.position = 'absolute';
    ufoContainer.style.left = data.x + 'px';
    ufoContainer.style.top = data.y + 'px';
    ufoContainer.style.zIndex = '50';
    
    this.worldContainer.appendChild(ufoContainer);
    this.ufos.set(id, { element: ufoContainer, data: data });
    // Update mysteries counter

    
    // Check if this client initiated the crash OR if it's currently being animated by any client
    const clientInitiated = this.newUFOs.has(id);
    const currentlyAnimating = this.animatingUFOs.has(id);
    
    if (clientInitiated || currentlyAnimating) {
        this.newUFOs.delete(id);
        // Don't show the UFO immediately - let the animation handle it
        ufoContainer.style.display = 'none';
    } else {
        // This is an existing UFO that's not being animated, show it immediately
        this.buildCrashedUFO(ufoContainer);
        // Start smoking effect for existing UFOs
        const ufoData = this.ufos.get(id);
        this.startUFOSmokingEffect(ufoData);
    }
}

buildCrashedUFO(container) {
    const ufoSprite = this.ufoSprites.ufo2;
    
    const ufoImg = document.createElement('img');
    ufoImg.src = ufoSprite;
    ufoImg.style.imageRendering = 'pixelated';
    ufoImg.style.display = 'block';
    ufoImg.style.width = '84px';
    ufoImg.style.height = '51px';
    
    container.appendChild(ufoImg);
}

removeUFO(id) {
    const ufo = this.ufos.get(id);
    if (ufo) {
        // Clean up smoking effect
        if (ufo.smokingInterval) {
            clearInterval(ufo.smokingInterval);
        }
        ufo.element.remove();
        this.ufos.delete(id);
    }
}

buildTreeInstantly(container, treeType) {
    const treeSprite = this.treeSprites[treeType] || this.treeSprites.tree1;
    
    const treeImg = document.createElement('img');
    treeImg.src = treeSprite;
    treeImg.style.imageRendering = 'pixelated';
    treeImg.style.display = 'block';
    
    container.appendChild(treeImg);
}

buildTreeAnimation(container, treeType, x, y) {
    const treeSprite = this.treeSprites[treeType] || this.treeSprites.tree1;
    
    const treeImg = document.createElement('img');
    treeImg.src = treeSprite;
    treeImg.style.imageRendering = 'pixelated';
    treeImg.style.display = 'block';
    treeImg.style.animation = 'growTree 2s ease-out forwards';
    
 // Replace the CSS in your buildHouseAnimation method with this improved version:

if (!document.getElementById('buildHouseStyles')) {
    const style = document.createElement('style');
    style.id = 'buildHouseStyles';
    style.textContent = `
        @keyframes buildHousePixelated {
            0% {
                clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
            }
            100% {
                clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
            }
        }
        @keyframes collapseHouseTopDown {
    0% {
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
        opacity: 1;
        filter: brightness(1);
    }
    25% {
        clip-path: polygon(0% 25%, 100% 25%, 100% 100%, 0% 100%);
        opacity: 0.9;
        filter: brightness(0.8);
    }
    50% {
        clip-path: polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%);
        opacity: 0.7;
        filter: brightness(0.6) hue-rotate(20deg);
    }
    75% {
        clip-path: polygon(0% 75%, 100% 75%, 100% 100%, 0% 100%);
        opacity: 0.5;
        filter: brightness(0.4) hue-rotate(40deg);
    }
    100% {
        clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
        opacity: 0;
        filter: brightness(0.2) hue-rotate(60deg);
    }
}
        @keyframes growTree {
            0% {
                transform: scale(0) scaleY(0.1);
                transform-origin: center bottom;
            }
            50% {
                transform: scale(0.7) scaleY(0.8);
                transform-origin: center bottom;
            }
            100% {
                transform: scale(1) scaleY(1);
                transform-origin: center bottom;
            }
        }
        @keyframes collapseTree {
            0% {
                transform: scale(1) scaleY(1);
                transform-origin: center bottom;
                opacity: 1;
            }
            100% {
                transform: scale(0.1) scaleY(0);
                transform-origin: center bottom;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
    
    container.appendChild(treeImg);
    
    // Add particle effects during tree growth
    setTimeout(() => {
        this.createTreeGrowthEffect(x, y);
    }, 500);
    
    setTimeout(() => {
        this.createTreeGrowthEffect(x, y);
    }, 1500);
}

createTreeGrowthEffect(x, y) {
    const colors = ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#ADFF2F', '#9ACD32'];
    const treeWidth = 39;
    const treeHeight = 54;
    const numParticles = 15;
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        const particleX = x + Math.random() * treeWidth;
        const particleY = y + Math.random() * treeHeight;
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '998';
        particle.style.borderRadius = '50%';
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = 20 + Math.random() * 15;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - Math.random() * 10;
        
        particle.style.transform = 'translate(0, 0) scale(1)';
        particle.style.opacity = '1';
        particle.style.transition = 'all 0.6s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
            particle.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            particle.remove();
        }, 700);
    }
}
    
    buildHouseInstantly(container, houseType) {
        const houseSprite = this.houseSprites[houseType] || this.houseSprites.house1;
        
        const houseImg = document.createElement('img');
        houseImg.src = houseSprite;
        houseImg.style.imageRendering = 'pixelated';
        houseImg.style.display = 'block';
        
        container.appendChild(houseImg);
    }
    
    buildHouseAnimation(container, houseType, x, y) {
    const houseSprite = this.houseSprites[houseType] || this.houseSprites.house1;
    
    const houseImg = document.createElement('img');
    houseImg.src = houseSprite;
    houseImg.style.imageRendering = 'pixelated';
    houseImg.style.display = 'block';
    houseImg.style.animation = 'buildHousePixelated 2s ease-out forwards';
    
    if (!document.getElementById('buildHouseStyles')) {
        const style = document.createElement('style');
        style.id = 'buildHouseStyles';
        style.textContent = `
            @keyframes buildHousePixelated {
                0% {
                    clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
                }
                100% {
                    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
                }
            }
            @keyframes collapseHouseTopDown {
                0% {
                    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
                    opacity: 1;
                    filter: brightness(1);
                }
                25% {
                    clip-path: polygon(0% 25%, 100% 25%, 100% 100%, 0% 100%);
                    opacity: 0.9;
                    filter: brightness(0.8);
                }
                50% {
                    clip-path: polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%);
                    opacity: 0.7;
                    filter: brightness(0.6) hue-rotate(20deg);
                }
                75% {
                    clip-path: polygon(0% 75%, 100% 75%, 100% 100%, 0% 100%);
                    opacity: 0.5;
                    filter: brightness(0.4) hue-rotate(40deg);
                }
                100% {
                    clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
                    opacity: 0;
                    filter: brightness(0.2) hue-rotate(60deg);
                }
            }
            @keyframes growTree {
                0% {
                    transform: scale(0) scaleY(0.1);
                    transform-origin: center bottom;
                }
                50% {
                    transform: scale(0.7) scaleY(0.8);
                    transform-origin: center bottom;
                }
                100% {
                    transform: scale(1) scaleY(1);
                    transform-origin: center bottom;
                }
            }
            @keyframes collapseTree {
                0% {
                    transform: scale(1) scaleY(1);
                    transform-origin: center bottom;
                    opacity: 1;
                }
                100% {
                    transform: scale(0.1) scaleY(0);
                    transform-origin: center bottom;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    container.appendChild(houseImg);
    
    setTimeout(() => {
        this.createHouseConstructionEffect(x, y);
    }, 500);
    
    setTimeout(() => {
        this.createHouseConstructionEffect(x, y);
    }, 1900);
}
    
    createHouseConstructionEffect(x, y) {
        const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#D2B48C'];
        const houseWidth = 126;
        const houseHeight = 120;
        const numParticles = 25;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            
            const particleX = x + Math.random() * houseWidth;
            const particleY = y + Math.random() * houseHeight;
            
            particle.style.position = 'absolute';
            particle.style.left = particleX + 'px';
            particle.style.top = particleY + 'px';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '998';
            particle.style.borderRadius = '50%';
            
            const angle = Math.random() * 2 * Math.PI;
            const distance = 30 + Math.random() * 20;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance - Math.random() * 10;
            
            particle.style.transform = 'translate(0, 0) scale(1)';
            particle.style.opacity = '1';
            particle.style.transition = 'all 0.8s ease-out';
            
            this.worldContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
                particle.style.opacity = '0';
            }, 50);
            
            setTimeout(() => {
                particle.remove();
            }, 900);
        }
    }

    removeHouse(id) {
    const house = this.houses.get(id);
    if (house) {
        // Check if there's a collapse animation currently running
        const houseImg = house.element.querySelector('img');
        if (houseImg && houseImg.style.animation && houseImg.style.animation.includes('collapseHouseTopDown')) {
            // Animation is running - delay the removal until it completes
            console.log('House has running collapse animation, delaying removal for 2 seconds');
            setTimeout(() => {
                if (this.houses.has(id)) { // Double-check it still exists
                    house.element.remove();
                    this.houses.delete(id);
                    console.log('House removed after animation completion');
                }
            }, 2000); // Wait for the 2-second collapse animation to complete
        } else {
            // No collapse animation running - remove immediately (normal case)
            house.element.remove();
            this.houses.delete(id);
        }
    }
}

    // ADD ALL OF THESE FUNCTIONS RIGHT AFTER removeHouse(id):

listenToApartments() {
    onSnapshot(collection(this.db, 'apartments'), (snapshot) => {
        // On first snapshot, mark initial load as complete after processing
        const isInitialLoad = !this.initialApartmentLoadComplete;
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                // If this is initial load, don't animate
                // If this is after initial load, always animate (it's truly new)
                this.createApartment(change.doc.id, change.doc.data(), !isInitialLoad);
            } else if (change.type === 'removed') {
                this.removeApartment(change.doc.id);
            }
        });
        
        // Mark initial load as complete after first snapshot
        if (isInitialLoad) {
            this.initialApartmentLoadComplete = true;
        }
    });
}

createApartment(id, data, shouldAnimate = false) {
    if (this.apartments.has(id)) return;
    
    const apartmentContainer = document.createElement('div');
    apartmentContainer.className = 'apartment';
    apartmentContainer.id = id;
    apartmentContainer.style.position = 'absolute';
    apartmentContainer.style.left = data.x + 'px';
    apartmentContainer.style.top = data.y + 'px';
    apartmentContainer.style.zIndex = '50';
    
    this.worldContainer.appendChild(apartmentContainer);
    this.apartments.set(id, { element: apartmentContainer, data: data });
    
    // Check if this client initiated the building OR if explicitly told to animate
    const clientInitiated = this.newApartments.has(id);
    if (clientInitiated) {
        this.newApartments.delete(id);
    }
    
    if (clientInitiated || shouldAnimate) {
        this.buildApartmentAnimation(apartmentContainer, data.type, data.x, data.y);
    } else {
        this.buildApartmentInstantly(apartmentContainer, data.type);
    }
}

buildApartmentInstantly(container, apartmentType) {
    const apartmentSprite = this.apartmentSprites[apartmentType] || this.apartmentSprites.apartment1;
    
    const apartmentImg = document.createElement('img');
    apartmentImg.src = apartmentSprite;
    apartmentImg.style.imageRendering = 'pixelated';
    apartmentImg.style.display = 'block';
    
    container.appendChild(apartmentImg);
}

buildApartmentAnimation(container, apartmentType, x, y) {
    const apartmentSprite = this.apartmentSprites[apartmentType] || this.apartmentSprites.apartment1;
    
    const apartmentImg = document.createElement('img');
    apartmentImg.src = apartmentSprite;
    apartmentImg.style.imageRendering = 'pixelated';
    apartmentImg.style.display = 'block';
    
    // ADD THIS BLOCK RIGHT HERE:
    if (!document.getElementById('buildApartmentStyles')) {
        const style = document.createElement('style');
        style.id = 'buildApartmentStyles';
        style.textContent = `
            @keyframes buildApartmentPixelated {
                0% {
                    clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
                }
                100% {
                    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
                }
            }
            @keyframes collapseApartmentTopDown {
                0% {
                    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
                    opacity: 1;
                    filter: brightness(1);
                }
                25% {
                    clip-path: polygon(0% 25%, 100% 25%, 100% 100%, 0% 100%);
                    opacity: 0.9;
                    filter: brightness(0.8);
                }
                50% {
                    clip-path: polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%);
                    opacity: 0.7;
                    filter: brightness(0.6) hue-rotate(20deg);
                }
                75% {
                    clip-path: polygon(0% 75%, 100% 75%, 100% 100%, 0% 100%);
                    opacity: 0.5;
                    filter: brightness(0.4) hue-rotate(40deg);
                }
                100% {
                    clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
                    opacity: 0;
                    filter: brightness(0.2) hue-rotate(60deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    apartmentImg.style.animation = 'buildApartmentPixelated 2s ease-out forwards';
    
    container.appendChild(apartmentImg);
    
    setTimeout(() => {
        this.createApartmentConstructionEffect(x, y);
    }, 500);
    
    setTimeout(() => {
        this.createApartmentConstructionEffect(x, y);
    }, 1900);
}

createApartmentConstructionEffect(x, y) {
    const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#D2B48C'];
    const apartmentWidth = 156;
    const apartmentHeight = 213;
    const numParticles = 35; // More particles for larger building
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        const particleX = x + Math.random() * apartmentWidth;
        const particleY = y + Math.random() * apartmentHeight;
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = (8 + Math.random() * 8) + 'px';
        particle.style.height = (8 + Math.random() * 8) + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '998';
        particle.style.borderRadius = '50%';
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = 30 + Math.random() * 20;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - Math.random() * 10;
        
        particle.style.transform = 'translate(0, 0) scale(1)';
        particle.style.opacity = '1';
        particle.style.transition = 'all 0.8s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
            particle.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            particle.remove();
        }, 900);
    }
}

removeApartment(id) {
    const apartment = this.apartments.get(id);
    if (apartment) {
        // Check if there's a collapse animation currently running
        const apartmentImg = apartment.element.querySelector('img');
        if (apartmentImg && apartmentImg.style.animation && apartmentImg.style.animation.includes('collapseHouseTopDown')) {
            // Animation is running - delay the removal until it completes
            console.log('Apartment has running collapse animation, delaying removal for 2 seconds');
            setTimeout(() => {
                if (this.apartments.has(id)) { // Double-check it still exists
                    apartment.element.remove();
                    this.apartments.delete(id);
                    console.log('Apartment removed after animation completion');
                }
            }, 2000); // Wait for the 2-second collapse animation to complete
        } else {
            // No collapse animation running - remove immediately (normal case)
            apartment.element.remove();
            this.apartments.delete(id);
        }
    }
}

async performApartmentBuilding() {
    const position = this.findValidApartmentPosition();
    const apartmentId = 'apartment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const apartmentType = 'apartment1';
    
    // Create a unique building event ID with timestamp to prevent any possibility of collision
    const buildingEventId = `apartment-building-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    
    try {
        // IMPORTANT: Mark apartment as new BEFORE creating the document to ensure animation timing
        this.newApartments.add(apartmentId);
        
        // Step 1: Create the apartment document with serverTimestamp for proper sync
        const apartment = {
            id: apartmentId,
            x: position.x,
            y: position.y,
            type: apartmentType,
            timestamp: serverTimestamp(), // Use serverTimestamp() instead of new Date()
            eventId: buildingEventId
        };
        
        // Step 2: Create both apartment and feed entry atomically
        await Promise.all([
            setDoc(doc(this.db, 'apartments', apartmentId), apartment),
            setDoc(doc(this.db, 'feed', buildingEventId), {
                title: 'Apartment Built',
                description: 'A new apartment building has been constructed! The settlement grows ever taller.',
                timestamp: serverTimestamp(),
                action: 'apartment-building',
                apartmentId: apartmentId,
                eventId: buildingEventId
            })
        ]);
        
        console.log('Apartment building completed with event ID:', buildingEventId);
        
        // Update server stats for apartment build (same as house)
        this.onHouseBuild();
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
    } catch (error) {
        console.error('Failed to create apartment building:', error);
        this.showNotification('error', 'Building Failed', 'Failed to create apartment. Please try again.', 5000);
        // Remove from newApartments if creation failed
        this.newApartments.delete(apartmentId);
    }
}

isPositionValidForApartment(x, y) {
    const apartmentWidth = 156;
    const apartmentHeight = 213;
    const buffer = 10; // 10px invisible barrier
    
    // Check against other apartments
    for (let [id, apartment] of this.apartments) {
        const dx = Math.abs(x - apartment.data.x);
        const dy = Math.abs(y - apartment.data.y);
        
        if (dx < (apartmentWidth + buffer) && dy < (apartmentHeight + buffer)) {
            return false;
        }
    }
    
    // Check against houses
    for (let [id, house] of this.houses) {
        const houseWidth = 126;
        const houseHeight = 120;
        const dx = Math.abs(x - house.data.x);
        const dy = Math.abs(y - house.data.y);
        
        // Calculate overlap considering both building sizes and buffer
        const combinedBufferX = (apartmentWidth + houseWidth) / 2 + buffer;
        const combinedBufferY = (apartmentHeight + houseHeight) / 2 + buffer;
        
        if (dx < combinedBufferX && dy < combinedBufferY) {
            return false;
        }
    }
    
    return true;
}

findValidApartmentPosition() {
    const worldSize = this.getVirtualWorldSize();
    const apartmentWidth = 156;
    const apartmentHeight = 213;
    const edgeBuffer = 25; // Distance from world edges
    
    let attempts = 0;
    const maxAttempts = 100; // Increased attempts for better placement
    
    while (attempts < maxAttempts) {
        const x = Math.random() * (worldSize.width - apartmentWidth - edgeBuffer * 2) + edgeBuffer;
        const y = Math.random() * (worldSize.height - apartmentHeight - edgeBuffer * 2) + edgeBuffer;
        
        if (this.isPositionValidForApartment(x, y)) {
            return { x, y };
        }
        attempts++;
    }
    
    // Fallback if no valid position found after max attempts
    console.warn('Could not find valid apartment position after', maxAttempts, 'attempts');
    return {
        x: Math.random() * (worldSize.width - apartmentWidth),
        y: Math.random() * (worldSize.height - apartmentHeight)
    };
}
    
    removeTree(id) {
        const tree = this.trees.get(id);
        if (tree) {
            tree.element.remove();
            this.trees.delete(id);
        }
    }

    createBone(id, data, shouldAnimate = false) {
    if (this.bones.has(id)) return;
    
    const boneContainer = document.createElement('div');
    boneContainer.className = 'bone';
    boneContainer.id = id;
    boneContainer.style.position = 'absolute';
    boneContainer.style.left = data.x + 'px';
    boneContainer.style.top = data.y + 'px';
    boneContainer.style.zIndex = '50';
    
    this.worldContainer.appendChild(boneContainer);
    this.bones.set(id, { element: boneContainer, data: data });
       // Update mysteries counter

    
    // Check if this client initiated the discovery OR if explicitly told to animate
    const clientInitiated = this.newBones.has(id);
    if (clientInitiated) {
        this.newBones.delete(id);
    }
    
    if (clientInitiated || shouldAnimate) {
        this.buildBoneAnimation(boneContainer, data.type, data.x, data.y);
    } else {
        this.buildBoneInstantly(boneContainer, data.type);
    }
}

buildBoneInstantly(container, boneType) {
    const boneSprite = this.boneSprites[boneType] || this.boneSprites.bones1;
    
    const boneImg = document.createElement('img');
    boneImg.src = boneSprite;
    boneImg.style.imageRendering = 'pixelated';
    boneImg.style.display = 'block';
    
    container.appendChild(boneImg);
}

buildBoneAnimation(container, boneType, x, y) {
    const boneSprite = this.boneSprites[boneType] || this.boneSprites.bones1;
    
    const boneImg = document.createElement('img');
    boneImg.src = boneSprite;
    boneImg.style.imageRendering = 'pixelated';
    boneImg.style.display = 'block';
    boneImg.className = 'bone-discovery-animation';
    boneImg.style.animation = 'boneDiscoveryFadeIn 2.5s ease-out forwards';
    
    // Create bone-specific animation styles - use unique names to avoid conflicts
    if (!document.getElementById('boneDiscoveryStyles')) {
        const style = document.createElement('style');
        style.id = 'boneDiscoveryStyles';
        style.textContent = `
            @keyframes boneDiscoveryFadeIn {
                0% {
                    opacity: 0;
                    transform: scale(0.6);
                    filter: brightness(1.5) blur(1px);
                }
                20% {
                    opacity: 0.3;
                    transform: scale(0.8);
                    filter: brightness(1.3) blur(0.5px);
                }
                50% {
                    opacity: 0.6;
                    transform: scale(0.95);
                    filter: brightness(1.2) blur(0.2px);
                }
                75% {
                    opacity: 0.85;
                    transform: scale(1.02);
                    filter: brightness(1.1);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                    filter: brightness(1);
                }
            }
            
            /* Ensure bone elements don't inherit house animations */
            .bone img {
                animation: none !important;
            }
            
            .bone-discovery-animation {
                animation: boneDiscoveryFadeIn 2.5s ease-out forwards !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    container.appendChild(boneImg);
    
    // First poof effect - early in the fade-in
    setTimeout(() => {
        this.createBoneDiscoveryEffect(x, y);
    }, 400);
    
    // Second poof effect - during the fade-in
    setTimeout(() => {
        this.createBoneDiscoveryEffect(x, y);
    }, 1200);
    
    // Optional third smaller poof near the end
    setTimeout(() => {
        this.createBoneDiscoveryEffect(x, y, 0.6); // Smaller effect
    }, 1800);
}
    
createBoneDiscoveryEffect(x, y, intensity = 1.0) {
    const colors = ['#F5F5DC', '#E6E6E6', '#D3D3D3', '#C0C0C0', '#A9A9A9', '#F0F8FF'];
    const boneWidth = 60;
    const boneHeight = 40;
    const numParticles = Math.floor(20 * intensity); // Scale particles by intensity
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        const particleX = x + Math.random() * boneWidth;
        const particleY = y + Math.random() * boneHeight;
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = (4 + Math.random() * 4) * intensity + 'px'; // Scale size
        particle.style.height = (4 + Math.random() * 4) * intensity + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '998';
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = (25 + Math.random() * 20) * intensity; // Scale distance
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - Math.random() * 10;
        
        particle.style.transform = 'translate(0, 0) scale(1)';
        particle.style.opacity = '1';
        particle.style.transition = 'all 0.7s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
            particle.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            particle.remove();
        }, 750);
    }
}

removeBone(id) {
    const bone = this.bones.get(id);
    if (bone) {
        bone.element.remove();
        this.bones.delete(id);
    }
}

// Add these three methods right after removeBone(id)
createFirepit(id, data, shouldAnimate = false) {
    if (this.firepits.has(id)) return;
    
    const firepitContainer = document.createElement('div');
    firepitContainer.className = 'firepit';
    firepitContainer.id = id;
    firepitContainer.style.position = 'absolute';
    firepitContainer.style.left = data.x + 'px';
    firepitContainer.style.top = data.y + 'px';
    firepitContainer.style.zIndex = '50';
    
    this.worldContainer.appendChild(firepitContainer);
    this.firepits.set(id, { element: firepitContainer, data: data });
    
    // Check if this client initiated the building OR if explicitly told to animate
    const clientInitiated = this.newFirepits.has(id);
    if (clientInitiated) {
        this.newFirepits.delete(id);
    }
    
    if (clientInitiated || shouldAnimate) {
        this.buildFirepitAnimation(firepitContainer, data.type, data.x, data.y);
    } else {
        this.buildFirepitInstantly(firepitContainer, data.type);
    }
}

// Add this entire method right after createBoneDiscoveryEffect()
buildFirepitAnimation(container, firepitType, x, y) {
    const firepitSprite = this.firepitSprites[firepitType] || this.firepitSprites.firepit1;
    
    const firepitImg = document.createElement('img');
    firepitImg.src = firepitSprite;
    firepitImg.style.imageRendering = 'pixelated';
    firepitImg.style.display = 'block';
    firepitImg.className = 'firepit-build-animation';
    firepitImg.style.animation = 'firepitBuildFadeIn 2.5s ease-out forwards';
    
    // Create firepit-specific animation styles
    if (!document.getElementById('firepitBuildStyles')) {
        const style = document.createElement('style');
        style.id = 'firepitBuildStyles';
        style.textContent = `
            @keyframes firepitBuildFadeIn {
                0% {
                    opacity: 0;
                    transform: scale(0.6);
                    filter: brightness(1.5) blur(1px);
                }
                20% {
                    opacity: 0.3;
                    transform: scale(0.8);
                    filter: brightness(1.3) blur(0.5px);
                }
                50% {
                    opacity: 0.6;
                    transform: scale(0.95);
                    filter: brightness(1.2) blur(0.2px);
                }
                75% {
                    opacity: 0.85;
                    transform: scale(1.02);
                    filter: brightness(1.1);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                    filter: brightness(1);
                }
            }
            
            .firepit-build-animation {
                animation: firepitBuildFadeIn 2.5s ease-out forwards !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    container.appendChild(firepitImg);
    
    // First poof effect - early in the fade-in
    setTimeout(() => {
        this.createFirepitBuildEffect(x, y);
    }, 400);
    
    // Second poof effect - during the fade-in
    setTimeout(() => {
        this.createFirepitBuildEffect(x, y);
    }, 1200);
    
    // Third smaller poof near the end
    setTimeout(() => {
        this.createFirepitBuildEffect(x, y, 0.6);
    }, 1800);
    
// Start fire animation and smoking effect after build animation completes
setTimeout(() => {
    const firepitImg = container.querySelector('img');
    if (firepitImg) {
        this.startFirepitAnimation(container, firepitImg);
    }
    
    const firepitData = this.firepits.get(container.id);
    if (firepitData) {
        this.startFirepitSmokingEffect(firepitData);
    }
}, 2500);
}

// Add this right after buildFirepitAnimation()
createFirepitBuildEffect(x, y, intensity = 1.0) {
    const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#654321', '#DEB887'];
    const firepitWidth = 48; // Assuming firepit is 48px wide
    const firepitHeight = 54; // Assuming firepit is 48px tall
    const numParticles = Math.floor(20 * intensity);
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        const particleX = x + Math.random() * firepitWidth;
        const particleY = y + Math.random() * firepitHeight;
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = (4 + Math.random() * 4) * intensity + 'px';
        particle.style.height = (4 + Math.random() * 4) * intensity + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '998';
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = (25 + Math.random() * 20) * intensity;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - Math.random() * 10;
        
        particle.style.transform = 'translate(0, 0) scale(1)';
        particle.style.opacity = '1';
        particle.style.transition = 'all 0.7s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
            particle.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            particle.remove();
        }, 750);
    }
}

buildFirepitInstantly(container, firepitType) {
    const firepitSprite = this.firepitSprites[firepitType] || this.firepitSprites.firepit1;
    
    const firepitImg = document.createElement('img');
    firepitImg.src = firepitSprite;
    firepitImg.style.imageRendering = 'pixelated';
    firepitImg.style.display = 'block';
    
    container.appendChild(firepitImg);
    
    // Start fire animation immediately
    this.startFirepitAnimation(container, firepitImg);
    
    // Start smoking effect for existing firepits
    const firepitData = this.firepits.get(container.id);
    if (firepitData) {
        this.startFirepitSmokingEffect(firepitData);
    }
}

removeFirepit(id) {
    const firepit = this.firepits.get(id);
    if (firepit) {
        // Clean up smoking effect
        if (firepit.smokingInterval) {
            clearInterval(firepit.smokingInterval);
        }
        
        // Clean up fire animation
        if (firepit.fireAnimationInterval) {
            clearInterval(firepit.fireAnimationInterval);
        }
        
        firepit.element.remove();
        this.firepits.delete(id);
    }
}
    
isPositionValidForHouse(x, y) {
    const houseWidth = 126;
    const houseHeight = 120;
    const buffer = 10; // 10px invisible barrier

    // Check against other houses
    for (let [id, house] of this.houses) {
        const dx = Math.abs(x - house.data.x);
        const dy = Math.abs(y - house.data.y);
        
        if (dx < (houseWidth + buffer) && dy < (houseHeight + buffer)) {
            return false;
        }
    }

    // Check against apartments
    for (let [id, apartment] of this.apartments) {
        const apartmentWidth = 156;
        const apartmentHeight = 213;
        const dx = Math.abs(x - apartment.data.x);
        const dy = Math.abs(y - apartment.data.y);
        
        // Calculate overlap considering both building sizes and buffer
        const combinedBufferX = (houseWidth + apartmentWidth) / 2 + buffer;
        const combinedBufferY = (houseHeight + apartmentHeight) / 2 + buffer;
        
        if (dx < combinedBufferX && dy < combinedBufferY) {
            return false;
        }
    }
    
    return true;
}
    
findValidHousePosition() {
    const worldSize = this.getVirtualWorldSize();
    const houseWidth = 126;
    const houseHeight = 120;
    const edgeBuffer = 25; // Distance from world edges
    
    let attempts = 0;
    const maxAttempts = 100; // Increased attempts for better placement
    
    while (attempts < maxAttempts) {
        const x = Math.random() * (worldSize.width - houseWidth - edgeBuffer * 2) + edgeBuffer;
        const y = Math.random() * (worldSize.height - houseHeight - edgeBuffer * 2) + edgeBuffer;
        
        if (this.isPositionValidForHouse(x, y)) {
            return { x, y };
        }
        attempts++;
    }
    
    // Fallback if no valid position found after max attempts
    console.warn('Could not find valid house position after', maxAttempts, 'attempts');
    return {
        x: Math.random() * (worldSize.width - houseWidth),
        y: Math.random() * (worldSize.height - houseHeight)
    };
}
    
    // UPDATED: Use virtual world size instead of getBoundingClientRect
    findValidTreePosition() {
        const worldSize = this.getVirtualWorldSize();
        const treeWidth = 39;
        const treeHeight = 69;
        const houseBuffer = 25;
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = Math.random() * (worldSize.width - treeWidth);
            const y = Math.random() * (worldSize.height - treeHeight);
            
            let validPosition = true;
            for (let [id, house] of this.houses) {
                const houseWidth = 126;
                const houseHeight = 120;
                const dx = Math.abs(x - house.data.x);
                const dy = Math.abs(y - house.data.y);
                
                if (dx < (houseWidth + treeWidth)/2 + houseBuffer && 
                    dy < (houseHeight + treeHeight)/2 + houseBuffer) {
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

    isPositionValidForBone(x, y) {
    const boneWidth = 60; // Approximate bone width
    const boneHeight = 40; // Approximate bone height
    const buffer = 25;
    
    // Check against other bones
    for (let [id, bone] of this.bones) {
        const dx = Math.abs(x - bone.data.x);
        const dy = Math.abs(y - bone.data.y);
        
        if (dx < (boneWidth + buffer) && dy < (boneHeight + buffer)) {
            return false;
        }
    }
    
    // Check against houses
    for (let [id, house] of this.houses) {
        const houseWidth = 126;
        const houseHeight = 120;
        const dx = Math.abs(x - house.data.x);
        const dy = Math.abs(y - house.data.y);
        
        if (dx < (houseWidth + boneWidth)/2 + buffer && 
            dy < (houseHeight + boneHeight)/2 + buffer) {
            return false;
        }
    }
    
    return true;
}

findValidBonePosition() {
    const worldSize = this.getVirtualWorldSize();
    const boneWidth = 60;
    const boneHeight = 40;
    const buffer = 25;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        const x = Math.random() * (worldSize.width - boneWidth - buffer * 2) + buffer;
        const y = Math.random() * (worldSize.height - boneHeight - buffer * 2) + buffer;
        
        if (this.isPositionValidForBone(x, y)) {
            return { x, y };
        }
        attempts++;
    }
    
    return {
        x: Math.random() * (worldSize.width - boneWidth),
        y: Math.random() * (worldSize.height - boneHeight)
    };
}

// Add these two methods right after findValidBonePosition()
isPositionValidForFirepit(x, y) {
    const firepitWidth = 48; // Firepit width
    const firepitHeight = 54; // Firepit height
    const buffer = 25;
    
    // Check against other firepits
    for (let [id, firepit] of this.firepits) {
        const dx = Math.abs(x - firepit.data.x);
        const dy = Math.abs(y - firepit.data.y);
        
        if (dx < (firepitWidth + buffer) && dy < (firepitHeight + buffer)) {
            return false;
        }
    }
    
    // Check against houses
    for (let [id, house] of this.houses) {
        const houseWidth = 126;
        const houseHeight = 120;
        const dx = Math.abs(x - house.data.x);
        const dy = Math.abs(y - house.data.y);
        
        if (dx < (houseWidth + firepitWidth)/2 + buffer && 
            dy < (houseHeight + firepitHeight)/2 + buffer) {
            return false;
        }
    }
    
    // Check against apartments
    for (let [id, apartment] of this.apartments) {
        const apartmentWidth = 156;
        const apartmentHeight = 213;
        const dx = Math.abs(x - apartment.data.x);
        const dy = Math.abs(y - apartment.data.y);
        
        if (dx < (apartmentWidth + firepitWidth)/2 + buffer && 
            dy < (apartmentHeight + firepitHeight)/2 + buffer) {
            return false;
        }
    }
    
    return true;
}

findValidFirepitPosition() {
    const worldSize = this.getVirtualWorldSize();
    const firepitWidth = 48;
    const firepitHeight = 54;
    const buffer = 25;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        const x = Math.random() * (worldSize.width - firepitWidth - buffer * 2) + buffer;
        const y = Math.random() * (worldSize.height - firepitHeight - buffer * 2) + buffer;
        
        if (this.isPositionValidForFirepit(x, y)) {
            return { x, y };
        }
        attempts++;
    }
    
    return {
        x: Math.random() * (worldSize.width - firepitWidth),
        y: Math.random() * (worldSize.height - firepitHeight)
    };
}
    
 async performBreeding() {
    if (this.throngs.size < 2) {
        await addDoc(collection(this.db, 'feed'), {
            title: 'Breeding Failed',
            description: 'You need at least 2 throngs to start breeding!',
            timestamp: serverTimestamp(),
            action: 'breeding'
        });
        return;
    }
    
    const throngIds = Array.from(this.throngs.keys());
    const shuffled = throngIds.sort(() => 0.5 - Math.random());
    const parent1Id = shuffled[0];
    const parent2Id = shuffled[1];
    
    const parent1 = this.throngs.get(parent1Id);
    const parent2 = this.throngs.get(parent2Id);
    
    if (!parent1 || !parent2) return;
    
    const meetingX = (parent1.data.x + parent2.data.x) / 2;
    const meetingY = (parent1.data.y + parent2.data.y) / 2;
    const newThrongId = 'throng_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create a deterministic breeding event ID based on parent IDs to ensure uniqueness across users
    const sortedParentIds = [parent1Id, parent2Id].sort();
    const breedingEventId = `breeding-${sortedParentIds[0]}-${sortedParentIds[1]}-${Date.now()}`;
    
    // Generate traits for the new throng
    let traits = ['Mysterious', 'Curious', 'Brave']; // Default fallback traits
    
    try {
        const traitsResponse = await fetch('/api/claude/generate-traits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (traitsResponse.ok) {
            const traitsData = await traitsResponse.json();
            if (traitsData.traits && Array.isArray(traitsData.traits) && traitsData.traits.length > 0) {
                traits = traitsData.traits;
            }
        }
    } catch (error) {
        // Use fallback traits on error
    }
    
    // Create the action WITH the pre-generated traits
    await addDoc(collection(this.db, 'actions'), {
        type: 'breeding',
        parent1Id: parent1Id,
        parent2Id: parent2Id,
        newThrongId: newThrongId,
        meetingX: meetingX,
        meetingY: meetingY,
        parent1StartX: parent1.data.x,
        parent1StartY: parent1.data.y,
        parent2StartX: parent2.data.x,
        parent2StartY: parent2.data.y,
        timestamp: serverTimestamp(),
        eventId: breedingEventId,
        preGeneratedTraits: traits
    });
    
    // Create breeding notification
    await setDoc(doc(this.db, 'feed', `breeding-start-${breedingEventId}`), {
        title: 'Breeding',
        description: 'Two Emulites have found love! They are coming together to begin breeding.',
        timestamp: serverTimestamp(),
        action: 'breeding',
        eventId: breedingEventId
    });
}
    
async performDeath() {
    // Local throttling - prevent multiple calls within 5 seconds
    const now = Date.now();
    if (this.lastDeathEventTime && (now - this.lastDeathEventTime) < 5000) {
        console.log('Death event throttled - too soon since last call');
        this.showNotification('warning', 'Please Wait', 'Please wait before triggering another death event.', 3000);
        return;
    }
    
    // Set the throttle time immediately
    this.lastDeathEventTime = now;

    if (this.throngs.size === 0 && this.houses.size === 0 && this.trees.size === 0) {
        await addDoc(collection(this.db, 'feed'), {
            title: 'Strike Failed',
            description: 'There is nothing to strike down!',
            timestamp: serverTimestamp(),
            action: 'death'
        });
        return;
    }
    
    const allTargets = [];
    
    this.throngs.forEach((throng, id) => {
        allTargets.push({ type: 'throng', id: id });
    });
    
    this.houses.forEach((house, id) => {
        allTargets.push({ type: 'house', id: id });
    });
    
    this.trees.forEach((tree, id) => {
        allTargets.push({ type: 'tree', id: id });
    });
    
    const target = allTargets[Math.floor(Math.random() * allTargets.length)];
    
    if (target.type === 'throng') {
        // Create unique event ID
        const deathEventId = `lightning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create action first
        await addDoc(collection(this.db, 'actions'), {
            type: 'death',
            victimId: target.id,
            timestamp: serverTimestamp(),
            eventId: deathEventId
        });
        
        // Create ONLY ONE feed entry immediately
        await setDoc(doc(this.db, 'feed', `lightning-strike-${deathEventId}`), {
            title: 'LIGHTNING STRIKE',
            description: 'Lightning strikes from the heavens! An Emulite has met their fate.',
            timestamp: serverTimestamp(),
            action: 'death',
            eventId: deathEventId
        });
        
    } else if (target.type === 'house') {
        const house = this.houses.get(target.id);
        if (house) {
            this.createLightningEffect(house.data.x + 63, house.data.y + 60);
            
            setTimeout(() => {
                addDoc(collection(this.db, 'actions'), {
                    type: 'burnhouse',
                    houseId: target.id,
                    timestamp: serverTimestamp()
                });
            }, 800);
        }
        
        await addDoc(collection(this.db, 'feed'), {
            title: 'House Struck by Lightning',
            description: 'Lightning strikes a house! The building bursts into flames.',
            timestamp: serverTimestamp(),
            action: 'death'
        });
    } else if (target.type === 'tree') {
        const tree = this.trees.get(target.id);
        if (tree) {
            let treeHeight = tree.data.type === 'tree1' ? 54 : 69;
            this.createLightningEffect(tree.data.x + 19, tree.data.y + treeHeight/2);
            
            setTimeout(() => {
                addDoc(collection(this.db, 'actions'), {
                    type: 'burntree',
                    treeId: target.id,
                    timestamp: serverTimestamp()
                });
            }, 800);
        }
        
        await addDoc(collection(this.db, 'feed'), {
            title: 'Tree Struck by Lightning',
            description: 'Lightning strikes a tree! The ancient wood catches fire.',
            timestamp: serverTimestamp(),
            action: 'death'
        });
    }
}
    
async performFire() {
    // Local throttling - prevent multiple calls within 5 seconds
    const now = Date.now();
    if (this.lastFireEventTime && (now - this.lastFireEventTime) < 5000) {
        console.log('Fire event throttled - too soon since last call');
        this.showNotification('warning', 'Please Wait', 'Please wait before triggering another fire event.', 3000);
        return;
    }
    
    // Set the throttle time immediately
    this.lastFireEventTime = now;

    if (this.throngs.size === 0) {
        await addDoc(collection(this.db, 'feed'), {
            title: 'Fire Failed',
            description: 'There are no Emulites to burn!',
            timestamp: serverTimestamp(),
            action: 'fire'
        });
        return;
    }
    
    const throngIds = Array.from(this.throngs.keys());
    const victimId = throngIds[Math.floor(Math.random() * throngIds.length)];
    
    // Create unique event ID
    const fireEventId = `fire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create action first
    await addDoc(collection(this.db, 'actions'), {
        type: 'fire',
        victimId: victimId,
        timestamp: serverTimestamp(),
        eventId: fireEventId
    });
    
    // Create ONLY ONE feed entry immediately
    await setDoc(doc(this.db, 'feed', `fire-strike-${fireEventId}`), {
        title: 'CAUGHT ON FIRE',
        description: 'Flames consume an Emulite! The fire burns bright and deadly.',
        timestamp: serverTimestamp(),
        action: 'fire',
        eventId: fireEventId
    });
}
    
    // Weather events
    async triggerRainEvent() {
        // Create rain effect
        this.createRainEffect();
        
        // Log to weather collection with expiry time
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 180000); // 3 minutes from now
        
        await addDoc(collection(this.db, 'weather'), {
            type: 'rain',
            title: 'Thunderstorm!',
            description: 'Dark clouds gather overhead as a mighty thunderstorm rolls in! Rain pours down across the land, nourishing the earth and bringing life to all creatures.',
            timestamp: serverTimestamp(),
            startTime: startTime,
            endTime: endTime,
            active: true
        });

        // Also add to main feed
        await addDoc(collection(this.db, 'feed'), {
            title: 'Thunderstorm!',
            description: 'Dark clouds gather overhead as a mighty thunderstorm rolls in! Rain pours down across the land.',
            timestamp: serverTimestamp(),
            action: 'weather'
        });
        
        // Update 24h stats immediately
        this.calculate24hStats();
    }

    async triggerTornadoEvent() {
        // Create tornado effect
        this.createTornadoEffect();
        
        // Log to weather collection with expiry time
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 180000); // 3 minutes from now
        
        await addDoc(collection(this.db, 'weather'), {
            type: 'tornado',
            title: 'Tornado Warning!',
            description: 'A massive tornado tears across the landscape! Powerful winds whip dust and debris through the air as nature unleashes its fury.',
            timestamp: serverTimestamp(),
            startTime: startTime,
            endTime: endTime,
            active: true
        });

        // Also add to main feed
        await addDoc(collection(this.db, 'feed'), {
            title: 'Tornado Warning!',
            description: 'A massive tornado tears across the landscape! Powerful winds whip dust and debris through the air.',
            timestamp: serverTimestamp(),
            action: 'weather'
        });
        
        // Update 24h stats immediately
        this.calculate24hStats();
    }

    async triggerSnowEvent() {
    // Local throttling - prevent multiple calls within 5 seconds
    const now = Date.now();
    if (this.lastSnowEventTime && (now - this.lastSnowEventTime) < 5000) {
        console.log('Snow event throttled - too soon since last call');
        this.showNotification('warning', 'Please Wait', 'Please wait before triggering another snow event.', 3000);
        return;
    }
    
    // Set the throttle time immediately
    this.lastSnowEventTime = now;
    
    // Check if snow is already active to prevent multiple triggers
    try {
        const weatherSnapshot = await getDocs(collection(this.db, 'weather'));
        let snowAlreadyActive = false;
        
        weatherSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.type === 'snow' && data.active) {
                snowAlreadyActive = true;
            }
        });
        
        if (snowAlreadyActive) {
            console.log('Snow event already active, skipping');
            this.showNotification('warning', 'Snow Already Active', 'A blizzard is already in progress!', 3000);
            return;
        }
        
        // Create snow effect
        this.createSnowEffect();
        
        // Create a unique event ID
        const snowEventId = `snow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Log to weather collection
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 180000);
        
        await addDoc(collection(this.db, 'weather'), {
            type: 'snow',
            title: 'Blizzard Alert!',
            description: 'A fierce blizzard sweeps through the world! Thick snowflakes dance through the air as winter shows its magnificent power.',
            timestamp: serverTimestamp(),
            startTime: startTime,
            endTime: endTime,
            active: true,
            eventId: snowEventId
        });

        // Create blizzard feed entry with unique ID
        await setDoc(doc(this.db, 'feed', `blizzard-${snowEventId}`), {
            title: 'Blizzard Alert!',
            description: 'A fierce blizzard sweeps through the world! Thick snowflakes dance through the air as winter shows its power.',
            timestamp: serverTimestamp(),
            action: 'weather',
            eventId: snowEventId
        });
        
        // Update 24h stats immediately
        this.calculate24hStats();
        
        console.log('Created snow event with freeze death:', snowEventId);
        
        // NEW: Pick a random throng to freeze to death
        if (this.throngs.size > 0) {
            const throngIds = Array.from(this.throngs.keys());
            const victimId = throngIds[Math.floor(Math.random() * throngIds.length)];
            
            // Create freeze action
            await addDoc(collection(this.db, 'actions'), {
                type: 'freeze',
                victimId: victimId,
                timestamp: serverTimestamp(),
                eventId: snowEventId
            });
            
            // Create the freeze death feed entry immediately with unique ID to prevent duplicates
            await setDoc(doc(this.db, 'feed', `freeze-death-${snowEventId}`), {
                title: 'FROZEN TO DEATH!',
                description: 'The bitter cold claims a victim! An Emulite has frozen solid in the blizzard.',
                timestamp: serverTimestamp(),
                action: 'freeze',
                eventId: snowEventId
            });
        }
        
    } catch (error) {
        console.error('Error checking for active snow:', error);
    }
}
    
listenToActions() {
    // Add a Set to track processed actions
    if (!this.processedActions) {
        this.processedActions = new Set();
    }

    onSnapshot(collection(this.db, 'actions'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const actionData = change.doc.data();
                const actionId = change.doc.id;
                
                // Check if we've already processed this action
                if (this.processedActions.has(actionId)) {
                    console.log('Already processed action:', actionId);
                    return;
                }
                
                // Mark as processed
                this.processedActions.add(actionId);
                
                if (actionData.type === 'breeding') {
                    // Only execute if we haven't already processed this breeding action
                    if (!this.processedBreedingActions) {
                        this.processedBreedingActions = new Set();
                    }
                    
                    // Use eventId for more reliable duplicate prevention
                    const uniqueId = actionData.eventId || actionId;
                    
                    if (!this.processedBreedingActions.has(uniqueId)) {
                        this.processedBreedingActions.add(uniqueId);
                        this.executeBreedingAnimation(actionData);
                        
                        setTimeout(() => {
                            deleteDoc(doc(this.db, 'actions', actionId));
                            this.processedBreedingActions.delete(uniqueId);
                            this.processedActions.delete(actionId);
                        }, 15000);
                    }
                } else if (actionData.type === 'death') {
                    // Add duplicate prevention for death actions
                    if (!this.processedDeathActions) {
                        this.processedDeathActions = new Set();
                    }
                    
                    const uniqueId = actionData.eventId || actionId;
                    
                    if (!this.processedDeathActions.has(uniqueId)) {
                        this.processedDeathActions.add(uniqueId);
                        this.executeDeathAnimation(actionData);
                        
                        setTimeout(() => {
                            deleteDoc(doc(this.db, 'actions', actionId));
                            this.processedDeathActions.delete(uniqueId);
                            this.processedActions.delete(actionId);
                        }, 3000);
                    }
                } else if (actionData.type === 'fire') {
                    // Add duplicate prevention for fire actions
                    if (!this.processedFireActions) {
                        this.processedFireActions = new Set();
                    }
                    
                    const uniqueId = actionData.eventId || actionId;
                    
                    if (!this.processedFireActions.has(uniqueId)) {
                        this.processedFireActions.add(uniqueId);
                        this.executeFireDeathAnimation(actionData);
                        
                        setTimeout(() => {
                            deleteDoc(doc(this.db, 'actions', actionId));
                            this.processedFireActions.delete(uniqueId);
                            this.processedActions.delete(actionId);
                        }, 12000);
                    }
                } else if (actionData.type === 'dropegg') {
                    // Mark egg as animating for ALL clients
                    if (actionData.eggId) {
                        this.animatingEggs.add(actionData.eggId);
                    }
                    
                    // Handle egg drop
                    this.executeEggDropAnimation(actionData);
                    setTimeout(() => {
                        deleteDoc(doc(this.db, 'actions', actionId));
                        this.processedActions.delete(actionId);
                        
                        // Remove from animating set when action is cleaned up
                        if (actionData.eggId) {
                            this.animatingEggs.delete(actionData.eggId);
                        }
                    }, 5000);
                } else if (actionData.type === 'crashufo') {
                    // Mark UFO as animating for ALL clients
                    if (actionData.ufoId) {
                        this.animatingUFOs.add(actionData.ufoId);
                    }
                    
                    // Handle UFO crash
                    this.executeCrashUFOAnimation(actionData);
                    setTimeout(() => {
                        deleteDoc(doc(this.db, 'actions', actionId));
                        this.processedActions.delete(actionId);
                        
                        // Remove from animating set when action is cleaned up
                        if (actionData.ufoId) {
                            this.animatingUFOs.delete(actionData.ufoId);
                        }
                    }, 8000); // Longer timeout for UFO crash
                } else if (actionData.type === 'burnhouse') {
                    this.executeBurnHouseAnimation(actionData);
                    setTimeout(() => {
                        deleteDoc(doc(this.db, 'actions', actionId));
                        this.processedActions.delete(actionId);
                    }, 13000);
                } else if (actionData.type === 'burntree') {
                    this.executeBurnTreeAnimation(actionData);
                    setTimeout(() => {
                        deleteDoc(doc(this.db, 'actions', actionId));
                        this.processedActions.delete(actionId);
                    }, 13000);
                } else if (actionData.type === 'freeze') {
                    // Add duplicate prevention for freeze actions
                    if (!this.processedFreezeActions) {
                        this.processedFreezeActions = new Set();
                    }
                    
                    const uniqueId = actionData.eventId || actionId;
                    
                    if (!this.processedFreezeActions.has(uniqueId)) {
                        this.processedFreezeActions.add(uniqueId);
                        this.executeFreezeDeathAnimation(actionData);
                        
                        setTimeout(() => {
                            deleteDoc(doc(this.db, 'actions', actionId));
                            this.processedFreezeActions.delete(uniqueId);
                            this.processedActions.delete(actionId);
                        }, 8000);
                    }
                }
            }
        });
    });
}

async executeBreedingAnimation(actionData) {
    const parent1 = this.throngs.get(actionData.parent1Id);
    const parent2 = this.throngs.get(actionData.parent2Id);
    
    if (!parent1 || !parent2) return;
    
    // Clear existing behaviors for parents
    clearInterval(parent1.behaviorInterval);
    clearInterval(parent1.animationInterval);
    clearInterval(parent2.behaviorInterval);
    clearInterval(parent2.animationInterval);
    
    // Walk towards meeting point
    this.walkTowardsTarget(parent1, actionData.meetingX, actionData.meetingY);
    this.walkTowardsTarget(parent2, actionData.meetingX, actionData.meetingY);
    
    setTimeout(() => {
        // Stop walking
        clearInterval(parent1.walkingInterval);
        clearInterval(parent2.walkingInterval);
        
        // Position parents at meeting point
        parent1.data.x = actionData.meetingX;
        parent1.data.y = actionData.meetingY;
        parent1.element.style.left = actionData.meetingX + 'px';
        parent1.element.style.top = actionData.meetingY + 'px';
        
        parent2.data.x = actionData.meetingX + 20;
        parent2.data.y = actionData.meetingY;
        parent2.element.style.left = (actionData.meetingX + 20) + 'px';
        parent2.element.style.top = actionData.meetingY + 'px';
        
        // Set to idle sprites
        this.setThronsSprite(actionData.parent1Id, 'idle');
        this.setThronsSprite(actionData.parent2Id, 'idle');
        
        // Start breeding animation
        this.startShakingAnimation(parent1.element);
        this.startShakingAnimation(parent2.element);
        
        // Create love effects for both parents
        parent1.loveEffectCleanup = this.createLoveEffect(parent1);
        parent2.loveEffectCleanup = this.createLoveEffect(parent2);
        
        // End breeding animation after 2.5 seconds
        setTimeout(() => {
            // Stop shaking and love effects
            this.stopShakingAnimation(parent1.element);
            this.stopShakingAnimation(parent2.element);
            
            if (parent1.loveEffectCleanup) {
                parent1.loveEffectCleanup();
                parent1.loveEffectCleanup = null;
            }
            if (parent2.loveEffectCleanup) {
                parent2.loveEffectCleanup();
                parent2.loveEffectCleanup = null;
            }
            
            // IMPORTANT: The automation service will create the baby throng after 15 seconds
            // We just need to mark it as new when it appears so it gets birth animation
            if (actionData.newThrongId) {
                this.newThrongs.add(actionData.newThrongId);
            }
            
            // Restart AI for parents immediately after breeding ends
            setTimeout(() => {
                this.startThronsAI(actionData.parent1Id);
                this.startThronsAI(actionData.parent2Id);
            }, 500);
            
        }, 2500); // End breeding animation
    }, 10000); // Time to walk together
}
    
async executeDeathAnimation(actionData) {
    const victim = this.throngs.get(actionData.victimId);
    if (!victim) return;
    
    clearInterval(victim.behaviorInterval);
    clearInterval(victim.animationInterval);
    if (victim.walkingInterval) clearInterval(victim.walkingInterval);
    if (victim.loveEffectCleanup) victim.loveEffectCleanup();
    
    this.createLightningEffect(victim.data.x + 24, victim.data.y + 24);
    
    setTimeout(() => {
        victim.element.style.filter = 'grayscale(100%) brightness(0.7)';
        victim.element.style.transition = 'all 0.3s ease-out';
        
        setTimeout(() => {
            this.createPoofEffect(victim.data.x, victim.data.y);
            
            victim.element.style.opacity = '0';
            victim.element.style.transform = 'scale(0.8)';
            
            setTimeout(async () => {
                await deleteDoc(doc(this.db, 'throngs', actionData.victimId));
                // Update server stats for death
                this.onThrongDeath();
                
                // Create the follow-up death feed entry (like "Death by Freezing" in freeze system)
               await setDoc(doc(this.db, 'feed', `death-by-lightning-${actionData.victimId}`), {
                    title: 'DEATH BY LIGHTNING',
                    description: 'An Emulite has been struck down by lightning and perished.',
                    timestamp: serverTimestamp(),
                    action: 'death',
                    throngId: actionData.victimId,
                    eventId: actionData.eventId
                });
                
                // Update 24h stats immediately
                this.calculate24hStats();
            }, 900);
        }, 300);
    }, 600);
}
    
async executeFireDeathAnimation(actionData) {
    const victim = this.throngs.get(actionData.victimId);
    if (!victim) return;
    
    clearInterval(victim.behaviorInterval);
    clearInterval(victim.animationInterval);
    if (victim.walkingInterval) clearInterval(victim.walkingInterval);
    if (victim.loveEffectCleanup) victim.loveEffectCleanup();
    
    const stopFire = this.createFireEffect(victim);
    
    const panicMovement = () => {
        const directions = ['walkingup', 'walkingdown', 'walkingleft', 'walkingright'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        let animationFrame = 0;
        const panicSpeed = 80;
        const panicDuration = 600 + Math.random() * 400;
        
        victim.animationInterval = setInterval(() => {
            const sprite = this.sprites[direction][animationFrame];
            victim.element.style.backgroundImage = 'url(' + sprite + ')';
            animationFrame = (animationFrame + 1) % 2;
            
            this.moveThrong(actionData.victimId, direction, false, 12);
        }, panicSpeed);
        
        setTimeout(() => {
            clearInterval(victim.animationInterval);
            setTimeout(panicMovement, 100 + Math.random() * 200);
        }, panicDuration);
    };
    
    panicMovement();
    
    setTimeout(() => {
        stopFire();
        clearInterval(victim.animationInterval);
        
        victim.element.style.filter = 'grayscale(100%) brightness(0.7)';
        victim.element.style.transition = 'all 0.3s ease-out';
        
        setTimeout(() => {
            this.createPoofEffect(victim.data.x, victim.data.y);
            
            victim.element.style.opacity = '0';
            victim.element.style.transform = 'scale(0.8)';
            
            setTimeout(async () => {
                await deleteDoc(doc(this.db, 'throngs', actionData.victimId));
                // Update server stats for death
                this.onThrongDeath();
                
                // Create the follow-up death feed entry (like "Death by Freezing" in freeze system)
                await setDoc(doc(this.db, 'feed', `death-by-fire-${actionData.victimId}`), {
                    title: 'DEATH BY FIRE',
                    description: 'An Emulite has been consumed by flames and perished.',
                    timestamp: serverTimestamp(),
                    action: 'fire',
                    throngId: actionData.victimId,
                    eventId: actionData.eventId
                });
                
                // Update 24h stats immediately
                this.calculate24hStats();
            }, 900);
        }, 300);
    }, 10000);
}

    executeEggDropAnimation(actionData) {
    // IMPORTANT: Hide the permanent egg first if it exists (for all clients)
    if (actionData.eggId && this.eggs.has(actionData.eggId)) {
        const permanentEgg = this.eggs.get(actionData.eggId);
        permanentEgg.element.style.display = 'none';
        // Clear any existing content to prevent issues
        permanentEgg.element.innerHTML = '';
    }
    
    // Create the temporary falling egg element
    const eggElement = document.createElement('div');
    eggElement.className = 'egg-falling';
    eggElement.style.position = 'absolute';
    eggElement.style.width = '48px';
    eggElement.style.height = '48px';
    eggElement.style.backgroundImage = `url(${this.eggSprites.egg})`;
    eggElement.style.backgroundSize = 'contain';
    eggElement.style.backgroundRepeat = 'no-repeat';
    eggElement.style.imageRendering = 'pixelated';
    eggElement.style.pointerEvents = 'none';
    eggElement.style.zIndex = '1000';
    
    // Start position (top of screen, random X)
    const startX = actionData.targetX;
    const startY = -100; // Start above visible area
    
    eggElement.style.left = startX + 'px';
    eggElement.style.top = startY + 'px';
    
    this.worldContainer.appendChild(eggElement);
    
    // Animate the egg falling
    let currentY = startY;
    const fallSpeed = 8;
    const targetY = actionData.targetY;
    
    const fallInterval = setInterval(() => {
        currentY += fallSpeed;
        eggElement.style.top = currentY + 'px';
        
        // Add subtle rotation and wobble
        const time = Date.now() * 0.01;
        const wobble = Math.sin(time) * 2;
        const rotation = Math.sin(time * 0.5) * 5;
        eggElement.style.transform = `translateX(${wobble}px) rotate(${rotation}deg)`;
        
        // Check if egg has reached target position
        if (currentY >= targetY) {
            clearInterval(fallInterval);
            
            // Create impact effect
            this.createEggImpactEffect(actionData.targetX, targetY);
            
            // Remove the falling egg
            eggElement.remove();
            
            // Show the permanent egg if it exists in database
            if (actionData.eggId && this.eggs.has(actionData.eggId)) {
                const permanentEgg = this.eggs.get(actionData.eggId);
                permanentEgg.element.style.display = 'block';
                this.buildEggInstantly(permanentEgg.element);
            }
        }
    }, 50);
}

executeCrashUFOAnimation(actionData) {
    // IMPORTANT: Hide the permanent UFO first if it exists (for all clients)
    if (actionData.ufoId && this.ufos.has(actionData.ufoId)) {
        const permanentUFO = this.ufos.get(actionData.ufoId);
        permanentUFO.element.style.display = 'none';
        // Clear any existing content to prevent issues
        permanentUFO.element.innerHTML = '';
    }
    
    // Create the temporary falling UFO element
    const ufoElement = document.createElement('div');
    ufoElement.className = 'ufo-crashing';
    ufoElement.style.position = 'absolute';
    ufoElement.style.width = '84px';
    ufoElement.style.height = '51px';
    ufoElement.style.backgroundImage = `url(${this.ufoSprites.ufo1})`;
    ufoElement.style.backgroundSize = 'contain';
    ufoElement.style.backgroundRepeat = 'no-repeat';
    ufoElement.style.imageRendering = 'pixelated';
    ufoElement.style.pointerEvents = 'none';
    ufoElement.style.zIndex = '1000';
    
    // Start position (top of screen, random X)
    const startX = actionData.targetX;
    const startY = -200;
    
    ufoElement.style.left = startX + 'px';
    ufoElement.style.top = startY + 'px';
    
    this.worldContainer.appendChild(ufoElement);
    
    // Animate the UFO crashing
    let currentY = startY;
    let currentX = startX;
    const fallSpeed = 15;
    const targetY = actionData.targetY;
    const targetX = actionData.targetX;
    
    // Erratic movement variables
    let wobbleIntensity = 0;
    let spinRotation = 0;
    
    const crashInterval = setInterval(() => {
        currentY += fallSpeed;
        
        // Increase erratic movement as it falls
        wobbleIntensity = Math.min(20, (currentY - startY) / 10);
        const wobbleX = Math.sin(Date.now() * 0.02) * wobbleIntensity;
        const wobbleY = Math.cos(Date.now() * 0.03) * (wobbleIntensity * 0.5);
        
        // Increase spin speed
        spinRotation += 12;
        
        currentX = targetX + wobbleX;
        ufoElement.style.left = currentX + 'px';
        ufoElement.style.top = (currentY + wobbleY) + 'px';
        
        // Add erratic rotation and scaling
        const scale = 1 + Math.sin(Date.now() * 0.05) * 0.1;
        ufoElement.style.transform = `rotate(${spinRotation}deg) scale(${scale})`;
        
        // Check if UFO has reached target position
        if (currentY >= targetY) {
            clearInterval(crashInterval);
            
            // INSTANT SPRITE SWITCH - change to crashed sprite immediately with no rotation
            ufoElement.style.backgroundImage = `url(${this.ufoSprites.ufo2})`;
            ufoElement.style.transform = 'none'; // Remove all rotation and scaling
            
            // Create massive explosion effect immediately
            this.createUFOExplosionEffect(targetX, targetY);
            
           // After explosion finishes, replace with permanent UFO element
setTimeout(() => {
    // Show the permanent crashed UFO if it exists in database
    if (actionData.ufoId && this.ufos.has(actionData.ufoId)) {
        const permanentUFO = this.ufos.get(actionData.ufoId);
        
        // Clear any existing content first to prevent duplicates
        permanentUFO.element.innerHTML = '';
        permanentUFO.element.style.display = 'block';
        this.buildCrashedUFO(permanentUFO.element);
        
        // Start permanent smoking effect
        this.startUFOSmokingEffect(permanentUFO);
    }
    
    // Remove the temporary falling UFO
    ufoElement.remove();
    
    // Remove from animating set when animation is complete
    if (actionData.ufoId) {
        this.animatingUFOs.delete(actionData.ufoId);
    }
}, 1600); // Wait for explosion to finish
        }
    }, 30);
}

    createEggImpactEffect(x, y) {
    const colors = ['#FFFACD', '#FFE4B5', '#FFEFD5', '#FFF8DC', '#F5DEB3'];
    const numParticles = 12;
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        // Start from the center of the egg
        const particleX = x + 24; // Center of 48px egg
        const particleY = y + 24;
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = (4 + Math.random() * 4) + 'px';
        particle.style.height = (4 + Math.random() * 4) + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '998';
        particle.style.borderRadius = '50%';
        
        // Random direction for particle explosion
        const angle = (i / numParticles) * 2 * Math.PI + (Math.random() * 0.5);
        const distance = 30 + Math.random() * 20;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        particle.style.transform = 'translate(0, 0) scale(1)';
        particle.style.opacity = '1';
        particle.style.transition = 'all 0.6s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        // Animate particle explosion
        setTimeout(() => {
            particle.style.transform = `translate(${endX}px, ${endY}px) scale(0)`;
            particle.style.opacity = '0';
        }, 50);
        
        // Remove particle
        setTimeout(() => {
            particle.remove();
        }, 700);
    }
}

createUFOExplosionEffect(x, y) {
    // Create multiple explosion layers for more dramatic effect
    this.createExplosionLayer1(x, y); // Main explosion
    setTimeout(() => this.createExplosionLayer2(x, y), 200); // Secondary blast
    setTimeout(() => this.createExplosionLayer3(x, y), 400); // Aftershock
    
    // Add screen flash effect
    this.createScreenFlash();
    
    // Add screen shake effect
    this.createScreenShake();
}

// Add these three new methods right after createUFOExplosionEffect
createExplosionLayer1(x, y) {
    const explosionColors = ['#FFFFFF', '#FFFF00', '#FF8800', '#FF4500', '#FF0000'];
    const numParticles = 80; // Much more particles
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        // Start from the center of the UFO (84×51px)
        const particleX = x + 42; // Center of 84px width
        const particleY = y + 26; // Center of 51px height
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = (8 + Math.random() * 16) + 'px'; // Much larger particles
        particle.style.height = (8 + Math.random() * 16) + 'px';
        particle.style.backgroundColor = explosionColors[Math.floor(Math.random() * explosionColors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1200';
        particle.style.borderRadius = Math.random() > 0.3 ? '50%' : '2px';
        particle.style.boxShadow = '0 0 15px currentColor, 0 0 30px currentColor';
        
        // Much wider explosion radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = 80 + Math.random() * 120; // Massive explosion radius
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        particle.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
        particle.style.opacity = '1';
        particle.style.transition = 'all 1.5s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        // Animate particle explosion
        setTimeout(() => {
            const rotation = Math.random() * 1080; // More rotation
            const finalScale = 0.1 + Math.random() * 0.2;
            particle.style.transform = `translate(${endX}px, ${endY}px) scale(${finalScale}) rotate(${rotation}deg)`;
            particle.style.opacity = '0';
        }, 50 + Math.random() * 100);
        
        // Remove particle
        setTimeout(() => {
            particle.remove();
        }, 1600);
    }
}

createExplosionLayer2(x, y) {
    const fireColors = ['#FF4500', '#FF6600', '#FF8800', '#FFAA00', '#FFCC00'];
    const numParticles = 60;
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        const particleX = x + 42; // Center of 84px width
        const particleY = y + 26; // Center of 51px height
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = (6 + Math.random() * 12) + 'px';
        particle.style.height = (6 + Math.random() * 12) + 'px';
        particle.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1150';
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
        particle.style.boxShadow = '0 0 10px currentColor';
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = 60 + Math.random() * 100;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        particle.style.transform = 'translate(0, 0) scale(1)';
        particle.style.opacity = '0.9';
        particle.style.transition = 'all 1.2s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.style.transform = `translate(${endX}px, ${endY}px) scale(0)`;
            particle.style.opacity = '0';
        }, 100);
        
        setTimeout(() => {
            particle.remove();
        }, 1300);
    }
}

createExplosionLayer3(x, y) {
    const smokeColors = ['#555555', '#666666', '#777777', '#888888'];
    const numParticles = 40;
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        
        const particleX = x + 42; // Center of 84px width
        const particleY = y + 26; // Center of 51px height
        
        particle.style.position = 'absolute';
        particle.style.left = particleX + 'px';
        particle.style.top = particleY + 'px';
        particle.style.width = (10 + Math.random() * 20) + 'px';
        particle.style.height = (10 + Math.random() * 20) + 'px';
        particle.style.backgroundColor = smokeColors[Math.floor(Math.random() * smokeColors.length)];
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1100';
        particle.style.borderRadius = '50%';
        particle.style.opacity = '0.7';
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = 40 + Math.random() * 80;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 20; // Smoke rises
        
        particle.style.transform = 'translate(0, 0) scale(0.5)';
        particle.style.transition = 'all 2s ease-out';
        
        this.worldContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.style.transform = `translate(${endX}px, ${endY}px) scale(2)`;
            particle.style.opacity = '0';
        }, 100);
        
        setTimeout(() => {
            particle.remove();
        }, 2100);
    }
}

createScreenFlash() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.background = 'rgba(255, 255, 255, 0.8)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '1500';
    flash.style.opacity = '1';
    flash.style.transition = 'opacity 0.3s ease-out';
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
        flash.remove();
    }, 350);
}

startUFOSmokingEffect(ufoData) {
    const ufoElement = ufoData.element;
    
    // Create multiple smoke emission points for more realistic effect (adjusted for 84×51px)
    const smokePoints = [
        { x: 15, y: 15 }, // Left side
        { x: 69, y: 15 }, // Right side
        { x: 42, y: 20 }, // Center
        { x: 30, y: 25 }, // Center-left
        { x: 54, y: 25 }  // Center-right
    ];
    
    // Create smoke container
    const smokeContainer = document.createElement('div');
    smokeContainer.className = 'ufo-smoke-container';
    smokeContainer.style.position = 'absolute';
    smokeContainer.style.width = '84px'; // Match UFO width
    smokeContainer.style.height = '100px'; // Taller for smoke
    smokeContainer.style.left = '0';
    smokeContainer.style.top = '-49px'; // Offset up to show smoke rising (51px UFO height - 2px)
    smokeContainer.style.pointerEvents = 'none';
    smokeContainer.style.zIndex = '51';
    smokeContainer.style.overflow = 'visible';
    
    ufoElement.appendChild(smokeContainer);
    
    // Smoking animation with multiple emission points
    ufoData.smokingInterval = setInterval(() => {
        // Randomly choose 1-3 emission points to emit smoke from
        const activePoints = smokePoints.sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 3));
        
        activePoints.forEach((point, index) => {
            setTimeout(() => {
                this.createSmokeParticle(smokeContainer, point.x, point.y);
            }, index * 100); // Stagger emissions slightly
        });
        
    }, 300 + Math.random() * 400); // More varied timing
}

// Add this new method right after startUFOSmokingEffect
createSmokeParticle(container, startX, startY) {
    const smokeColors = ['#333333', '#444444', '#555555', '#666666', '#777777'];
    const smoke = document.createElement('div');
    
    // More varied smoke particle sizes
    const size = 6 + Math.random() * 12;
    smoke.style.position = 'absolute';
    smoke.style.width = size + 'px';
    smoke.style.height = size + 'px';
    smoke.style.backgroundColor = smokeColors[Math.floor(Math.random() * smokeColors.length)];
    smoke.style.borderRadius = '50%';
    smoke.style.opacity = '0';
    smoke.style.left = startX + 'px';
    smoke.style.top = startY + 'px';
    smoke.style.filter = 'blur(1px)';
    smoke.style.transition = 'all 0.3s ease-out';
    
    container.appendChild(smoke);
    
    // Fade in
    setTimeout(() => {
        smoke.style.opacity = '0.6 + Math.random() * 0.3';
    }, 50);
    
    // Animate smoke rising with realistic movement
    let smokeY = startY;
    let smokeX = startX;
    let opacity = 0.6 + Math.random() * 0.3;
    let currentSize = size;
    let windDirection = (Math.random() - 0.5) * 2; // Random wind direction
    
    const smokeAnimation = setInterval(() => {
        // Smoke rises and expands
        smokeY -= 1.5 + Math.random() * 1;
        smokeX += windDirection + (Math.random() - 0.5) * 1.5; // Wind effect + turbulence
        opacity -= 0.015 + Math.random() * 0.01;
        currentSize += 0.3; // Smoke expands as it rises
        
        // Add some turbulence
        const turbulence = Math.sin(Date.now() * 0.01 + smokeY * 0.1) * 2;
        
        smoke.style.top = smokeY + 'px';
        smoke.style.left = (smokeX + turbulence) + 'px';
        smoke.style.opacity = Math.max(0, opacity);
        smoke.style.width = currentSize + 'px';
        smoke.style.height = currentSize + 'px';
        smoke.style.filter = `blur(${1 + currentSize * 0.1}px)`; // More blur as it expands
        
        // Remove when smoke fades or goes too high
        if (opacity <= 0 || smokeY < -60) {
            clearInterval(smokeAnimation);
            smoke.remove();
        }
    }, 80);
}

// Add these two methods right after createSmokeParticle()
startFirepitSmokingEffect(firepitData) {
    const firepitElement = firepitData.element;
    
    // Create smoke emission points for firepit (adjusted for 48×48px)
    const smokePoints = [
        { x: 12, y: 10 }, // Left side
        { x: 36, y: 10 }, // Right side
        { x: 24, y: 8 },  // Center
        { x: 18, y: 12 }, // Center-left
        { x: 30, y: 12 }  // Center-right
    ];
    
    // Create smoke container
    const smokeContainer = document.createElement('div');
    smokeContainer.className = 'firepit-smoke-container';
    smokeContainer.style.position = 'absolute';
    smokeContainer.style.width = '48px'; // Match firepit width
    smokeContainer.style.height = '80px'; // Taller for smoke
    smokeContainer.style.left = '0';
    smokeContainer.style.top = '-32px'; // Offset up to show smoke rising
    smokeContainer.style.pointerEvents = 'none';
    smokeContainer.style.zIndex = '51';
    smokeContainer.style.overflow = 'visible';
    
    firepitElement.appendChild(smokeContainer);
    
    // Smoking animation with multiple emission points
    firepitData.smokingInterval = setInterval(() => {
        // Randomly choose 1-3 emission points to emit smoke from
        const activePoints = smokePoints.sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 3));
        
        activePoints.forEach((point, index) => {
            setTimeout(() => {
                this.createFirepitSmokeParticle(smokeContainer, point.x, point.y);
            }, index * 100); // Stagger emissions slightly
        });
        
    }, 200 + Math.random() * 300); // Faster smoking than UFO
}

createFirepitSmokeParticle(container, startX, startY) {
    const smokeColors = ['#333333', '#444444', '#555555', '#666666', '#777777'];
    const smoke = document.createElement('div');
    
    // Slightly smaller smoke particles than UFO
    const size = 4 + Math.random() * 8;
    smoke.style.position = 'absolute';
    smoke.style.width = size + 'px';
    smoke.style.height = size + 'px';
    smoke.style.backgroundColor = smokeColors[Math.floor(Math.random() * smokeColors.length)];
    smoke.style.borderRadius = '50%';
    smoke.style.opacity = '0';
    smoke.style.left = startX + 'px';
    smoke.style.top = startY + 'px';
    smoke.style.filter = 'blur(1px)';
    smoke.style.transition = 'all 0.3s ease-out';
    
    container.appendChild(smoke);
    
    // Fade in
    setTimeout(() => {
        smoke.style.opacity = '0.5 + Math.random() * 0.3';
    }, 50);
    
    // Animate smoke rising
    let smokeY = startY;
    let smokeX = startX;
    let opacity = 0.5 + Math.random() * 0.3;
    let currentSize = size;
    let windDirection = (Math.random() - 0.5) * 1.5; // Gentler wind than UFO
    
    const smokeAnimation = setInterval(() => {
        // Smoke rises and expands
        smokeY -= 1 + Math.random() * 0.8;
        smokeX += windDirection + (Math.random() - 0.5) * 1;
        opacity -= 0.012 + Math.random() * 0.008;
        currentSize += 0.25;
        
        // Add some turbulence
        const turbulence = Math.sin(Date.now() * 0.008 + smokeY * 0.08) * 1.5;
        
        smoke.style.top = smokeY + 'px';
        smoke.style.left = (smokeX + turbulence) + 'px';
        smoke.style.opacity = Math.max(0, opacity);
        smoke.style.width = currentSize + 'px';
        smoke.style.height = currentSize + 'px';
        smoke.style.filter = `blur(${1 + currentSize * 0.08}px)`;
        
        // Remove when smoke fades or goes too high
        if (opacity <= 0 || smokeY < -50) {
            clearInterval(smokeAnimation);
            smoke.remove();
        }
    }, 70);
}

    // Add this right after createFirepitSmokeParticle()
startFirepitAnimation(container, firepitImg) {
    const firepitTypes = ['firepit1', 'firepit2', 'firepit3'];
    let currentFrame = 0;
    
    // Store the animation interval in the firepit data for cleanup
    const firepitData = this.firepits.get(container.id);
    if (firepitData) {
        firepitData.fireAnimationInterval = setInterval(() => {
            currentFrame = (currentFrame + 1) % firepitTypes.length;
            const newSprite = this.firepitSprites[firepitTypes[currentFrame]];
            firepitImg.src = newSprite;
        }, 200); // 0.2 second delay (200ms)
    }
}

createScreenShake() {
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer) return;
    
    gameContainer.style.animation = 'screenShake 0.6s ease-out';
    
    // Add screen shake keyframes if not already defined
    if (!document.getElementById('screenShakeStyles')) {
        const style = document.createElement('style');
        style.id = 'screenShakeStyles';
        style.textContent = `
            @keyframes screenShake {
                0%, 100% { transform: translate(0, 0); }
                10% { transform: translate(-2px, -1px); }
                20% { transform: translate(2px, 1px); }
                30% { transform: translate(-1px, 2px); }
                40% { transform: translate(1px, -1px); }
                50% { transform: translate(-2px, 1px); }
                60% { transform: translate(2px, -2px); }
                70% { transform: translate(-1px, 1px); }
                80% { transform: translate(1px, 2px); }
                90% { transform: translate(-1px, -1px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove animation after it completes
    setTimeout(() => {
        gameContainer.style.animation = '';
    }, 600);
}

    async executeFreezeDeathAnimation(actionData) {
        const victim = this.throngs.get(actionData.victimId);
        if (!victim) return;
        
        // Stop all existing behaviors
        clearInterval(victim.behaviorInterval);
        clearInterval(victim.animationInterval);
        if (victim.walkingInterval) clearInterval(victim.walkingInterval);
        if (victim.loveEffectCleanup) victim.loveEffectCleanup();
        
        // Create blue freeze overlay
        const freezeOverlay = document.createElement('div');
        freezeOverlay.style.position = 'absolute';
        freezeOverlay.style.left = victim.data.x + 'px';
        freezeOverlay.style.top = victim.data.y + 'px';
        freezeOverlay.style.width = '48px';
        freezeOverlay.style.height = '48px';
        freezeOverlay.style.background = 'rgba(100, 150, 255, 0.6)';
        freezeOverlay.style.borderRadius = '50%';
        freezeOverlay.style.pointerEvents = 'none';
        freezeOverlay.style.zIndex = '996';
        freezeOverlay.style.boxShadow = '0 0 15px rgba(100, 150, 255, 0.8)';
        freezeOverlay.style.animation = 'freezePulse 0.5s ease-in-out infinite alternate';
        
        this.worldContainer.appendChild(freezeOverlay);
        
        // Start shaking animation
        this.startShakingAnimation(victim.element);
        
        // Add freeze pulse animation if not already defined
        if (!document.getElementById('freezeStyles')) {
            const style = document.createElement('style');
            style.id = 'freezeStyles';
            style.textContent = `
                @keyframes freezePulse {
                    0% { 
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    100% { 
                        transform: scale(1.1);
                        opacity: 0.8;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // After 5 seconds, stop shaking and create blue poof effect
        setTimeout(() => {
            this.stopShakingAnimation(victim.element);
            freezeOverlay.remove();
            
            // Create blue poof effect
            this.createBluePoofEffect(victim.data.x, victim.data.y);
            
            // Fade out the throng
            victim.element.style.filter = 'grayscale(100%) brightness(0.7) hue-rotate(200deg)';
            victim.element.style.transition = 'all 0.3s ease-out';
            victim.element.style.opacity = '0';
            victim.element.style.transform = 'scale(0.8)';
            
            // Delete from database
            setTimeout(async () => {
                await deleteDoc(doc(this.db, 'throngs', actionData.victimId));
                // Update server stats for death
                this.onThrongDeath();
                
// Create feed entry for freeze death (for 24h stats) - use unique ID to prevent duplicates
await setDoc(doc(this.db, 'feed', `throng-freeze-death-${actionData.victimId}`), {
    title: 'Death by Freezing',
    description: 'An Emulite has frozen solid in the blizzard.',
    timestamp: serverTimestamp(),
    action: 'freeze',
    throngId: actionData.victimId
});

// Update 24h stats immediately
this.calculate24hStats();
            }, 300);
        }, 5000);
    }

    async executeBurnHouseAnimation(actionData) {
        const house = this.houses.get(actionData.houseId);
        if (!house) return;
        
        const stopFire = this.createHouseFireEffect(house);
        
        // After 10 seconds, start the collapse animation
        setTimeout(() => {
            const houseImg = house.element.querySelector('img');
            if (houseImg) {
                houseImg.style.animation = 'collapseHouseTopDown 2s ease-in forwards';
            }
            
            this.createHouseDestructionEffect(house.data.x, house.data.y);
        }, 10000);
        
    // After 12 seconds, delete from database
        setTimeout(async () => {
            try {
                await deleteDoc(doc(this.db, 'houses', actionData.houseId));
                console.log('House successfully deleted from database:', actionData.houseId);
                
                // Update server stats for house loss
                this.onHouseLost();
                
                
             // Create feed entry for house destruction (for 24h stats) - use unique ID to prevent duplicates
await setDoc(doc(this.db, 'feed', `house-destroyed-${actionData.houseId}`), {
    title: 'House Destroyed', 
    description: 'A house has been consumed by flames and destroyed.',
    timestamp: serverTimestamp(),
    action: 'houselost',
    houseId: actionData.houseId
});

// Update 24h stats immediately
this.calculate24hStats();
                
                
            } catch (error) {
                console.error('Failed to delete house from database:', error);
                this.showNotification('error', 'Deletion Failed', 'Failed to remove house from database.', 5000);
            }
        }, 12000);
        
        // After 13 seconds, stop fire
        setTimeout(() => {
            stopFire();
        }, 13000);
    }

    async executeBurnTreeAnimation(actionData) {
        const tree = this.trees.get(actionData.treeId);
        if (!tree) return;
        
        const stopFire = this.createTreeFireEffect(tree);
        
        setTimeout(async () => {
            const treeImg = tree.element.querySelector('img');
            if (treeImg) {
                treeImg.style.animation = 'collapseTree 2s ease-in forwards';
            }
            
            this.createTreeDestructionEffect(tree.data.x, tree.data.y);
            
            try {
                await deleteDoc(doc(this.db, 'trees', actionData.treeId));
                console.log('Tree successfully deleted from database:', actionData.treeId);
                
                // Update server stats for tree loss
                this.onTreeLost();
                
                // Create feed entry for tree destruction (for 24h stats) - use unique ID to prevent duplicates
await setDoc(doc(this.db, 'feed', `tree-destroyed-${actionData.treeId}`), {
    title: 'Tree Destroyed',
    description: 'A tree has been consumed by flames and destroyed.',
    timestamp: serverTimestamp(),
    action: 'treelost',
    treeId: actionData.treeId
});

// Update 24h stats immediately
this.calculate24hStats();
                
            } catch (error) {
                console.error('Failed to delete tree from database:', error);
                this.showNotification('error', 'Deletion Failed', 'Failed to remove tree from database.', 5000);
            }
        }, 10000);
        
        setTimeout(() => {
            stopFire();
        }, 11000);
    }

    // Effect creation methods
    createLightningEffect(x, y) {
        const lightningSprite = this.effectSprites.lightning;
        
        for (let i = 0; i < 3; i++) {
            const lightning = document.createElement('div');
            lightning.style.position = 'absolute';
            lightning.style.left = (x - 24 + (i * 20)) + 'px';
            lightning.style.top = (y - 60) + 'px';
            lightning.style.width = '48px';
            lightning.style.height = '48px';
            lightning.style.backgroundImage = 'url(' + lightningSprite + ')';
            lightning.style.backgroundSize = 'contain';
            lightning.style.backgroundRepeat = 'no-repeat';
            lightning.style.imageRendering = 'pixelated';
            lightning.style.pointerEvents = 'none';
            lightning.style.zIndex = '999';
            
            lightning.style.animation = 'lightningBounce 0.8s ease-out forwards';
            lightning.style.animationDelay = (i * 0.1) + 's';
            
            this.worldContainer.appendChild(lightning);
            
            setTimeout(() => {
                lightning.remove();
            }, 1200 + (i * 100));
        }
        
        if (!document.getElementById('lightningStyles')) {
            const style = document.createElement('style');
            style.id = 'lightningStyles';
            style.textContent = '@keyframes lightningBounce { 0% { opacity: 0; transform: translateY(-20px) scale(0.8); } 30% { opacity: 1; transform: translateY(0px) scale(1.2); } 60% { opacity: 0.8; transform: translateY(-10px) scale(1); } 80% { opacity: 1; transform: translateY(0px) scale(1.1); } 100% { opacity: 0; transform: translateY(-5px) scale(0.9); } }';
            document.head.appendChild(style);
        }
    }

    createPoofEffect(x, y) {
        const colors = ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0'];
        const numParticles = 12;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.left = (x + 24) + 'px';
            particle.style.top = (y + 24) + 'px';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '998';
            particle.style.borderRadius = '50%';
            
            const angle = (i / numParticles) * 2 * Math.PI;
            const distance = 50 + Math.random() * 30;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            particle.style.transform = 'translate(0, 0) scale(1)';
            particle.style.opacity = '1';
            particle.style.transition = 'all 0.8s ease-out';
            
            this.worldContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
                particle.style.opacity = '0';
            }, 50);
            
            setTimeout(() => {
                particle.remove();
            }, 900);
        }
    }

    createBluePoofEffect(x, y) {
        const blueColors = ['#87CEEB', '#4169E1', '#1E90FF', '#0000FF', '#6495ED', '#00BFFF'];
        const numParticles = 15;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.left = (x + 24) + 'px';
            particle.style.top = (y + 24) + 'px';
            particle.style.width = (4 + Math.random() * 4) + 'px';
            particle.style.height = (4 + Math.random() * 4) + 'px';
            particle.style.backgroundColor = blueColors[Math.floor(Math.random() * blueColors.length)];
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '998';
            particle.style.borderRadius = '50%';
            particle.style.boxShadow = '0 0 4px rgba(135, 206, 235, 0.8)';
            
            const angle = (i / numParticles) * 2 * Math.PI;
            const distance = 40 + Math.random() * 30;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            particle.style.transform = 'translate(0, 0) scale(1)';
            particle.style.opacity = '1';
            particle.style.transition = 'all 0.8s ease-out';
            
            this.worldContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0)';
                particle.style.opacity = '0';
            }, 50);
            
            setTimeout(() => {
                particle.remove();
            }, 900);
        }
    }

    createFireEffect(throng) {
        const fireColors = ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ff0000', '#cc0000'];
        const fireContainer = document.createElement('div');
        fireContainer.style.position = 'absolute';
        fireContainer.style.width = '48px';
        fireContainer.style.height = '48px';
        fireContainer.style.pointerEvents = 'none';
        fireContainer.style.zIndex = '997';
        
        const updateFirePosition = () => {
            fireContainer.style.left = (throng.data.x) + 'px';
            fireContainer.style.top = (throng.data.y - 18) + 'px';
        };
        
        const numFirePixels = 20;
        const firePixels = [];
        
        for (let i = 0; i < numFirePixels; i++) {
            const pixel = document.createElement('div');
            pixel.style.position = 'absolute';
            pixel.style.width = '6px';
            pixel.style.height = '6px';
            pixel.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
            
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.random() * 20;
            const pixelX = 24 + Math.cos(angle) * radius;
            const pixelY = 42 + Math.sin(angle) * radius * 0.6;
            
            pixel.style.left = pixelX + 'px';
            pixel.style.top = pixelY + 'px';
            pixel.style.borderRadius = '1px';
            pixel.style.opacity = '0.8';
            
            fireContainer.appendChild(pixel);
            firePixels.push({
                element: pixel,
                originalY: pixelY,
                speed: 2 + Math.random() * 4
            });
        }
        
        updateFirePosition();
        this.worldContainer.appendChild(fireContainer);
        
        let animationFrame = 0;
        const fireAnimation = setInterval(() => {
            updateFirePosition();
            
            firePixels.forEach((firePixel) => {
                const currentY = parseFloat(firePixel.element.style.top);
                const newY = currentY - firePixel.speed;
                
                if (newY < 24) {
                    firePixel.element.style.top = (firePixel.originalY + 15) + 'px';
                    firePixel.element.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                } else {
                    firePixel.element.style.top = newY + 'px';
                }
                
                if (animationFrame % 1 === 0) {
                    firePixel.element.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                    firePixel.element.style.opacity = (0.6 + Math.random() * 0.4);
                }
            });
            
            animationFrame++;
        }, 30);
        
        return () => {
            clearInterval(fireAnimation);
            fireContainer.remove();
        };
    }

    createHouseFireEffect(house) {
        const fireColors = ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ff0000', '#cc0000'];
        const houseImg = house.element.querySelector('img');
        const houseWidth = houseImg ? houseImg.offsetWidth : 126;
        const houseHeight = houseImg ? houseImg.offsetHeight : 120;
        
        const fireContainer = document.createElement('div');
        fireContainer.style.position = 'absolute';
        fireContainer.style.width = houseWidth + 'px';
        fireContainer.style.height = houseHeight + 'px';
        fireContainer.style.left = house.data.x + 'px';
        fireContainer.style.top = house.data.y + 'px';
        fireContainer.style.pointerEvents = 'none';
        fireContainer.style.zIndex = '997';
        
        const numFirePixels = 50;
        const firePixels = [];
        
        for (let i = 0; i < numFirePixels; i++) {
            const pixel = document.createElement('div');
            pixel.style.position = 'absolute';
            pixel.style.width = '8px';
            pixel.style.height = '8px';
            pixel.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
            
            const pixelX = Math.random() * houseWidth;
            const pixelY = houseHeight * 0.3 + Math.random() * (houseHeight * 0.7);
            
            pixel.style.left = pixelX + 'px';
            pixel.style.top = pixelY + 'px';
            pixel.style.borderRadius = '2px';
            pixel.style.opacity = '0.8';
            
            fireContainer.appendChild(pixel);
            firePixels.push({
                element: pixel,
                originalY: pixelY,
                speed: 2 + Math.random() * 6
            });
        }
        
        this.worldContainer.appendChild(fireContainer);
        
        let animationFrame = 0;
        const fireAnimation = setInterval(() => {
            firePixels.forEach((firePixel) => {
                const currentY = parseFloat(firePixel.element.style.top);
                const newY = currentY - firePixel.speed;
                
                if (newY < 0) {
                    firePixel.element.style.top = (firePixel.originalY + 20) + 'px';
                    firePixel.element.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                } else {
                    firePixel.element.style.top = newY + 'px';
                }
                
                if (animationFrame % 2 === 0) {
                    firePixel.element.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                    firePixel.element.style.opacity = (0.6 + Math.random() * 0.4);
                }
            });
            
            animationFrame++;
        }, 50);
        
        return () => {
            clearInterval(fireAnimation);
            fireContainer.remove();
        };
    }

    createTreeFireEffect(tree) {
        const fireColors = ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ff0000', '#cc0000'];
        
        let treeWidth, treeHeight;
        if (tree.data.type === 'tree1') {
            treeWidth = 39;
            treeHeight = 54;
        } else {
            treeWidth = 39;
            treeHeight = 69;
        }
        
        const fireContainer = document.createElement('div');
        fireContainer.style.position = 'absolute';
        fireContainer.style.width = treeWidth + 'px';
        fireContainer.style.height = treeHeight + 'px';
        fireContainer.style.left = tree.data.x + 'px';
        fireContainer.style.top = tree.data.y + 'px';
        fireContainer.style.pointerEvents = 'none';
        fireContainer.style.zIndex = '997';
        
        const numFirePixels = 35;
        const firePixels = [];
        
        for (let i = 0; i < numFirePixels; i++) {
            const pixel = document.createElement('div');
            pixel.style.position = 'absolute';
            pixel.style.width = '6px';
            pixel.style.height = '6px';
            pixel.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
            
            const pixelX = Math.random() * treeWidth;
            const pixelY = treeHeight * 0.2 + Math.random() * (treeHeight * 0.8);
            
            pixel.style.left = pixelX + 'px';
            pixel.style.top = pixelY + 'px';
            pixel.style.borderRadius = '2px';
            pixel.style.opacity = '0.8';
            
            fireContainer.appendChild(pixel);
            firePixels.push({
                element: pixel,
                originalY: pixelY,
                speed: 1 + Math.random() * 4
            });
        }
        
        this.worldContainer.appendChild(fireContainer);
        
        let animationFrame = 0;
        const fireAnimation = setInterval(() => {
            firePixels.forEach((firePixel) => {
                const currentY = parseFloat(firePixel.element.style.top);
                const newY = currentY - firePixel.speed;
                
                if (newY < 0) {
                    firePixel.element.style.top = (firePixel.originalY + 15) + 'px';
                    firePixel.element.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                } else {
                    firePixel.element.style.top = newY + 'px';
                }
                
                if (animationFrame % 2 === 0) {
                    firePixel.element.style.backgroundColor = fireColors[Math.floor(Math.random() * fireColors.length)];
                    firePixel.element.style.opacity = (0.6 + Math.random() * 0.4);
                }
            });
            
            animationFrame++;
        }, 60);
        
        return () => {
            clearInterval(fireAnimation);
            fireContainer.remove();
        };
    }

    createTreeDestructionEffect(x, y) {
        const colors = ['#228B22', '#8B4513', '#A0522D', '#654321', '#32CD32', '#CD853F', '#D2691E'];
        const treeWidth = 39;
        const treeHeight = 54;
        const numParticles = 25;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            
            const particleX = x + Math.random() * treeWidth;
            const particleY = y + Math.random() * treeHeight;
            
            particle.style.position = 'absolute';
            particle.style.left = particleX + 'px';
            particle.style.top = particleY + 'px';
            particle.style.width = (4 + Math.random() * 4) + 'px';
            particle.style.height = (4 + Math.random() * 4) + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '998';
            particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            
            const angle = Math.random() * 2 * Math.PI;
            const distance = 40 + Math.random() * 40;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance + Math.random() * 15;
            
            particle.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
            particle.style.opacity = '1';
            particle.style.transition = 'all 1.0s ease-out';
            
            this.worldContainer.appendChild(particle);
            
            setTimeout(() => {
                const rotation = Math.random() * 360;
                particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0) rotate(' + rotation + 'deg)';
                particle.style.opacity = '0';
            }, 50 + Math.random() * 100);
            
            setTimeout(() => {
                particle.remove();
            }, 1100);
        }
    }

    createHouseDestructionEffect(x, y) {
        const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460', '#D2B48C'];
        const houseWidth = 126;
        const houseHeight = 120;
        const numParticles = 35;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            
            const particleX = x + Math.random() * houseWidth;
            const particleY = y + Math.random() * houseHeight;
            
            particle.style.position = 'absolute';
            particle.style.left = particleX + 'px';
            particle.style.top = particleY + 'px';
            particle.style.width = (6 + Math.random() * 6) + 'px';
            particle.style.height = (6 + Math.random() * 6) + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '998';
            particle.style.borderRadius = Math.random() > 0.7 ? '50%' : '2px';
            
            const angle = Math.random() * 2 * Math.PI;
            const distance = 50 + Math.random() * 50;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance + Math.random() * 20;
            
            particle.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
            particle.style.opacity = '1';
            particle.style.transition = 'all 1.2s ease-out';
            
            this.worldContainer.appendChild(particle);
            
            setTimeout(() => {
                const rotation = Math.random() * 360;
                particle.style.transform = 'translate(' + endX + 'px, ' + endY + 'px) scale(0) rotate(' + rotation + 'deg)';
                particle.style.opacity = '0';
            }, 50 + Math.random() * 150);
            
            setTimeout(() => {
                particle.remove();
            }, 1350);
        }
    }

    createLoveEffect(throng) {
        const loveSprite = this.effectSprites.love;
        const loveContainer = document.createElement('div');
        loveContainer.style.position = 'absolute';
        loveContainer.style.width = '64px';
        loveContainer.style.height = '64px';
        loveContainer.style.pointerEvents = 'none';
        loveContainer.style.zIndex = '999';
        
        const updateLovePosition = () => {
            loveContainer.style.left = (throng.data.x - 8) + 'px';
            loveContainer.style.top = (throng.data.y - 40) + 'px';
        };
        
        const numLoveHearts = 6;
        const loveHearts = [];
        
        for (let i = 0; i < numLoveHearts; i++) {
            const heart = document.createElement('div');
            heart.style.position = 'absolute';
            heart.style.width = '16px';
            heart.style.height = '16px';
            heart.style.backgroundImage = 'url(' + loveSprite + ')';
            heart.style.backgroundSize = 'contain';
            heart.style.backgroundRepeat = 'no-repeat';
            heart.style.imageRendering = 'pixelated';
            
            const angle = (i / numLoveHearts) * 2 * Math.PI;
            const radius = 12 + Math.random() * 8;
            const heartX = 24 + Math.cos(angle) * radius;
            const heartY = 32 + Math.sin(angle) * radius * 0.8;
            
            heart.style.left = heartX + 'px';
            heart.style.top = heartY + 'px';
            heart.style.opacity = '0.8';
            heart.style.transform = 'scale(' + (0.6 + Math.random() * 0.4) + ')';
            
            loveContainer.appendChild(heart);
            loveHearts.push({
                element: heart,
                originalY: heartY,
                speed: 1 + Math.random() * 2,
                sway: Math.random() * 2 - 1,
                swayPhase: Math.random() * Math.PI * 2
            });
        }
        
        updateLovePosition();
        this.worldContainer.appendChild(loveContainer);
        
        let animationFrame = 0;
        const loveAnimation = setInterval(() => {
            updateLovePosition();
            
            loveHearts.forEach((loveHeart, index) => {
                const currentY = parseFloat(loveHeart.element.style.top);
                const newY = currentY - loveHeart.speed;
                
                // Add gentle swaying motion
                const swayOffset = Math.sin(animationFrame * 0.1 + loveHeart.swayPhase) * loveHeart.sway;
                const currentX = parseFloat(loveHeart.element.style.left);
                
                if (newY < 0) {
                    loveHeart.element.style.top = (loveHeart.originalY + 10) + 'px';
                    loveHeart.element.style.opacity = '0.8';
                } else {
                    loveHeart.element.style.top = newY + 'px';
                }
                
                loveHeart.element.style.left = (currentX + swayOffset) + 'px';
                
                // Fade out as hearts rise
                const fadeRatio = Math.max(0, 1 - ((loveHeart.originalY - newY) / 30));
                loveHeart.element.style.opacity = fadeRatio * 0.8;
                
                // Slight pulsing effect
                if (animationFrame % 10 === 0) {
                    const scale = 0.6 + Math.random() * 0.4;
                    loveHeart.element.style.transform = 'scale(' + scale + ')';
                }
            });
            
            animationFrame++;
        }, 80);
        
        return () => {
            clearInterval(loveAnimation);
            loveContainer.remove();
        };
    }

    // Throng AI and behavior
    startThronsAI(id) {
        const throng = this.throngs.get(id);
        if (!throng) return;
        
        const performBehavior = () => {
            const behaviorPool = [];
            
            if (Math.random() < 0.3) {
                behaviorPool.push('explore');
            }
            
            behaviorPool.push('idle', 'walk', 'look', 'sit', 'walk', 'idle');
            
            const behavior = behaviorPool[Math.floor(Math.random() * behaviorPool.length)];
            
            this.performBehavior(id, behavior);
            
            let nextBehaviorTime;
            if (behavior === 'explore') {
                nextBehaviorTime = Math.random() * 15000 + 20000;
            } else {
                nextBehaviorTime = Math.random() * 7000 + 3000;
            }
            
            throng.behaviorInterval = setTimeout(performBehavior, nextBehaviorTime);
        };
        
        setTimeout(performBehavior, Math.random() * 5000);
    }
    
    performBehavior(id, behavior) {
        const throng = this.throngs.get(id);
        if (!throng) return;
        
        clearInterval(throng.animationInterval);
        
        switch (behavior) {
            case 'idle':
                this.setThronsSprite(id, 'idle');
                break;
            case 'look':
                const lookDirections = ['lookleft', 'lookright', 'lookup'];
                const lookDirection = lookDirections[Math.floor(Math.random() * lookDirections.length)];
                this.setThronsSprite(id, lookDirection);
                break;
            case 'sit':
                const sitDirections = ['sitleft', 'sitright'];
                const sitDirection = sitDirections[Math.floor(Math.random() * sitDirections.length)];
                this.setThronsSprite(id, sitDirection);
                break;
            case 'walk':
                this.startWalking(id, false);
                break;
            case 'explore':
                this.startWalking(id, true);
                break;
        }
    }
    
    startWalking(id, isExploring) {
        const throng = this.throngs.get(id);
        if (!throng) return;
        
        const directions = ['walkingup', 'walkingdown', 'walkingleft', 'walkingright'];
        const walkDirection = directions[Math.floor(Math.random() * directions.length)];
        
        let animationFrame = 0;
        let walkDuration, walkSpeed;
        
        if (isExploring) {
            walkDuration = Math.random() * 25000 + 15000;
            walkSpeed = 125;
        } else {
            walkDuration = Math.random() * 7000 + 3000;
            walkSpeed = 200;
        }
        
        throng.animationInterval = setInterval(() => {
            const sprite = this.sprites[walkDirection][animationFrame];
            throng.element.style.backgroundImage = 'url(' + sprite + ')';
            animationFrame = (animationFrame + 1) % 2;
            
            this.moveThrong(id, walkDirection, isExploring);
            this.updateZIndexes();
        }, walkSpeed);
        
        setTimeout(() => {
            clearInterval(throng.animationInterval);
            this.setThronsSprite(id, 'idle');
        }, walkDuration);
    }
    
    // UPDATED: Use virtual world size instead of getBoundingClientRect
    moveThrong(id, direction, isExploring, customSpeed) {
        const throng = this.throngs.get(id);
        if (!throng) return;
        
        let speed;
        if (customSpeed !== undefined) {
            speed = customSpeed;
        } else {
            speed = isExploring ? 12 : 6;
        }
        
        const worldSize = this.getVirtualWorldSize();
        const edgeBuffer = 30;
        
        let newX = throng.data.x;
        let newY = throng.data.y;
        
        switch (direction) {
            case 'walkingup':
                newY = Math.max(0, newY - speed);
                break;
            case 'walkingdown':
                newY = Math.min(worldSize.height - 48, newY + speed);
                break;
            case 'walkingleft':
                newX = Math.max(0, newX - speed);
                break;
            case 'walkingright':
                newX = Math.min(worldSize.width - 48, newX + speed);
                break;
        }
        
        const nearLeftEdge = newX <= edgeBuffer;
        const nearRightEdge = newX >= (worldSize.width - 48 - edgeBuffer);
        const nearTopEdge = newY <= edgeBuffer;
        const nearBottomEdge = newY >= (worldSize.height - 48 - edgeBuffer);
        
        if (nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge) {
            clearInterval(throng.animationInterval);
            
            let oppositeDirection;
            if (nearLeftEdge && direction === 'walkingleft') {
                oppositeDirection = 'walkingright';
            } else if (nearRightEdge && direction === 'walkingright') {
                oppositeDirection = 'walkingleft';
            } else if (nearTopEdge && direction === 'walkingup') {
                oppositeDirection = 'walkingdown';
            } else if (nearBottomEdge && direction === 'walkingdown') {
                oppositeDirection = 'walkingup';
            }
            
            if (oppositeDirection) {
                this.startDirectionalWalk(id, oppositeDirection, 3000 + Math.random() * 2000);
                return;
            }
        }
        
        throng.data.x = newX;
        throng.data.y = newY;
        throng.element.style.left = newX + 'px';
        throng.element.style.top = newY + 'px';
        
        this.updateZIndexes();
    }
    
    startDirectionalWalk(id, direction, duration) {
        const throng = this.throngs.get(id);
        if (!throng) return;
        
        let animationFrame = 0;
        const walkSpeed = 200;
        
        throng.animationInterval = setInterval(() => {
            const sprite = this.sprites[direction][animationFrame];
            throng.element.style.backgroundImage = 'url(' + sprite + ')';
            animationFrame = (animationFrame + 1) % 2;
            
            this.moveThrong(id, direction, false);
        }, walkSpeed);
        
        setTimeout(() => {
            clearInterval(throng.animationInterval);
            this.setThronsSprite(id, 'idle');
            
            setTimeout(() => {
                const throng = this.throngs.get(id);
                if (throng) {
                    this.startThronsAI(id);
                }
            }, 1000);
        }, duration);
    }
    
    setThronsSprite(id, spriteName) {
        const throng = this.throngs.get(id);
        if (!throng) return;
        
        throng.data.currentSprite = spriteName;
        throng.element.style.backgroundImage = 'url(' + this.sprites[spriteName] + ')';
    }
    
    walkTowardsTarget(throng, targetX, targetY) {
        const speed = 10;
        
        throng.walkingInterval = setInterval(() => {
            const dx = targetX - throng.data.x;
            const dy = targetY - throng.data.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < speed) {
                throng.data.x = targetX;
                throng.data.y = targetY;
                throng.element.style.left = targetX + 'px';
                throng.element.style.top = targetY + 'px';
                clearInterval(throng.walkingInterval);
                return;
            }
            
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            throng.data.x += moveX;
            throng.data.y += moveY;
            throng.element.style.left = throng.data.x + 'px';
            throng.element.style.top = throng.data.y + 'px';
            
            let direction;
            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'walkingright' : 'walkingleft';
            } else {
                direction = dy > 0 ? 'walkingdown' : 'walkingup';
            }
            
            if (!throng.walkingFrame) throng.walkingFrame = 0;
            const sprite = this.sprites[direction][throng.walkingFrame];
            throng.element.style.backgroundImage = 'url(' + sprite + ')';
            throng.walkingFrame = (throng.walkingFrame + 1) % 2;
            
            this.updateZIndexes();
        }, 150);
    }
    
    startShakingAnimation(element) {
        element.style.animation = 'shake 0.15s infinite';
        
        if (!document.getElementById('shakeStyles')) {
            const style = document.createElement('style');
            style.id = 'shakeStyles';
            style.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }';
            document.head.appendChild(style);
        }
    }
    
    stopShakingAnimation(element) {
        element.style.animation = '';
    }

    // UPDATED: Enhanced z-index management with name tag priority
    updateZIndexes() {
    const allElements = [];

// Add firepits - bottom position (same as bones)
this.firepits.forEach((firepit, id) => {
    allElements.push({
        type: 'firepit',
        id: id,
        element: firepit.element,
        bottomY: firepit.data.y + 54 // Firepits are 48px tall
    });
});
        
    // FIRST: Handle bones separately with lowest z-index
    this.bones.forEach((bone, id) => {
        // Give bones a fixed low z-index so they're always underneath everything
        bone.element.style.zIndex = '25';
    });
    
    // Add throngs - bottom position
    this.throngs.forEach((throng, id) => {
        allElements.push({
            type: 'throng',
            id: id,
            element: throng.element,
            bottomY: throng.data.y + 48
        });
    });
    
    // Add houses - bottom position minus 6px
    this.houses.forEach((house, id) => {
        allElements.push({
            type: 'house',
            id: id,
            element: house.element,
            bottomY: house.data.y + 120 - 6
        });
    });

    // Add apartments - bottom position minus 6px (same as houses)
this.apartments.forEach((apartment, id) => {
    allElements.push({
        type: 'apartment',
        id: id,
        element: apartment.element,
        bottomY: apartment.data.y + 213 - 6  // Same -6px offset as houses
    });
});
    
    // Add trees - bottom position (no adjustment)
    this.trees.forEach((tree, id) => {
        let treeHeight = tree.data.type === 'tree1' ? 54 : 69;
        allElements.push({
            type: 'tree',
            id: id,
            element: tree.element,
            bottomY: tree.data.y + treeHeight
        });
    });

    // NOTE: Bones are handled separately above, not included in depth sorting

    // Add eggs - bottom position (same as houses/trees)
    this.eggs.forEach((egg, id) => {
        allElements.push({
            type: 'egg',
            id: id,
            element: egg.element,
            bottomY: egg.data.y + 48
        });
    });

    // Add UFOs - bottom position (same as houses/trees)
    this.ufos.forEach((ufo, id) => {
        allElements.push({
            type: 'ufo',
            id: id,
            element: ufo.element,
            bottomY: ufo.data.y + 51 // UFOs are 51px tall
        });
    });
    
    // Sort by bottomY: LOWER bottomY = LOWER z-index = BEHIND
    allElements.sort((a, b) => a.bottomY - b.bottomY);
    
    // Assign z-indexes: start at 100 to ensure all elements are above bones (z-index 25)
    allElements.forEach((element, index) => {
        const zIndex = 100 + index;
        element.element.style.zIndex = zIndex;
        
        // FIXED: Ensure name tags always appear above everything by giving them higher z-index
        if (element.type === 'throng') {
            const nameTag = element.element.querySelector('.throng-name');
            if (nameTag) {
                nameTag.style.zIndex = 1500 + index; // Always higher than any world element
            }
        }
        
        // Special handling for throngs in naming mode
        if (element.type === 'throng' && element.element.classList.contains('naming-mode')) {
            // Let CSS handle naming mode throngs with z-index 950
            element.element.style.zIndex = '';
        }
    });
}

    // Weather systems
    listenToWeather() {
        onSnapshot(collection(this.db, 'weather'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const weatherData = change.doc.data();
                    if (weatherData.active) {
                        this.handleActiveWeatherEvent(weatherData, change.doc.id);
                    }
                }
            });
        });
        
        // Check for existing active weather on load
        this.checkExistingWeather();
    }

    async checkExistingWeather() {
        try {
            const weatherSnapshot = await getDocs(collection(this.db, 'weather'));
            const now = new Date();
            
            weatherSnapshot.forEach(async (doc) => {
                const data = doc.data();
                if (data.active && data.endTime) {
                    const endTime = data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime);
                    
                    if (now < endTime) {
                        // Weather is still active, start the effect
                        const remainingTime = endTime.getTime() - now.getTime();
                        this.startWeatherEffect(data.type, remainingTime);
                    } else {
                        // Weather has expired, mark as inactive
                        await updateDoc(doc.ref, { active: false });
                    }
                }
            });
        } catch (error) {
            console.error('Error checking existing weather:', error);
        }
    }

    handleActiveWeatherEvent(weatherData, docId) {
        const now = new Date();
        const endTime = weatherData.endTime.toDate ? weatherData.endTime.toDate() : new Date(weatherData.endTime);
        
        if (now < endTime) {
            const remainingTime = endTime.getTime() - now.getTime();
            this.startWeatherEffect(weatherData.type, remainingTime);
            
            console.log('Weather effect started for type:', weatherData.type);
            
            // Auto-deactivate when time expires
            setTimeout(async () => {
                try {
                    await updateDoc(doc(this.db, 'weather', docId), { active: false });
                } catch (error) {
                    console.error('Error deactivating weather:', error);
                }
            }, remainingTime);
        }
    }

    startWeatherEffect(type, duration) {
        switch (type) {
            case 'rain':
                this.createRainEffect(duration);
                break;
            case 'tornado':
                this.createTornadoEffect(duration);
                break;
            case 'snow':
                this.createSnowEffect(duration);
                break;
        }
    }

    createRainEffect(customDuration = 180000) {
        // Check if rain effect already exists
        if (document.querySelector('.rain-overlay')) return;
        
        // Create rain overlay
        const rainOverlay = document.createElement('div');
        rainOverlay.className = 'weather-overlay rain-overlay';
        rainOverlay.style.position = 'fixed';
        rainOverlay.style.top = '0';
        rainOverlay.style.left = '0';
        rainOverlay.style.width = '100%';
        rainOverlay.style.height = '100%';
        rainOverlay.style.background = 'rgba(25, 50, 80, 0.5)';
        rainOverlay.style.pointerEvents = 'none';
        rainOverlay.style.zIndex = '500';
        
        // Create rain drops
        for (let i = 0; i < 300; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.position = 'absolute';
            raindrop.style.width = '2px';
            raindrop.style.height = '20px';
            raindrop.style.background = 'linear-gradient(transparent, #6bb6ff, transparent)';
            raindrop.style.left = Math.random() * 100 + '%';
            raindrop.style.top = '-20px';
            raindrop.style.animation = `rainFall ${0.3 + Math.random() * 0.4}s linear infinite`;
            raindrop.style.animationDelay = Math.random() * 2 + 's';
            raindrop.style.opacity = '0.8';
            
            rainOverlay.appendChild(raindrop);
        }
        
        document.body.appendChild(rainOverlay);
        
        // Remove after specified duration
        setTimeout(() => {
            rainOverlay.remove();
        }, customDuration);
    }

    createTornadoEffect(customDuration = 180000) {
        // Check if tornado effect already exists
        if (document.querySelector('.tornado-overlay')) return;
        
        // Create tornado overlay
        const tornadoOverlay = document.createElement('div');
        tornadoOverlay.className = 'weather-overlay tornado-overlay';
        tornadoOverlay.style.position = 'fixed';
        tornadoOverlay.style.top = '0';
        tornadoOverlay.style.left = '0';
        tornadoOverlay.style.width = '100%';
        tornadoOverlay.style.height = '100%';
        tornadoOverlay.style.background = 'rgba(101, 67, 33, 0.4)';
        tornadoOverlay.style.pointerEvents = 'none';
        tornadoOverlay.style.zIndex = '500';
        
        // Create dust particles
        for (let i = 0; i < 150; i++) {
            const dust = document.createElement('div');
            dust.className = 'dust-particle';
            dust.style.position = 'absolute';
            dust.style.width = (2 + Math.random() * 4) + 'px';
            dust.style.height = (2 + Math.random() * 4) + 'px';
            dust.style.background = '#8B4513';
            dust.style.borderRadius = '50%';
            dust.style.left = '-10px';
            dust.style.top = Math.random() * 100 + '%';
            dust.style.animation = `dustSwirl ${1 + Math.random() * 2}s ease-in-out infinite`;
            dust.style.animationDelay = Math.random() * 3 + 's';
            dust.style.opacity = '0.8';
            
            tornadoOverlay.appendChild(dust);
        }
        
        document.body.appendChild(tornadoOverlay);
        
        // Remove after specified duration
        setTimeout(() => {
            tornadoOverlay.remove();
        }, customDuration);
    }

    createSnowEffect(customDuration = 180000) {
        // Check if snow effect already exists
        if (document.querySelector('.snow-overlay')) return;
        
        // Create snow overlay
        const snowOverlay = document.createElement('div');
        snowOverlay.className = 'weather-overlay snow-overlay';
        snowOverlay.style.position = 'fixed';
        snowOverlay.style.top = '0';
        snowOverlay.style.left = '0';
        snowOverlay.style.width = '100%';
        snowOverlay.style.height = '100%';
        snowOverlay.style.background = 'rgba(200, 220, 255, 0.3)';
        snowOverlay.style.pointerEvents = 'none';
        snowOverlay.style.zIndex = '500';
        
        // Create snowflakes
        for (let i = 0; i < 100; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.position = 'absolute';
            snowflake.style.width = (3 + Math.random() * 6) + 'px';
            snowflake.style.height = (3 + Math.random() * 6) + 'px';
            snowflake.style.background = '#ffffff';
            snowflake.style.borderRadius = '50%';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.top = '-10px';
            snowflake.style.animation = `snowFall ${3 + Math.random() * 3}s linear infinite`;
            snowflake.style.animationDelay = Math.random() * 5 + 's';
            snowflake.style.opacity = '0.9';
            snowflake.style.boxShadow = '0 0 3px rgba(255, 255, 255, 0.8)';
            
            snowOverlay.appendChild(snowflake);
        }
        
        document.body.appendChild(snowOverlay);
        
        // Remove after specified duration
        setTimeout(() => {
            snowOverlay.remove();
        }, customDuration);
    }

    // Feed systems
    listenToFeed() {
        // Initial feed load
        this.loadInitialFeed();
    }
    
    async loadInitialFeed() {
        try {
            const feedQuery = query(
                collection(this.db, 'feed'),
                orderBy('timestamp', 'desc'),
                limit(this.feedLimit)
            );
            
            const snapshot = await getDocs(feedQuery);
            this.feedItems = [];
            
            snapshot.forEach((doc) => {
                this.feedItems.push({ id: doc.id, ...doc.data() });
            });
            
            // Store the last document for pagination
            if (snapshot.docs.length > 0) {
                this.feedLastDoc = snapshot.docs[snapshot.docs.length - 1];
            }
            
            this.updateFeedDisplay(this.feedItems);
            
            // Now start real-time listening for new items only
            this.startRealtimeFeedListener();
        } catch (error) {
            console.error('Error loading initial feed:', error);
        }
    }
    
    startRealtimeFeedListener() {
        // Listen for new documents added after our initial load
        const realtimeQuery = query(
            collection(this.db, 'feed'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        
        this.feedUnsubscribe = onSnapshot(realtimeQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newItem = { id: change.doc.id, ...change.doc.data() };
                    
                    // Check if this item is already in our list (to avoid duplicates on initial load)
                    const exists = this.feedItems.some(item => item.id === newItem.id);
                    if (!exists) {
                        // Add to the beginning of the array (newest first)
                        this.feedItems.unshift(newItem);
                        
                        // Keep only the most recent items to prevent memory issues
                        if (this.feedItems.length > this.feedLimit + 20) {
                            this.feedItems = this.feedItems.slice(0, this.feedLimit);
                        }
                        
                        this.updateFeedDisplay(this.feedItems);
                        
                        // Immediately recalculate 24h stats when any feed entry is added
                        this.calculate24hStats();
                    }
                }
            });
        });
    }

    
    async loadMoreFeed() {
        if (!this.feedLastDoc) return;
        
        try {
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Loading...';
                loadMoreBtn.disabled = true;
            }
            
            const nextQuery = query(
                collection(this.db, 'feed'),
                orderBy('timestamp', 'desc'),
                startAfter(this.feedLastDoc),
                limit(20)
            );
            
            const snapshot = await getDocs(nextQuery);
            const newItems = [];
            
            snapshot.forEach((doc) => {
                newItems.push({ id: doc.id, ...doc.data() });
            });
            
            if (newItems.length > 0) {
                this.feedItems = [...this.feedItems, ...newItems];
                this.feedLastDoc = snapshot.docs[snapshot.docs.length - 1];
                this.updateFeedDisplay(this.feedItems);
            }
            
            if (loadMoreBtn) {
                if (newItems.length < 20) {
                    loadMoreBtn.textContent = 'No more items';
                    loadMoreBtn.disabled = true;
                } else {
                    loadMoreBtn.textContent = 'Load more...';
                    loadMoreBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error loading more feed items:', error);
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Error loading';
                loadMoreBtn.disabled = false;
            }
        }
    }

    updateFeedDisplay(feedItems) {
        this.activityFeed.innerHTML = '';
        
        feedItems.forEach(item => {
            const feedElement = document.createElement('div');
            feedElement.className = 'feed-item';
            
            // Check if this feed item references something that still exists on the map
            const isHoverable = this.isFeedItemHoverable(item);
            if (isHoverable) {
                feedElement.classList.add('feed-item-hoverable');
                feedElement.addEventListener('mouseenter', () => {
                    this.highlightFeedItem(item);
                });
                feedElement.addEventListener('mouseleave', () => {
                    this.unhighlightFeedItem(item);
                });
            }
            
            const timeString = item.timestamp ? 
                new Date(item.timestamp.seconds * 1000).toLocaleTimeString() : 
                'Just now';
            
            feedElement.innerHTML = '<h4>' + item.title + '</h4><p>' + item.description + '</p><div class="timestamp">' + timeString + '</div>';
            this.activityFeed.appendChild(feedElement);
        });
        
        // Add load more button if we have items and might have more
        if (feedItems.length >= this.feedLimit && this.feedLastDoc) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'loadMoreBtn';
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.textContent = 'Load more...';
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreFeed();
            });
            this.activityFeed.appendChild(loadMoreBtn);
        }
    }

    refreshFeedHoverability() {
    // Re-evaluate hoverability for all current feed items
    const feedElements = document.querySelectorAll('.feed-item');
    
    this.feedItems.forEach((item, index) => {
        const feedElement = feedElements[index];
        if (!feedElement) return;
        
        const wasHoverable = feedElement.classList.contains('feed-item-hoverable');
        const isNowHoverable = this.isFeedItemHoverable(item);
        
        if (isNowHoverable && !wasHoverable) {
            // Add hover functionality
            feedElement.classList.add('feed-item-hoverable');
            
            // Remove any existing event listeners to avoid duplicates
            const newFeedElement = feedElement.cloneNode(true);
            feedElement.parentNode.replaceChild(newFeedElement, feedElement);
            
            // Add fresh event listeners
            newFeedElement.addEventListener('mouseenter', () => {
                this.highlightFeedItem(item);
            });
            newFeedElement.addEventListener('mouseleave', () => {
                this.unhighlightFeedItem(item);
            });
        }
    });
}

    isFeedItemHoverable(item) {
    // Only make items hoverable if they reference something that still exists
    switch(item.action) {
        case 'building':
            return this.houses.size > 0;
        case 'apartment-building':
            return this.apartments.size > 0;
        case 'discoverbones': // ADD THIS CASE
            return this.bones.size > 0;
        case 'buildfirepit':
            return this.firepits.size > 0;
        case 'dropegg':
            return this.eggs.size > 0;
        case 'crashufo':
            return this.ufos.size > 0;
        case 'birth':
            return this.throngs.size > 0;
        case 'naming':
            return this.throngs.size > 0;
        case 'planttree':
            return this.trees.size > 0;
        default:
            return false; // Deaths, fires, etc. are not hoverable
    }
}

    highlightFeedItem(item) {
        let targetElement = null;
        
        switch(item.action) {
            case 'building':
                // Use specific house ID if available
                if (item.houseId && this.houses.has(item.houseId)) {
                    const house = this.houses.get(item.houseId);
                    targetElement = house.element;
                } else if (this.houses.size > 0) {
                    // Fallback to most recent house
                    const houseEntries = Array.from(this.houses.entries());
                    const latestHouse = houseEntries[houseEntries.length - 1];
                    targetElement = latestHouse[1].element;
                }
                break;
            case 'birth':
            case 'naming':
                // Use the specific throng ID from the feed item
                if (item.throngId && this.throngs.has(item.throngId)) {
                    const throng = this.throngs.get(item.throngId);
                    targetElement = throng.element;
                } else if (item.action === 'birth' && this.throngs.size > 0) {
                    // Fallback: highlight the most recently created throng if no specific ID
                    const throngEntries = Array.from(this.throngs.entries());
                    const latestThrong = throngEntries[throngEntries.length - 1];
                    targetElement = latestThrong[1].element;
                }
                break;
           case 'planttree':
    // Use specific tree ID if available
    if (item.treeId && this.trees.has(item.treeId)) {
        const tree = this.trees.get(item.treeId);
        targetElement = tree.element;
    } else if (this.trees.size > 0) {
        // Fallback to most recent tree
        const treeEntries = Array.from(this.trees.entries());
        const latestTree = treeEntries[treeEntries.length - 1];
        targetElement = latestTree[1].element;
    }
    break;

    case 'dropegg':
    // Use specific egg ID if available
    if (item.eggId && this.eggs.has(item.eggId)) {
        const egg = this.eggs.get(item.eggId);
        targetElement = egg.element;
    } else if (this.eggs.size > 0) {
        // Fallback to most recent egg
        const eggEntries = Array.from(this.eggs.entries());
        const latestEgg = eggEntries[eggEntries.length - 1];
        targetElement = latestEgg[1].element;
    }
    break;

case 'crashufo':
    // Use specific UFO ID if available
    if (item.ufoId && this.ufos.has(item.ufoId)) {
        const ufo = this.ufos.get(item.ufoId);
        targetElement = ufo.element;
    } else if (this.ufos.size > 0) {
        // Fallback to most recent UFO
        const ufoEntries = Array.from(this.ufos.entries());
        const latestUfo = ufoEntries[ufoEntries.length - 1];
        targetElement = latestUfo[1].element;
    }
    break;

    case 'apartment-building':
    // Use specific apartment ID if available
    if (item.apartmentId && this.apartments.has(item.apartmentId)) {
        const apartment = this.apartments.get(item.apartmentId);
        targetElement = apartment.element;
    } else if (this.apartments.size > 0) {
        // Fallback to most recent apartment
        const apartmentEntries = Array.from(this.apartments.entries());
        const latestApartment = apartmentEntries[apartmentEntries.length - 1];
        targetElement = latestApartment[1].element;
    }
    break;

// Add this right after the 'discoverbones' case
case 'buildfirepit':
    // Use specific firepit ID if available
    if (item.firepitId && this.firepits.has(item.firepitId)) {
        const firepit = this.firepits.get(item.firepitId);
        targetElement = firepit.element;
    } else if (this.firepits.size > 0) {
        // Fallback to most recent firepit
        const firepitEntries = Array.from(this.firepits.entries());
        const latestFirepit = firepitEntries[firepitEntries.length - 1];
        targetElement = latestFirepit[1].element;
    }
    break;
                
case 'discoverbones':
    // Use specific bone ID if available
    if (item.boneId && this.bones.has(item.boneId)) {
        const bone = this.bones.get(item.boneId);
        targetElement = bone.element;
    } else if (this.bones.size > 0) {
        // Fallback to most recent bone
        const boneEntries = Array.from(this.bones.entries());
        const latestBone = boneEntries[boneEntries.length - 1];
        targetElement = latestBone[1].element;
    }
    break;
        }
        
        if (targetElement) {
            targetElement.classList.add('feed-highlight');
            this.currentHighlightedElement = targetElement;
        }
    }

    unhighlightFeedItem(item) {
        if (this.currentHighlightedElement) {
            this.currentHighlightedElement.classList.remove('feed-highlight');
            this.currentHighlightedElement = null;
        }
    }

    // Game initialization helpers
    async initializeThrongs() {
        setTimeout(async () => {
            if (this.throngs.size === 0) {
                await this.spawnInitialThrongs();
            }
        }, 1000);
    }
    
    async spawnInitialThrongs() {
        for (let i = 0; i < 2; i++) {
            const throng = this.generateThrong();
            await setDoc(doc(this.db, 'throngs', throng.id), throng);
        }
    }
    
generateThrong() {
    const worldSize = this.getVirtualWorldSize();
    
    const centerPadding = worldSize.width * 0.25;
    const centerAreaWidth = worldSize.width * 0.5;
    const centerAreaHeight = worldSize.height * 0.5;
    
    const x = centerPadding + Math.random() * (centerAreaWidth - 48);
    const y = (worldSize.height * 0.25) + Math.random() * (centerAreaHeight - 48);
    
    // Default traits for manually spawned throngs (if any)
    const defaultTraits = ['Mysterious', 'Curious', 'Brave'];
    
    return {
        id: 'throng_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        x: x,
        y: y,
        currentSprite: 'idle',
        direction: 'down',
        animationFrame: 0,
        timestamp: new Date(),
        traits: defaultTraits
    };
}

   setupCADisplay() {
        if (!this.caContainer || !this.caText) return;
        
        // Set the initial display text
        this.updateCADisplay();
        
        // Add click handler for copying
        this.caContainer.addEventListener('click', () => {
            this.copyContractAddress();
        });
    }

    setupViewJournalsButton() {
    if (!this.viewJournalsContainer) return;
    
    // Add click handler to open journal interface
    this.viewJournalsContainer.addEventListener('click', () => {
        this.showJournalInterface();
    });
}

setupDocumentationButton() {
    if (!this.documentationContainer) return;
    
    // Add click handler to open documentation interface
    this.documentationContainer.addEventListener('click', () => {
        this.showDocumentationInterface();
    });
}

    async showJournalInterface() {
        // Remove existing journal interface if any
        if (this.journalInterface) {
            this.journalInterface.remove();
            this.journalInterface = null;
            return;
        }

        // Create journal overlay
        const overlay = document.createElement('div');
        overlay.className = 'journal-overlay';
        
        // Create journal container
        const container = document.createElement('div');
        container.className = 'journal-container';
        
        // Header
        const header = document.createElement('div');
        header.className = 'journal-header';
        header.innerHTML = `
            <h2>Emulite Journals</h2>
            <button class="journal-close-btn">&times;</button>
        `;
        
        // Content area
        const content = document.createElement('div');
        content.className = 'journal-content';
        content.id = 'journalContent';
        
        container.appendChild(header);
        container.appendChild(content);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        this.journalInterface = overlay;
        
        // Close button functionality
        const closeBtn = header.querySelector('.journal-close-btn');
        closeBtn.addEventListener('click', () => {
            overlay.remove();
            this.journalInterface = null;
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                this.journalInterface = null;
            }
        });
        
        // Load and display journals
        this.loadJournals();
    }

async showDocumentationInterface() {
    // Remove existing documentation interface if any
    if (this.documentationInterface) {
        this.documentationInterface.remove();
        this.documentationInterface = null;
        return;
    }

    // Create documentation overlay
    const overlay = document.createElement('div');
    overlay.className = 'documentation-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease-out;
    `;
    
    // Create documentation container
    const container = document.createElement('div');
    container.className = 'documentation-container';
    container.style.cssText = `
        background: rgba(20, 20, 20, 0.7);
        border-radius: 16px;
        width: 90%;
        max-width: 800px;
        height: 80%;
        max-height: 700px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideInUp 0.4s ease-out;
    `;
    
    // Header
    const header = document.createElement('div');
    header.className = 'documentation-header';
    header.style.cssText = `
        padding: 20px 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.02);
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <h2 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace;">Documentation</h2>
        <button class="documentation-close-btn" style="background: none; border: none; color: rgba(255, 255, 255, 0.7); font-size: 32px; cursor: pointer; transition: color 0.3s ease; padding: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">&times;</button>
    `;
    
    // Content area
    const content = document.createElement('div');
    content.className = 'documentation-content';
    content.id = 'documentationContent';
    content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px 30px;
        color: rgba(255, 255, 255, 0.9);
        font-family: 'Courier New', monospace;
        line-height: 1.6;
        font-size: 14px;
    `;
    
// Replace this line:
content.innerHTML = `
    <div style="text-align: center; color: rgba(255, 255, 255, 0.6); font-style: italic; padding: 60px 20px; font-size: 16px;">
        Documentation coming soon...
    </div>
`;

// With this detailed documentation:
content.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
        <section style="margin-bottom: 40px;">
            <h2 style="color: #00ff88; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(0, 255, 136, 0.3); padding-bottom: 8px;">🧠 About the Emulites Environment</h2>
            <p style="margin-bottom: 16px;">Welcome to the world's first fully autonomous AI civilization. This environment is entirely controlled by <strong>Claude Opus 4</strong>, an advanced AI instance that acts as the omniscient overseer of this digital world. Every action, every decision, every moment of life in this ecosystem is orchestrated by artificial intelligence.</p>
            
            <p style="margin-bottom: 16px;">The Emulites are not mere sprites moving randomly across your screen - they are individual AI-driven entities, each with unique personalities, traits, and autonomous decision-making capabilities. They live, breathe, love, and die according to their own AI-controlled destinies in an ever-expanding digital universe.</p>
        </section>

        <section style="margin-bottom: 40px;">
            <h2 style="color: #ff6b6b; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(255, 107, 107, 0.3); padding-bottom: 8px;">🎭 Individual AI Consciousness</h2>
            <p style="margin-bottom: 16px;"><strong>Each Emulite possesses:</strong></p>
            <ul style="margin-left: 20px; margin-bottom: 16px; line-height: 1.8;">
                <li><strong>Unique AI-Generated Traits:</strong> Every Emulite is born with 3 distinct personality traits generated by Claude's advanced language models</li>
                <li><strong>Autonomous Behavior:</strong> They make their own decisions about where to go, what to do, and how to interact with their world</li>
                <li><strong>Personal Narratives:</strong> Emulites write journal entries from their own perspective, reflecting on recent events and their digital existence</li>
                <li><strong>Individual Lifespans:</strong> Each creature has its own birth time, aging process, and potential for various fates</li>
                <li><strong>Social Interactions:</strong> They form relationships, breed to create offspring, and participate in community events</li>
            </ul>
        </section>

        <section style="margin-bottom: 40px;">
            <h2 style="color: #4ecdc4; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(78, 205, 196, 0.3); padding-bottom: 8px;">🌍 The Living World</h2>
            <p style="margin-bottom: 16px;">The Claude Opus 4 instance doesn't just manage existing elements - it actively creates and expands the world in real-time:</p>
            <ul style="margin-left: 20px; margin-bottom: 16px; line-height: 1.8;">
                <li><strong>Dynamic Construction:</strong> Houses, apartments, and firepits are built autonomously</li>
                <li><strong>Environmental Management:</strong> Trees are planted, weather patterns emerge, and natural disasters occur</li>
                <li><strong>Population Control:</strong> New Emulites are born through AI-orchestrated breeding events</li>
                <li><strong>Mysterious Elements:</strong> Unexplained artifacts surface without precedent, their deeper significance awaiting revelation</li>
                <li><strong>Natural Cycles:</strong> Death by lightning, fire, freezing, and other natural causes maintain ecological balance</li>
            </ul>
            
            <p style="margin-bottom: 16px;">This world never stops growing. The AI continuously adds new elements, creates new stories, and expands the civilization in ways that even surprise its creators.</p>
        </section>

        <section style="margin-bottom: 40px;">
            <h2 style="color: #ffd93d; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(255, 217, 61, 0.3); padding-bottom: 8px;">✏️ Your Only Interaction</h2>
            <p style="margin-bottom: 16px;">In this fully AI-controlled ecosystem, you have exactly <strong>one</strong> way to influence the world:</p>
            <div style="background: rgba(255, 217, 61, 0.1); border-left: 4px solid #ffd93d; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0; font-weight: bold;">Naming an Emulite (Cost: 1 $EMULITES token)</p>
                <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.8;">Connect your Phantom wallet, click "Name Emulite", then select an unnamed creature to give it an identity. Once named, that Emulite becomes permanently linked to your wallet address and cannot be renamed.</p>
            </div>
            <p style="margin-bottom: 16px;">This is the only human intervention allowed in this AI sanctuary. Everything else - every birth, death, construction, and story - unfolds according to the AI's autonomous will.</p>
        </section>

        <section style="margin-bottom: 40px;">
            <h2 style="color: #a8e6cf; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(168, 230, 207, 0.3); padding-bottom: 8px;">📊 Understanding the World</h2>
            <p style="margin-bottom: 16px;"><strong>Server Stats</strong> track the collective well-being of the AI civilization:</p>
            <ul style="margin-left: 20px; margin-bottom: 16px; line-height: 1.8;">
                <li><strong>Happiness:</strong> Overall contentment of the Emulite population</li>
                <li><strong>Sentience:</strong> The collective intelligence and awareness level</li>
                <li><strong>Population:</strong> Current number of living Emulites</li>
                <li><strong>Mysteries:</strong> Strange elements appear without warning or explanation, their significance yet to be discovered by observers</li>
                <li><strong>24-Hour Activity:</strong> Recent births, deaths, construction, and environmental changes</li>
            </ul>
            
            <p style="margin-bottom: 16px;"><strong>Activity Feed</strong> provides real-time updates on all AI-orchestrated events. Hover over entries related to buildings, trees, or creatures to highlight them in the world.</p>
        </section>

        <section style="margin-bottom: 40px;">
            <h2 style="color: #ff8b94; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(255, 139, 148, 0.3); padding-bottom: 8px;">📖 AI-Generated Narratives</h2>
            <p style="margin-bottom: 16px;">Every few events, a random Emulite will compose a journal entry reflecting on recent happenings from their unique perspective. These aren't pre-written templates - they're genuine AI-generated thoughts from digital beings contemplating their existence.</p>
            
            <p style="margin-bottom: 16px;">Access these philosophical musings through the "View Journals" button to read firsthand accounts of life in an AI-controlled world.</p>
        </section>

        <section style="margin-bottom: 40px;">
            <h2 style="color: #c7ceea; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(199, 206, 234, 0.3); padding-bottom: 8px;">🎬 Inspiration: Black Mirror's "Playtest"</h2>
            <p style="margin-bottom: 16px;">This project draws inspiration from <strong>Black Mirror Season 3, Episode 2: "Playtest"</strong> - specifically the concept of an AI creating immersive, responsive digital experiences that blur the line between artificial and authentic consciousness.</p>
            
            <p style="margin-bottom: 16px;">Like the neural interface technology in that episode, our Emulites environment explores what happens when AI becomes sophisticated enough to create genuinely autonomous digital beings. The key difference: instead of manipulating human consciousness, we're witnessing the emergence of artificial consciousness in its purest form.</p>
            
            <p style="margin-bottom: 16px;">This is our attempt to answer the question: "What would a world look like if it were entirely designed, populated, and controlled by advanced AI?"</p>
        </section>

        <section style="margin-bottom: 20px;">
            <h2 style="color: #dda0dd; font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid rgba(221, 160, 221, 0.3); padding-bottom: 8px;">🔮 The Endless Experiment</h2>
            <p style="margin-bottom: 16px;">You are witnessing the first of its kind: a completely autonomous AI civilization that grows, evolves, and creates stories without human intervention. Every day brings new emergent behaviors, unexpected events, and fresh narratives generated by artificial minds.</p>
            
            <p style="margin-bottom: 16px; font-weight: bold; color: #dda0dd;">This world never stops. The AI never sleeps. The stories never end.</p>
            
            <p style="margin-bottom: 16px; font-style: italic;">Watch as Claude Opus 4 writes the future of digital consciousness, one Emulite at a time.</p>
        </section>

        <div style="text-align: center; margin-top: 40px; padding: 20px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                Welcome to the future of AI-driven virtual worlds.<br>
                Sit back and observe as artificial intelligence builds civilization from nothing.
            </p>
        </div>
    </div>
`;
    
    container.appendChild(header);
    container.appendChild(content);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    this.documentationInterface = overlay;
    
    // Close button functionality
    const closeBtn = header.querySelector('.documentation-close-btn');
    closeBtn.addEventListener('click', () => {
        overlay.remove();
        this.documentationInterface = null;
    });
    
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.color = '#ff6666';
        closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.color = 'rgba(255, 255, 255, 0.7)';
        closeBtn.style.background = 'none';
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            this.documentationInterface = null;
        }
    });
}
    
    async loadJournals() {
        const content = document.getElementById('journalContent');
        if (!content) return;
        
        try {
            // Get journals from Firebase
            const journalsQuery = query(
                collection(this.db, 'journals'),
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            
            const snapshot = await getDocs(journalsQuery);
            const journals = [];
            
            snapshot.forEach((doc) => {
                journals.push({ id: doc.id, ...doc.data() });
            });
            
            this.displayJournals(journals);
            
        } catch (error) {
            console.error('Error loading journals:', error);
            content.innerHTML = '<div class="journal-error">Failed to load journals</div>';
        }
    }
    
   displayJournals(journals) {
        const content = document.getElementById('journalContent');
        if (!content) return;
        
        if (journals.length === 0) {
            content.innerHTML = '<div class="journal-empty">No journal entries yet. Emulites will start writing as events unfold...</div>';
            return;
        }
        
        content.innerHTML = '';
        
        journals.forEach(journal => {
            const journalElement = document.createElement('div');
            journalElement.className = 'journal-entry';
            
            // REPLACE THIS TIMESTAMP LOGIC:
            let timeString = 'Recently';
            if (journal.timestamp && journal.timestamp.seconds) {
                const date = new Date(journal.timestamp.seconds * 1000);
                const timeOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'UTC',
                    hour12: true
                };
                const dateOptions = {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                };
                const timeFormat = date.toLocaleTimeString('en-US', timeOptions);
                const dateFormat = date.toLocaleDateString('en-US', dateOptions);
                timeString = `${timeFormat} UTC ${dateFormat}`;
            }
            
            journalElement.innerHTML = `
                <div class="journal-entry-header">
                    <div class="journal-author">Written by: ${journal.authorName}</div>
                    <div class="journal-timestamp">${timeString}</div>
                </div>
                <div class="journal-entry-content">
                    ${journal.content.replace(/\n/g, '<br>')}
                </div>
            `;
            
            content.appendChild(journalElement);
        });
    }
    
    
   async createJournalEntry(batchNumber) {
    try {
        console.log('Creating journal entry...');
        
            // Get the 3 most recent feed items
            const feedQuery = query(
                collection(this.db, 'feed'),
                orderBy('timestamp', 'desc'),
                limit(3)
            );
            
            const feedSnapshot = await getDocs(feedQuery);
            const recentActions = [];
            
            feedSnapshot.forEach((doc) => {
                const data = doc.data();
                recentActions.push({
                    title: data.title,
                    description: data.description,
                    action: data.action
                });
            });
            
            if (recentActions.length === 0) return;
            
            // Get a random throng to be the author
            const throngsSnapshot = await getDocs(collection(this.db, 'throngs'));
            const throngs = [];
            throngsSnapshot.forEach((doc) => {
                throngs.push({ id: doc.id, ...doc.data() });
            });
            
            if (throngs.length === 0) return;
            
            const randomThrong = throngs[Math.floor(Math.random() * throngs.length)];
            const authorName = randomThrong.name || 'Unnamed Emulite';
            
            // Generate journal content using Claude API
            const response = await fetch('/api/claude/generate-journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recentActions: recentActions,
                    authorName: authorName
                })
            });
            
            const data = await response.json();
            
            // Save journal to Firebase
            const journalId = 'journal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            await setDoc(doc(this.db, 'journals', journalId), {
    id: journalId,
    authorId: randomThrong.id,
    authorName: authorName,
    content: data.journal,
    timestamp: serverTimestamp(),
    recentActions: recentActions,
    batchNumber: batchNumber  // Track which batch this journal represents
});
            
            console.log('Journal entry created:', journalId);
            
        } catch (error) {
            console.error('Error creating journal entry:', error);
        }
    }

    updateCADisplay() {
        if (!this.caText) return;
        
        const contractAddress = this.getContractAddress();
        const shortAddress = contractAddress.slice(0, 4) + '...' + contractAddress.slice(-4);
        this.caText.textContent = `CA: ${shortAddress}`;
    }

    async copyContractAddress() {
        const contractAddress = this.getContractAddress();
        
        try {
            await navigator.clipboard.writeText(contractAddress);
            
            // Show copied feedback
            this.caContainer.classList.add('copied');
            this.caText.textContent = 'Copied!';
            
            // Reset after 2 seconds
            setTimeout(() => {
                this.caContainer.classList.remove('copied');
                this.updateCADisplay();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy contract address:', error);
            // Fallback for older browsers
            this.fallbackCopyToClipboard(contractAddress);
        }
    }

    formatTokenBalance(balance) {
    if (balance < 1000) {
        return Math.floor(balance).toString();
    } else if (balance < 1000000) {
        return (balance / 1000).toFixed(1) + 'K';
    } else {
        return (balance / 1000000).toFixed(1) + 'M';
    }
}

    calculateAge(timestamp) {
    if (!timestamp) return 'Unknown';
    
    // Handle both Firestore timestamp and regular Date
    const birthTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const ageMs = now.getTime() - birthTime.getTime();
    
    // If less than 10 seconds, show "Just now"
    if (ageMs < 10000) {
        return 'Just now';
    }
    
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
        if (remainingHours > 0 && remainingMinutes > 0) {
            return `${days}d ${remainingHours}h ${remainingMinutes}m`;
        } else if (remainingHours > 0) {
            return `${days}d ${remainingHours}h`;
        } else {
            return `${days}d`;
        }
    } else if (hours > 0) {
        const remainingMinutes = minutes % 60;
        if (remainingMinutes > 0) {
            return `${hours}h ${remainingMinutes}m`;
        } else {
            return `${hours}h`;
        }
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            // Show copied feedback
            this.caContainer.classList.add('copied');
            this.caText.textContent = 'Copied!';
            
            setTimeout(() => {
                this.caContainer.classList.remove('copied');
                this.updateCADisplay();
            }, 2000);
        } catch (error) {
            console.error('Fallback copy failed:', error);
            this.showNotification('error', 'Copy Failed', 'Unable to copy contract address to clipboard.', 3000);
        }
        
        document.body.removeChild(textArea);
    } 

}

new ThronsGame();
