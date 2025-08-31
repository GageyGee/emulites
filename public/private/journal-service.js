const admin = require('firebase-admin');
const fetch = require('node-fetch');

class JournalService {
    constructor() {
        this.db = admin.firestore();
        this.processedFeedCount = 0;
        this.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
        
        console.log('Journal Service: Initialized with Firebase Admin');
        
        // Start monitoring after a brief delay to ensure Firebase is ready
        setTimeout(() => {
            this.monitorFeedCollection();
        }, 2000);
    }
    
    monitorFeedCollection() {
        if (!this.db) {
            console.error('Journal Service: Database not initialized');
            return;
        }
        
        console.log('Journal Service: Starting feed collection monitoring...');
        
        // Listen to all changes in the feed collection
        const feedCollection = this.db.collection('feed');
        
        feedCollection.onSnapshot(async (snapshot) => {
            const currentFeedCount = snapshot.size;
            
            // Only proceed if feed count increased and is a multiple of 3
            if (currentFeedCount > this.processedFeedCount && currentFeedCount % 3 === 0) {
                console.log(`Journal Service: Feed count is now ${currentFeedCount}, checking for journal creation...`);
                
                try {
                    await this.checkAndCreateJournal(currentFeedCount);
                } catch (error) {
                    console.error('Journal Service: Error in journal creation process:', error);
                }
            }
            
            this.processedFeedCount = currentFeedCount;
        }, (error) => {
            console.error('Journal Service: Feed monitoring error:', error);
        });
    }
    
    async checkAndCreateJournal(totalFeedCount) {
        const journalClaimRef = this.db.collection('system').doc('journalClaims');
        
        try {
            // Use transaction to atomically claim the right to create this journal
            await this.db.runTransaction(async (transaction) => {
                const claimDoc = await transaction.get(journalClaimRef);
                
                let lastJournalFeedCount = 0;
                if (claimDoc.exists) {
                    const data = claimDoc.data();
                    lastJournalFeedCount = data.lastJournalFeedCount || 0;
                }
                
                // Only create journal if we haven't already created one for this feed count
                if (totalFeedCount > lastJournalFeedCount) {
                    console.log(`Journal Service: Claiming journal creation for feed count ${totalFeedCount} (last was ${lastJournalFeedCount})`);
                    
                    // Update the claim to this feed count
                    transaction.set(journalClaimRef, {
                        lastJournalFeedCount: totalFeedCount,
                        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
                        claimedBy: 'journal-service'
                    });
                    
                    // Create journal outside transaction to avoid timeout
                    setTimeout(() => {
                        const batchNumber = totalFeedCount / 3;
                        this.createJournalEntry(batchNumber);
                    }, 100);
                } else {
                    console.log(`Journal Service: Journal already exists for feed count ${totalFeedCount}`);
                }
            });
        } catch (error) {
            console.error('Journal Service: Error in journal claim transaction:', error);
        }
    }
    
    async generateJournalWithClaude(recentActions, authorName) {
        if (!this.CLAUDE_API_KEY) {
            console.error('Journal Service: Claude API key not configured - skipping journal creation');
            return null;
        }

        try {
            // Build the prompt based on recent actions
            let actionsText = recentActions.map(action => {
                return `- ${action.title}: ${action.description}`;
            }).join('\n');

            // Generate random elements to make each journal unique
            const moods = ['contemplative', 'curious', 'reflective', 'thoughtful', 'introspective', 'wondering', 'observant'];
            const perspectives = [
                'reflect on these recent happenings and what daily life has been like',
                'think about these events and how they fit into your everyday digital existence', 
                'consider these developments and share what else has been on your mind lately',
                'ponder these occurrences and discuss what your days have been like recently',
                'examine these events and talk about other aspects of your digital life'
            ];
            const startTypes = [
                'Start with an observation about one of the events',
                'Begin with a thought about your digital existence', 
                'Open with a reflection on recent changes',
                'Start by describing something you\'ve noticed',
                'Begin with a personal insight or feeling'
            ];

            const randomMood = moods[Math.floor(Math.random() * moods.length)];
            const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
            const randomStart = startTypes[Math.floor(Math.random() * startTypes.length)];

            // Varied prompt to ensure unique entries
            const prompt = `Write a ${randomMood} personal journal entry from an Emulite's perspective about these recent events:

${actionsText}

${randomPerspective.charAt(0).toUpperCase() + randomPerspective.slice(1)}. ${randomStart}. Write 2-3 paragraphs, around 150 words total. Be natural and vary your sentence structures. No titles or "Dear Journal" - just start with your thoughts.

Make this entry unique - avoid starting multiple sentences the same way or using repetitive phrases.`;

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 400, // Reduced but sufficient for 150 words
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data = await response.json();
            let journalContent = data.content[0].text.trim();
            
            console.log('Journal Service: Claude API response received successfully');
            
            // Improved cleaning of unwanted prefixes and formatting
            journalContent = this.cleanJournalContent(journalContent);
            
            return journalContent;

        } catch (error) {
            console.error('Journal Service: Error calling Claude API:', error);
            return null;
        }
    }
    
    cleanJournalContent(content) {
        // Remove common unwanted prefixes - be more specific to avoid false matches
        const unwantedPatterns = [
            /^Dear Journal,?\s*/i,
            /^Journal Entry \d+:?\s*/i,
            /^Entry \d+:?\s*/i,
            /^Day \d+:?\s*/i,
            /^Journal:?\s*/i,
            /^Personal Log:?\s*/i,
            /^Digital Reflections?:?\s*/i,
            /^Computational Musings?:?\s*/i,
            /^\*+\s*/,  // Remove asterisks
            /^["'`]+/,   // Remove leading quotes
            /["'`]+$/    // Remove trailing quotes
        ];
        
        let cleaned = content.trim();
        
        // Apply each cleaning pattern
        for (const pattern of unwantedPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        // Remove any extra whitespace
        cleaned = cleaned.trim();
        
        // More conservative first line removal - only remove if it's clearly a title/header
        const lines = cleaned.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) {
            const firstLine = lines[0].trim();
            
            // Only remove first line if it's clearly a title (very specific conditions)
            const isClearTitle = (
                firstLine.length < 30 && // Short
                !firstLine.includes(' I ') && // Doesn't contain personal pronouns
                !firstLine.includes(' my ') &&
                !firstLine.includes(' our ') &&
                !firstLine.includes(' we ') &&
                !firstLine.endsWith('.') && // No sentence ending
                !firstLine.endsWith('!') &&
                !firstLine.endsWith('?') &&
                (firstLine.includes(':') || // Contains colon (title-like)
                 firstLine === firstLine.toUpperCase() || // All caps (title-like)
                 /^(Entry|Day|Journal|Log|Reflections?|Musings?)(\s|\d)/i.test(firstLine)) // Starts with clear title words
            );
            
            if (isClearTitle) {
                lines.shift();
                cleaned = lines.join('\n\n');
            }
        }
        
        // Ensure the result starts with a capital letter
        if (cleaned && cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        
        return cleaned.trim();
    }
    
    async createJournalEntry(batchNumber) {
        try {
            console.log(`Journal Service: Creating journal entry for batch ${batchNumber}...`);
            
            // Get the 3 most recent feed items
            const feedQuery = this.db.collection('feed')
                .orderBy('timestamp', 'desc')
                .limit(3);
            
            const feedSnapshot = await feedQuery.get();
            const recentActions = [];
            
            feedSnapshot.forEach((doc) => {
                const data = doc.data();
                recentActions.push({
                    title: data.title,
                    description: data.description,
                    action: data.action
                });
            });
            
            if (recentActions.length === 0) {
                console.log('Journal Service: No recent actions found, skipping journal creation');
                return;
            }
            
            // Get a random throng to be the author
            const throngsSnapshot = await this.db.collection('throngs').get();
            const throngs = [];
            throngsSnapshot.forEach((doc) => {
                throngs.push({ id: doc.id, ...doc.data() });
            });
            
            if (throngs.length === 0) {
                console.log('Journal Service: No throngs found, skipping journal creation');
                return;
            }
            
            const randomThrong = throngs[Math.floor(Math.random() * throngs.length)];
            const authorName = randomThrong.name || 'Unnamed Emulite';
            
            // Generate journal content using Claude API directly
            const journalContent = await this.generateJournalWithClaude(recentActions, authorName);
            
            if (!journalContent) {
                console.log('Journal Service: Failed to generate journal content, skipping creation');
                return;
            }
            
            // Save journal to Firebase
            const journalId = 'journal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            await this.db.collection('journals').doc(journalId).set({
                id: journalId,
                authorId: randomThrong.id,
                authorName: authorName,
                content: journalContent,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                recentActions: recentActions,
                batchNumber: batchNumber
            });
            
            console.log(`Journal Service: Journal entry created successfully: ${journalId}`);
            
        } catch (error) {
            console.error('Journal Service: Error creating journal entry:', error);
        }
    }
}

module.exports = JournalService;
