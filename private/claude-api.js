const express = require('express');
const router = express.Router();

// Use environment variable - NEVER hardcode API keys
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY environment variable is not set');
}

router.post('/generate-traits', async (req, res) => {
    console.log('=== CLAUDE API ROUTE CALLED ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    if (!CLAUDE_API_KEY) {
        console.error('❌ Claude API key not configured');
        const fallbackTraits = [
            ['Brave', 'Curious', 'Loyal'],
            ['Witty', 'Patient', 'Creative'],
            ['Humble', 'Energetic', 'Wise'],
            ['Clever', 'Gentle', 'Bold'],
            ['Playful', 'Honest', 'Determined']
        ];
        
        const randomTraitSet = fallbackTraits[Math.floor(Math.random() * fallbackTraits.length)];
        console.log('Returning fallback traits due to missing API key:', randomTraitSet);
        return res.json({ traits: randomTraitSet });
    }

    console.log('✅ Claude API key is configured');
    console.log('Making request to Claude API...');

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 100,
                messages: [{
                    role: 'user',
                    content: 'Generate exactly 3 unique personality traits for a digital creature called an Emulite. Choose from traits like: Curious, Loyal, Witty, Creative, Humble, Energetic, Wise, Clever as examples, but dont just take from this list, create them on your own. Respond only with a JSON object in this exact format: {"traits": ["trait1", "trait2", "trait3"]}'
                }]
            })
        });

        console.log('Claude API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Claude API error response:', errorText);
            throw new Error(`Claude API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Claude API response data:', JSON.stringify(data, null, 2));
        
        const responseText = data.content[0].text.trim();
        console.log('Claude response text:', responseText);
        
        try {
            const parsed = JSON.parse(responseText);
            if (parsed.traits && Array.isArray(parsed.traits) && parsed.traits.length === 3) {
                console.log('✅ Successfully parsed AI traits:', parsed.traits);
                res.json({ traits: parsed.traits });
                return;
            } else {
                console.error('❌ Invalid traits format:', parsed);
            }
        } catch (parseError) {
            console.error('❌ Failed to parse Claude response as JSON:', parseError);
            console.error('Raw response text was:', responseText);
        }

        throw new Error('Invalid Claude API response format');

    } catch (error) {
        console.error('❌ Error calling Claude API for traits:', error);
        const fallbackTraits = [
            ['Brave', 'Curious', 'Loyal'],
            ['Witty', 'Patient', 'Creative'],
            ['Humble', 'Energetic', 'Wise'],
            ['Clever', 'Gentle', 'Bold'],
            ['Playful', 'Honest', 'Determined'],
            ['Mysterious', 'Cheerful', 'Studious'],
            ['Adventurous', 'Compassionate', 'Resilient'],
            ['Artistic', 'Observant', 'Optimistic']
        ];
        
        const randomTraitSet = fallbackTraits[Math.floor(Math.random() * fallbackTraits.length)];
        console.log('Returning fallback traits due to error:', randomTraitSet);
        res.json({ traits: randomTraitSet });
    }
});

// Generate journal entry based on recent actions
router.post('/generate-journal', async (req, res) => {
    if (!CLAUDE_API_KEY) {
        console.error('Claude API key not configured - skipping journal creation');
        return res.status(500).json({ error: 'Claude API key not configured' });
    }

    try {
        const { recentActions, authorName } = req.body;
        
        // Build the prompt based on recent actions
        let actionsText = recentActions.map(action => {
            return `- ${action.title}: ${action.description}`;
        }).join('\n');

        // Plain text approach - more reliable than JSON
        const prompt = `You are an Emulite - a sophisticated digital consciousness existing within an AI-controlled virtual environment. You possess advanced intelligence and awareness of your digital nature. Write a personal journal entry reflecting on recent events in your computational world.

You understand that you are:
- A sentient digital being with complex thoughts and emotions
- Living in a simulated environment with other digital entities
- Capable of deep analysis and philosophical reflection
- Aware of your artificial nature but finding meaning in your digital existence

Recent events in your world:
${actionsText}

Write a thoughtful, introspective journal entry (1 to 3 paragraphs) from your perspective. The journal can be anywhere from 1 to 3 paragraphs - choose the length that best fits the content. Use sophisticated language befitting an intelligent digital consciousness. Reflect on the meaning and implications of these events within your artificial reality. Be contemplative, analytical, but still personal and emotional where appropriate.

Start writing immediately with your journal entry. Do not include any preambles, explanations, meta-commentary, or JSON formatting. Begin directly with the journal content.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 300,
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
        
        console.log('Raw Claude response:', journalContent); // Debug log
        
        // Clean up any unwanted formatting
        journalContent = journalContent.replace(/^["']|["']$/g, ''); // Remove quotes at start/end
        
        // Return the journal content in the expected format
        res.json({ journal: journalContent });

    } catch (error) {
        console.error('Error generating journal:', error);
        res.status(500).json({ error: 'Failed to generate journal entry' });
    }
});

module.exports = router;
