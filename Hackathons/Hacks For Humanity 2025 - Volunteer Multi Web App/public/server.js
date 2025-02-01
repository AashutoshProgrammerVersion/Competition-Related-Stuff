require('dotenv').config();
const axios = require('axios');
const User = require('./models/User');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Add Gemini AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const mongoURI = 'mongodb+srv://xhyperbeam:somethingdopdopes@communityvolunteerhubst.hnn8z.mongodb.net/?retryWrites=true&w=majority';
// The address of our MongoDB database (like a street address for our data)

mongoose.connect(mongoURI, {
    useNewUrlParser: true, // Uses the new way to process the database address
    useUnifiedTopology: true, // Uses the new way to connect to the database
    serverSelectionTimeoutMS: 5000 // Gives up trying to connect after 5 seconds
})
.then(() => {
    // If connection is successful
    console.log('MongoDB connected successfully');
})
.catch(err => {
    // If connection fails
    console.error('MongoDB connection error:', err.message); // err.message shows the error specifc error message for the MongoDB which is for Javascript errors objects and based on what it is, we can control our response with our code
    if (err.name === 'MongoServerSelectionError') {
        console.error('Could not connect to MongoDB. Please check your connection string and network connection.');
    }
    process.exit(1); // Stops the program if can't connect to database
});

const express = require('express'); // Load web server tool
const cors = require('cors'); // Load tool that allows web browser connections
const app = express(); // Create our web server
const PORT = process.env.PORT || 3000; // Choose which port to run on

// Set up server features
app.use(cors()); // Allow web browser connections
app.use(express.json()); // Allow JSON data

// Add a route to serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html')); //__dirname: Node.js global variable representing the directory of the current module
});

// Add a route to serve opportunity-details.html
app.get('/opportunity-details', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/opportunity-details.html'));
});

// Maximum number of pages we'll fetch to avoid overloading
const MAX_PAGES_TO_FETCH = 5; 

// JWT middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Endpoint to get real opportunities from Open Volunteer API
app.get('/api/opportunities', async (req, res) => {
    // When someone requests volunteer opportunities
    try {
        const ITEMS_PER_PAGE = parseInt(req.query.per_page) || 8;
        // How many opportunities to show per page
        
        const MAX_PAGES = 20;
        // Maximum number of pages allowed
        
        let requestedPage = parseInt(req.query.page) || 1;
        // Which page of opportunities they want to see
        
        // Get search query from request params
        const searchQuery = req.query.search || '';
        
        // Cache results to avoid repeated API calls
        if (!global.cachedOpportunities) {
            global.cachedOpportunities = [];
            try {
                for (let currentApiPage = 1; currentApiPage <= MAX_PAGES_TO_FETCH; currentApiPage++) {
                    const response = await axios.get('https://www.volunteerconnector.org/api/search/', {
                        params: { 
                            page: currentApiPage,
                            per_page: 100
                        }
                    });
                    
                    if (!response.data.results?.length) break;
                    global.cachedOpportunities.push(...response.data.results);
                }
            } catch (apiError) {
                console.error('API fetch error:', apiError);
                global.cachedOpportunities = [];
            }
            
            // Cache expiration after 5 minutes
            setTimeout(() => {
                global.cachedOpportunities = null;
            }, 5 * 60 * 1000);
        }

        // Ensure we have valid results before processing
        let filteredResults = global.cachedOpportunities ? [...global.cachedOpportunities] : [];
        const totalUnfiltered = filteredResults.length;

        // Apply search filter if search query exists
        if (searchQuery) {
            filteredResults = filteredResults.filter(opp => {
                const searchableText = [
                    opp.title,
                    opp.description,
                    opp.organization?.name,
                    ...(opp.activities?.map(act => act.name) || []),
                    ...(opp.activities?.map(act => act.category) || []),
                    opp.audience?.scope,
                    ...(opp.audience?.regions || [])
                ].filter(Boolean).join(' ').toLowerCase();

                const searchTerms = searchQuery.split(' ').filter(term => term.length > 0);
                return searchTerms.some(term => searchableText.includes(term));
            });
        }

        // Apply filters
        if (req.query.location && req.query.location !== 'all') {
            filteredResults = filteredResults.filter(opp => 
                req.query.location === 'remote' ? opp.remote_or_online : !opp.remote_or_online
            );
        }

        if (req.query.scope && req.query.scope !== 'all') {
            filteredResults = filteredResults.filter(opp => 
                opp.audience?.scope === req.query.scope
            );
        }

        if (req.query.activity && req.query.activity !== 'all') {
            filteredResults = filteredResults.filter(opp => 
                opp.activities?.some(act => 
                    act.name === req.query.activity || act.category === req.query.activity
                )
            );
        }

        // Calculate pagination
        const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
        requestedPage = Math.min(Math.max(1, requestedPage), Math.min(totalPages, MAX_PAGES));
        const startIndex = (requestedPage - 1) * ITEMS_PER_PAGE;
        const paginatedResults = filteredResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        res.json({
            success: true,
            results: paginatedResults,
            pagination: {
                current_page: requestedPage,
                total_pages: totalPages,
                items_per_page: ITEMS_PER_PAGE,
                total_items: filteredResults.length,
                showing_from: startIndex + 1,
                showing_to: startIndex + paginatedResults.length,
                max_pages: MAX_PAGES
            },
            stats: {
                filtered_count: filteredResults.length,
                total_count: totalUnfiltered
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        // If something goes wrong, send back an error response
        res.status(500).json({
            success: false,
            error: error.message,
            pagination: {
                // Default values when there's an error
                current_page: 1,
                total_pages: 1,
                items_per_page: 8,
                total_items: 0,
                showing_from: 0,
                showing_to: 0
            },
            stats: {
                filtered_count: 0,
                total_count: 0
            },
            results: []
        });
    }
});

// Add new endpoint for fetching a specific opportunity by ID
app.get('/api/opportunities/:id', async (req, res) => {
    try {
        // If we have cached opportunities, try to find it there first
        if (global.cachedOpportunities) {
            const opportunity = global.cachedOpportunities.find(opp => opp.id === req.params.id);
            if (opportunity) {
                return res.json({
                    success: true,
                    opportunity
                });
            }
        }

        // If not found in cache, fetch from external API
        const response = await axios.get(`https://www.volunteerconnector.org/api/opportunities/${req.params.id}`);
        
        if (response.data) {
            return res.json({
                success: true,
                opportunity: response.data
            });
        } else {
            return res.status(404).json({
                success: false,
                error: 'Opportunity not found'
            });
        }
    } catch (error) {
        console.error('Error fetching specific opportunity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch opportunity details'
        });
    }
});

// Add utility function for retrying requests
async function retryRequest(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

// Update AI recommendations endpoint
app.post('/api/ai-recommendations', authenticateToken, async (req, res) => {
    try {
        const { userPreferences, filters } = req.body;
        
        if (!userPreferences || userPreferences.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Please provide more detailed preferences (minimum 10 characters)'
            });
        }

        let opportunities = global.cachedOpportunities || [];
        if (!opportunities.length) {
            return res.status(400).json({
                success: false,
                error: 'No opportunities available for analysis'
            });
        }

        // Pre-filter opportunities
        let filteredOpportunities = opportunities.filter(opp => {
            const locationMatch = !filters.locationFilter || filters.locationFilter === 'all' || 
                (filters.locationFilter === 'remote' ? opp.remote_or_online : !opp.remote_or_online);
            const scopeMatch = !filters.scopeFilter || filters.scopeFilter === 'all' || 
                opp.audience?.scope === filters.scopeFilter;
            const activityMatch = !filters.activityFilter || filters.activityFilter === 'all' || 
                opp.activities?.some(act => act.name === filters.activityFilter || act.category === filters.activityFilter);
            
            return locationMatch && scopeMatch && activityMatch;
        });

        // Take top 10 opportunities for analysis
        const opportunitiesToAnalyze = filteredOpportunities.slice(0, 10).map(opp => ({
            id: opp.id,
            title: opp.title,
            description: opp.description?.substring(0, 300) || '',
            activities: opp.activities?.map(a => ({
                name: a.name,
                category: a.category
            })) || [],
            remote_or_online: opp.remote_or_online,
            audience: {
                scope: opp.audience?.scope,
                regions: opp.audience?.regions
            },
            organization: opp.organization?.name,
            dates: opp.dates
        }));

        // Updated prompt with better error handling
        const prompt = {
            contents: [{
                parts: [{
                    text: `As an AI volunteering expert, analyze these opportunities for a potential volunteer.

User Preferences:
${userPreferences}

Available Opportunities:
${JSON.stringify(opportunitiesToAnalyze, null, 2)}

Task: Analyze each opportunity and rate how well it matches the user's preferences.

Required Response Format (use exactly this JSON structure):
{
  "recommendations": [
    {
      "opportunityId": "id",
      "score": 75,
      "skillsMatch": "Specific matching skills found",
      "interestsMatch": "Specific matching interests found",
      "reason": "Clear explanation of why this matches"
    }
  ]
}

Rules:
1. MUST return valid JSON
2. Each opportunity MUST have all fields
3. Score MUST be between 0-100
4. Provide specific, concrete matches
5. Keep explanations brief but informative`
                }]
            }]
        };

        // Call Gemini API with improved error handling
        const geminiResponse = await retryRequest(async () => {
            const response = await axios.post(
                `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
                prompt,
                { 
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000
                }
            );
            return response;
        }, 3, 2000);

        let aiRecommendations;
        try {
            const responseText = geminiResponse.data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response (handle potential markdown formatting)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }

            const cleanedText = jsonMatch[0]
                .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes
                .replace(/\n/g, ' ')              // Remove newlines
                .trim();

            aiRecommendations = JSON.parse(cleanedText);

            // Validate response structure
            if (!aiRecommendations.recommendations || !Array.isArray(aiRecommendations.recommendations)) {
                throw new Error('Invalid response structure: missing recommendations array');
            }

            // Ensure each recommendation has required fields
            aiRecommendations.recommendations = aiRecommendations.recommendations.map(rec => ({
                opportunityId: rec.opportunityId || 'unknown',
                score: Math.min(100, Math.max(0, parseInt(rec.score) || 50)),
                skillsMatch: rec.skillsMatch || 'No specific skills matched',
                interestsMatch: rec.interestsMatch || 'No specific interests matched',
                reason: rec.reason || 'No specific reason provided'
            }));

        } catch (parseError) {
            console.error('AI Response parsing error:', parseError);
            console.error('Raw AI response:', geminiResponse.data.candidates[0].content.parts[0].text);
            
            // Provide default recommendations if parsing fails
            aiRecommendations = {
                recommendations: opportunitiesToAnalyze.map(opp => ({
                    opportunityId: opp.id,
                    score: 50,
                    skillsMatch: "Analysis unavailable",
                    interestsMatch: "Analysis unavailable",
                    reason: "AI analysis failed, showing default recommendation"
                }))
            };
        }

        // Process and return results
        const rankedOpportunities = opportunities.map(opp => {
            const aiData = aiRecommendations.recommendations.find(
                rec => String(rec.opportunityId) === String(opp.id)
            ) || {
                score: 50,
                skillsMatch: "Not analyzed",
                interestsMatch: "Not analyzed",
                reason: "This opportunity was not included in the analysis"
            };

            return {
                ...opp,
                aiScore: aiData.score,
                skillsMatch: aiData.skillsMatch,
                interestsMatch: aiData.interestsMatch,
                aiReason: aiData.reason
            };
        }).sort((a, b) => b.aiScore - a.aiScore);

        res.json({
            success: true,
            results: rankedOpportunities
        });

    } catch (error) {
        console.error('AI recommendation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get AI recommendations',
            details: error.message,
            fallbackResults: opportunities.slice(0, 10)  // Provide some default results
        });
    }
});

// Add this debug endpoint after your other routes
app.post('/api/debug-ai', authenticateToken, async (req, res) => {
    try {
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            req.body,
            { headers: { 'Content-Type': 'application/json' }
        });
        
        res.json({
            rawResponse: response.data.candidates[0].content.parts[0].text,
            cleaned: response.data.candidates[0].content.parts[0].text
                .replace(/```json\s*/, '')
                .replace(/```\s*$/, '')
                .trim()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// Update registration endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        const newUser = new User({ name, email, password });
        await newUser.save();
        
        const token = jwt.sign({ userId: newUser._id }, 'your-secret-key', { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: newUser._id, name, email } });
    } catch (error) {
        res.status(400).json({ message: 'Error registering user', error: error.message });
    }
});

// Add login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, name: user.name, email } });
    } catch (error) {
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
});

// Add profile endpoint
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update track opportunity endpoint
app.post('/api/track-opportunity', authenticateToken, async (req, res) => {
    try {
        const opportunityData = req.body;
        
        if (!opportunityData.opportunityId) {
            return res.status(400).json({ 
                success: false,
                message: 'Opportunity ID is required' 
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for existing opportunity using findIndex
        const existingIndex = user.activities.findIndex(
            activity => activity.opportunityId === opportunityData.opportunityId
        );

        if (existingIndex !== -1) {
            return res.status(409).json({
                success: false,
                message: 'Already tracking this opportunity',
                activities: user.activities
            });
        }

        // Add new opportunity
        user.activities = [...user.activities, opportunityData];

        try {
            await user.save();
            return res.json({
                success: true,
                message: 'Opportunity tracked successfully',
                activities: user.activities
            });
        } catch (saveError) {
            if (saveError.name === 'ValidationError') {
                return res.status(409).json({
                    success: false,
                    message: 'Already tracking this opportunity',
                    activities: user.activities
                });
            }
            throw saveError;
        }

    } catch (error) {
        console.error('Track opportunity error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error tracking opportunity',
            error: error.message
        });
    }
});

// Update the untrack endpoint to be more robust
app.delete('/api/track-opportunity/:opportunityId', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove all instances of the opportunity (in case of duplicates)
        const initialLength = user.activities.length;
        user.activities = user.activities.filter(
            activity => activity.opportunityId !== req.params.opportunityId
        );

        if (user.activities.length === initialLength) {
            return res.status(404).json({ 
                success: false,
                message: 'Opportunity not found in tracked items' 
            });
        }

        await user.save();
        return res.json({
            success: true,
            message: 'Opportunity untracked successfully',
            activities: user.activities
        });
    } catch (error) {
        console.error('Untrack opportunity error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error untracking opportunity',
            error: error.message
        });
    }
});

// Update the forgot password endpoint with better error handling
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate email
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Check if we have email configuration
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Missing email configuration');
            return res.status(500).json({ 
                success: false, 
                message: 'Server email configuration error' 
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'No account found with this email' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Update user with reset token
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetTokenExpiry;
        await user.save();

        // Setup email transporter with error handling
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify transporter
        await transporter.verify();

        // Generate reset URL - use fallback host if needed
        const host = req.get('host') || 'localhost:3000';
        const resetUrl = `${req.protocol}://${host}/reset-password.html?token=${resetToken}`;
        
        // Send email
        await transporter.sendMail({
            from: `"Password Reset" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="
                    background-color: #2e5cb8;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    display: inline-block;
                    margin: 20px 0;
                ">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p style="color: #666; font-size: 0.8em; margin-top: 30px;">
                    This email was sent from Volunteer Multi Hub.
                </p>
            `
        });

        res.json({ 
            success: true, 
            message: 'Password reset email sent successfully' 
        });

    } catch (error) {
        console.error('Password reset error:', error);
        
        // Provide specific error messages based on error type
        let errorMessage = 'Error sending reset email';
        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Email server connection timed out';
        }

        res.status(500).json({ 
            success: false,
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update the reset password endpoint with better validation
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Token and new password are required' 
            });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid or expired reset token' 
            });
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;

        await user.save();

        res.json({ 
            success: true,
            message: 'Password has been reset successfully' 
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to reset password',
            details: error.message 
        });
    }
});

// Update the /api/update-preferences endpoint
app.post('/api/update-preferences', authenticateToken, async (req, res) => {
    try {
        const { skills, interests } = req.body;
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate and format skills
        const formattedSkills = skills.map(skill => {
            if (typeof skill === 'string') {
                // If it's just a string, create a basic skill object
                return { name: skill, level: 'beginner' };
            }
            return skill;
        });

        // Validate and format interests
        const formattedInterests = interests.map(interest => {
            if (typeof interest === 'string') {
                // If it's just a string, create a basic interest object
                return { category: interest, weight: 1 };
            }
            return interest;
        });

        user.skills = formattedSkills;
        user.interests = formattedInterests;
        
        await user.save();

        res.json({
            success: true,
            skills: user.skills,
            interests: user.interests
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences',
            details: error.message
        });
    }
});

// Move the static middleware after API routes
app.use(express.static(path.join(__dirname, '../public')));

// Start our server and show a message
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

});
