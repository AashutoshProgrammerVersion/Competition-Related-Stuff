require('dotenv').config();
const axios = require('axios');
const User = require('./models/User');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Remove the GoogleGenerativeAI import and initialization

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

// Add these new endpoints after your existing routes
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetTokenExpiry;
        await user.save();

        // Update the transporter configuration
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ 
            message: 'Error sending password reset email',
            error: error.message 
        });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ 
                message: 'Token and password are required' 
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            console.log('Reset attempt failed:', { 
                token, 
                now: new Date(),
                userFound: !!user
            });
            return res.status(400).json({ 
                message: 'Password reset token is invalid or has expired' 
            });
        }

        // Update password and clear reset token fields
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
            message: 'Error resetting password', 
            error: error.message 
        });
    }
});

// Move the static middleware after API routes
app.use(express.static(path.join(__dirname, '../public')));

// Start our server and show a message
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

});
