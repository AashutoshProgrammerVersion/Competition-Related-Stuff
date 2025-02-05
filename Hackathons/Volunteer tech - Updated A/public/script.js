// Create a test array of volunteer opportunities with sample data
const opportunities = [
    // Each object represents one volunteer opportunity with a title and date
    { title: 'Beach Cleanup', date: '2025-02-15' },    // Example: cleaning a beach on Feb 15, 2025
    { title: 'Food Bank Volunteering', date: '2025-02-20' },  // Example: helping at food bank on Feb 20
    { title: 'Park Cleanup', date: '2025-02-25' },     // Example: cleaning a park on Feb 25
    { title: 'Animal Shelter Volunteering', date: '2025-03-01' },  // Example: helping animals on March 1
    { title: 'Youth Mentorship Program', date: '2025-03-05' },    // Example: mentoring youth on March 5
];

// Variables to manage pagination (showing opportunities in smaller groups)
let nextPageUrl = null;     // Stores the URL for the next page of opportunities
let prevPageUrl = null;     // Stores the URL for the previous page of opportunities
let displayedOpportunities = new Set();    // Keeps track of which opportunities we've already shown
let currentPage = 1;        // The current page number we're showing
let totalPages = 1;         // Total number of pages available

// Variables for search functionality
let searchTimeout = null;   // Used to delay search while user is typing
const SEARCH_DELAY = 300;   // Wait 300 milliseconds after user stops typing before searching
let lastScrollPosition = 0; // Remember where user was on the page

// Constants for controlling data loading
const MAX_PAGES_TO_LOAD = 20;  // Maximum number of pages we'll allow loading
const ITEMS_PER_PAGE = 8;      // Number of opportunities to show per page
const CACHE_DURATION = 30 * 60 * 1000;  // How long to keep data in cache (30 minutes)
let loadedPages = new Set();   // Keep track of which pages we've already loaded
let allOpportunities = [];     // Store all opportunities we've loaded

// User authentication information
let currentUser = JSON.parse(localStorage.getItem('user'));     // Get saved user data
let authToken = localStorage.getItem('token');                  // Get saved authentication token

// State variable for AI-powered features
let aiModeEnabled = false;     // Track whether AI features are turned on

// Function to handle fetch errors
function handleFetchError(error) {
    const list = document.getElementById('opportunityList');
    if (list) {
        list.innerHTML = `
            <div class="error">
                <h3>Error loading opportunities</h3>
                <p>${error.message || 'Please try again later.'}</p>
                <button onclick="fetchOpportunities(currentPage)">Retry</button>
            </div>
        `;
    }
}

// Function to display opportunity items
function displayOpportunityItems(opportunities, container) {
    if (!Array.isArray(opportunities) || opportunities.length === 0) {
        container.innerHTML += '<div class="no-results">No matching opportunities found. Try different filters.</div>';
        return;
    }

    opportunities.filter(opp => opp !== null && opp !== undefined).forEach(opportunity => {
        const item = document.createElement('div');
        item.classList.add('opportunity-item');
        item.style.cursor = 'pointer'; // Add pointer cursor
        
        try {
            // Simplified safe access to essential properties
            const safeOpp = {
                title: opportunity?.title || 'Untitled Opportunity',
                description: opportunity?.description?.substring(0, 150) || 'No description available',
                remote_or_online: opportunity?.remote_or_online || false,
                organization: opportunity?.organization || null,
                dates: opportunity?.dates || '',
            };

            const isTracked = isOpportunityTracked(opportunity.id);
            item.innerHTML = `
                <div class="opportunity-card">
                    ${safeOpp.organization?.logo ? `
                        <div class="card-logo">
                            <img src="${safeOpp.organization.logo.startsWith('http') ? 
                                safeOpp.organization.logo : 
                                `https:${safeOpp.organization.logo}`}" 
                                alt="Organization logo" 
                                class="org-logo-small">
                        </div>
                    ` : ''}
                    <h3 class="card-title">${safeOpp.title}</h3>
                    <p class="card-org">${safeOpp.organization?.name || 'Unknown Organization'}</p>
                    <p class="card-description">${safeOpp.description}${safeOpp.description.length >= 150 ? '...' : ''}</p>
                    <div class="card-meta">
                        <span class="card-type ${safeOpp.remote_or_online ? 'remote' : 'in-person'}">
                            ${safeOpp.remote_or_online ? '🌐 Remote' : '📍 In-Person'}
                        </span>
                        ${safeOpp.dates ? `<span class="card-date">📅 ${safeOpp.dates}</span>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="view-details">View Details →</button>
                        ${currentUser ? `
                            <button class="track-opportunity ${isTracked ? 'tracked' : ''}" data-id="${opportunity.id}">
                                ${isTracked ? '★ Tracked' : '☆ Track'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            // Add AI score section if available and AI mode is enabled
            if (aiModeEnabled && opportunity.aiScore !== undefined) {
                item.querySelector('.card-meta').insertAdjacentHTML('beforeend', `
                    <div class="ai-score">
                        <span class="score-badge">AI Score: ${opportunity.aiScore}%</span>
                        ${opportunity.skillsMatch ? 
                            `<div class="skills-match">Skills: ${opportunity.skillsMatch}</div>` : ''}
                        ${opportunity.interestsMatch ? 
                            `<div class="interests-match">Interests: ${opportunity.interestsMatch}</div>` : ''}
                        <div class="ai-reason">${opportunity.aiReason}</div>
                    </div>
                `);
            }

            // Add click handler
            item.addEventListener('click', () => {
                localStorage.setItem('selectedOpportunity', JSON.stringify(opportunity));
                window.location.href = 'opportunity-details.html';
            });

            // Add track button click handler
            const trackButton = item.querySelector('.track-opportunity');
            if (trackButton) {
                trackButton.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const isCurrentlyTracked = isOpportunityTracked(opportunity.id);
                    try {
                        const response = await fetch(`http://localhost:3000/api/track-opportunity${isCurrentlyTracked ? `/${opportunity.id}` : ''}`, {
                            method: isCurrentlyTracked ? 'DELETE' : 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: !isCurrentlyTracked ? JSON.stringify({
                                opportunityId: String(opportunity.id),
                                title: opportunity.title,
                                description: opportunity.description,
                                organization: opportunity.organization,
                                url: opportunity.url,
                                remote_or_online: opportunity.remote_or_online,
                                dates: opportunity.dates,
                                audience: opportunity.audience,
                                activities: opportunity.activities,
                                date: new Date(),
                                status: 'interested'
                            }) : undefined
                        });

                        if (response.ok) {
                            const userData = await response.json();
                            localStorage.setItem('user', JSON.stringify({
                                ...currentUser,
                                activities: userData.activities
                            }));
                            
                            // Update button state
                            trackButton.classList.toggle('tracked', !isCurrentlyTracked);
                            trackButton.textContent = !isCurrentlyTracked ? '★ Tracked' : '☆ Track';
                            
                            // Update currentUser and UI
                            currentUser = JSON.parse(localStorage.getItem('user'));
                            updateUIForAuth();
                        }
                    } catch (error) {
                        console.error('Error updating tracking status:', error);
                        alert('Failed to update tracking status. Please try again.');
                    }
                });
            }
        } catch (error) {
            console.error('Error displaying opportunity:', error);
            item.innerHTML = '<div class="error">Error displaying this opportunity</div>';
        }
        
        container.appendChild(item);
    });
}

// Add new fetch function to get data from server
async function fetchPageFromServer(page, params) {
    const queryParams = new URLSearchParams({
        ...params,
        page: page.toString(),
        per_page: ITEMS_PER_PAGE.toString()
    });

    const response = await fetch(`http://localhost:3000/api/opportunities?${queryParams.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch opportunities');
    }

    return data;
}

// Update the fetchOpportunities function
async function fetchOpportunities(page = 1) {
    showLoading();
    lastScrollPosition = window.scrollY;

    try {
        const list = document.getElementById('opportunityList');
        if (!list) return;

        // Show loading indicator
        if (!loadedPages.has(page)) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading';
            loadingIndicator.textContent = `Loading page ${page}...`;
            list.appendChild(loadingIndicator);
        }

        // Get current search and filter values
        const searchQuery = document.getElementById('searchInput')?.value.trim() || '';
        const locationFilter = document.getElementById('locationFilter')?.value || 'all';
        const scopeFilter = document.getElementById('scopeFilter')?.value || 'all';
        const activityFilter = document.getElementById('activityFilter')?.value || 'all';

        // Fetch data if page hasn't been loaded
        if (!loadedPages.has(page)) {
            const data = await fetchPageFromServer(page, {
                search: searchQuery,
                location: locationFilter,
                scope: scopeFilter,
                activity: activityFilter
            });

            // Update total pages from server response
            totalPages = Math.max(data.pagination?.total_pages || 1, MAX_PAGES_TO_LOAD);

            // Add new opportunities to collection
            if (Array.isArray(data.results)) {
                // Add new opportunities at the correct index
                const startIndex = (page - 1) * ITEMS_PER_PAGE;
                const newOpportunities = [...allOpportunities];
                data.results.forEach((opp, idx) => {
                    newOpportunities[startIndex + idx] = opp;
                });
                allOpportunities = newOpportunities;
                loadedPages.add(page);
            }
        }

        // Clear and update display
        list.innerHTML = '';
        
        // Apply filters to loaded opportunities
        const filteredOpportunities = filterLoadedOpportunities(allOpportunities);
        
        // Calculate current page's opportunities
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentPageOpportunities = filteredOpportunities.slice(startIndex, endIndex);

        // Update filter status - modified position
        const searchContainer = document.getElementById('searchContainer');
        const existingStatus = document.querySelector('.filter-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const filterStatus = document.createElement('div');
        filterStatus.classList.add('filter-status');
        filterStatus.innerHTML = `
            <p>Showing opportunities ${startIndex + 1} - ${Math.min(endIndex, filteredOpportunities.length)} 
               of ${filteredOpportunities.length} filtered results</p>
            <p>Page ${page} of ${totalPages} (${loadedPages.size} pages loaded)</p>
        `;
        
        // Insert after the filters
        const filters = document.getElementById('filters');
        if (filters) {
            filters.after(filterStatus);
        }

        // Display opportunities
        displayOpportunityItems(currentPageOpportunities, list);
        
        // Smooth scroll to position
        smoothScrollTo(lastScrollPosition);
        
        updatePaginationControls();

    } catch (error) {
        console.error('Failed to fetch opportunities:', error);
        handleFetchError(error);
    } finally {
        hideLoading();
    }
}

// Update the filterLoadedOpportunities function
function filterLoadedOpportunities(opportunities) {
    if (!Array.isArray(opportunities)) return [];
    
    // Filter out null/undefined values and create a copy
    const validOpportunities = opportunities.filter(opp => opp != null);
    
    return applyRegularFilters(validOpportunities);
}

// Add new function for regular filtering
function applyRegularFilters(opportunities) {
    if (!Array.isArray(opportunities)) return [];

    const searchQuery = document.getElementById('searchInput')?.value?.trim().toLowerCase() || '';
    const locationFilter = document.getElementById('locationFilter')?.value || 'all';
    const scopeFilter = document.getElementById('scopeFilter')?.value || 'all';
    const activityFilter = document.getElementById('activityFilter')?.value || 'all';

    return opportunities.filter(opp => {
        // Safely check if opportunity is valid
        if (!opp) return false;

        // Create searchable text with safe property access
        const searchableProps = [
            opp?.title || '',
            opp?.description || '',
            opp?.organization?.name || '',
            ...(Array.isArray(opp?.activities) ? 
                opp.activities
                    .filter(act => act != null)
                    .flatMap(act => [act?.name || '', act?.category || ''])
                : []),
            opp?.audience?.scope || '',
            ...(Array.isArray(opp?.audience?.regions) ? opp.audience.regions : [])
        ].filter(Boolean); // Remove empty strings

        const searchableText = searchableProps.join(' ').toLowerCase();
        
        // Apply filters with safe checks
        const matchesSearch = !searchQuery || searchableText.includes(searchQuery);
        const matchesLocation = locationFilter === 'all' || 
            (locationFilter === 'remote' ? Boolean(opp?.remote_or_online) : !opp?.remote_or_online);
        const matchesScope = scopeFilter === 'all' || 
            opp?.audience?.scope === scopeFilter;
        const matchesActivity = activityFilter === 'all' || 
            (Array.isArray(opp?.activities) && opp.activities.some(act => 
                (act?.name === activityFilter || act?.category === activityFilter)
            ));

        return matchesSearch && matchesLocation && matchesScope && matchesActivity;
    });
}

// Add styles for AI scores
const style = document.createElement('style');
style.textContent = `
    .ai-score {
        margin-top: 10px;
        padding: 8px;
        background: var(--primary-light);
        border-radius: 6px;
    }
    .score-badge {
        display: inline-block;
        padding: 4px 8px;
        background: var(--primary-color);
        color: white;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 500;
    }
    .ai-reason {
        margin-top: 5px;
        font-size: 0.9em;
        color: var(--text-muted);
        font-style: italic;
    }
`;
document.head.appendChild(style);

// Update the updatePaginationControls function
function updatePaginationControls() {
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;
    
    pageNumbers.innerHTML = '';
    
    // Always show current page number and total pages
    const paginationInfo = document.createElement('span');
    paginationInfo.className = 'pagination-info';
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageNumbers.appendChild(paginationInfo);
    
    // Show up to 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Add page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.setAttribute('data-page', i); // Add data attribute for page number
        pageButton.onclick = () => navigateToPage(i); // Use dedicated navigation function
        pageNumbers.appendChild(pageButton);
    }

    // Update navigation buttons
    const firstPage = document.getElementById('firstPage');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const lastPage = document.getElementById('lastPage');

    if (firstPage) {
        firstPage.disabled = currentPage === 1;
        firstPage.onclick = () => navigateToPage(1);
    }
    if (prevPage) {
        prevPage.disabled = currentPage === 1;
        prevPage.onclick = () => navigateToPage(currentPage - 1);
    }
    if (nextPage) {
        nextPage.disabled = currentPage === totalPages;
        nextPage.onclick = () => navigateToPage(currentPage + 1);
    }
    if (lastPage) {
        lastPage.disabled = currentPage === totalPages;
        lastPage.onclick = () => navigateToPage(totalPages);
    }
}

// Add this new navigation function
function navigateToPage(page) {
    if (page === currentPage) return;
    
    const prevPage = currentPage;
    currentPage = page;
    
    // Store current scroll position and add visual feedback
    lastScrollPosition = window.scrollY;
    const list = document.getElementById('opportunityList');
    if (list) list.style.opacity = '0.6';
    
    // Update active states immediately
    const buttons = document.querySelectorAll('#pageNumbers button');
    buttons.forEach(button => {
        const buttonPage = parseInt(button.getAttribute('data-page'));
        button.classList.toggle('active', buttonPage === page);
    });
    
    fetchOpportunities(page)
        .then(() => {
            if (list) list.style.opacity = '1';
            // Smooth scroll to last position or slightly above if it was at the top
            const scrollTarget = lastScrollPosition > 200 ? lastScrollPosition : 0;
            smoothScrollTo(scrollTarget);
        })
        .catch(() => {
            currentPage = prevPage;
            updatePaginationControls();
            if (list) list.style.opacity = '1';
        });
}

// Function to filter opportunities based on selected filters
function filterOpportunities(opportunities) {
    const locationFilter = document.getElementById('locationFilter').value; // Get the selected value of the location filter
    const durationFilter = document.getElementById('durationFilter').value; // Get the selected value of the duration filter

    return opportunities.filter(opportunity => {
        const matchesLocation = locationFilter === 'all' || (locationFilter === 'remote' && opportunity.remote_or_online) || (locationFilter === 'in-person' && !opportunity.remote_or_online);
        const matchesDuration = durationFilter === 'all' || (durationFilter === 'short' && opportunity.duration === '2-4 hours') || (durationFilter === 'long' && opportunity.duration !== '2-4 hours');
        return matchesLocation && matchesDuration;
    });
}

// Add registration handler
async function handleRegistration(event) {
    event.preventDefault();
    const form = event.target;
    const formData = {
        name: form.querySelector('[name="name"]').value,
        email: form.querySelector('[name="email"]').value,
        password: form.querySelector('[name="password"]').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            authToken = data.token;
            updateUIForAuth();
            showSection('opportunities');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

// Update the handleLogin function to fetch profile data after login
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = {
        email: form.querySelector('[name="email"]').value,
        password: form.querySelector('[name="password"]').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            // First get the complete profile data
            const profileResponse = await fetch('http://localhost:3000/api/profile', {
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                // Update currentUser with complete profile data
                currentUser = {
                    ...data.user,
                    activities: profileData.activities || [],
                    createdAt: profileData.createdAt
                };
                // Store updated user data
                localStorage.setItem('user', JSON.stringify(currentUser));
                localStorage.setItem('token', data.token);
                authToken = data.token;
                
                updateUIForAuth();
                showSection('opportunities');
            }
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Update the updateUIForAuth function to include tracking count
function updateUIForAuth() {
    const authButtons = document.getElementById('authButtons');
    const profileSection = document.getElementById('profile');
    
    if (currentUser) {
        // Get activities count from current user data
        const activitiesCount = currentUser.activities?.length || 0;
        
        authButtons.innerHTML = `
            <span>Welcome, ${currentUser.name}</span>
            <a href="#profile" onclick="showSection('profile')">
                My Profile
                <span id="trackingCount" class="tracked-count">${activitiesCount}</span>
            </a>
            <button onclick="handleLogout()">Logout</button>
        `;
    } else {
        authButtons.innerHTML = `
            <button onclick="showSection('login')">Login</button>
            <button onclick="showSection('register')">Register</button>
        `;
    }
    
    if (profileSection) {
        profileSection.style.display = 'none';
    }
}

// Update the handleLogout function
function handleLogout() {
    // Clear all user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    authToken = null;
    
    // Reset tracking count
    const trackingCount = document.getElementById('trackingCount');
    if (trackingCount) {
        trackingCount.textContent = '0';
    }
    
    updateUIForAuth();
    showSection('opportunities');
    fetchOpportunities(1);
}

// Simplify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Auth form listeners
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Filter listeners
    const filters = ['locationFilter', 'scopeFilter', 'activityFilter', 'durationFilter'];
    
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', () => {
                currentPage = 1;
                displayedOpportunities.clear(); // Clear the set when filters change
                fetchOpportunities(1);
            });
        }
    });

    // Pagination button listeners
    const firstPage = document.getElementById('firstPage');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const lastPage = document.getElementById('lastPage');

    // Remove old event listeners and use the navigateToPage function
    if (firstPage) {
        firstPage.onclick = () => navigateToPage(1);
    }
    if (prevPage) {
        prevPage.onclick = () => navigateToPage(Math.max(1, currentPage - 1));
    }
    if (nextPage) {
        nextPage.onclick = () => navigateToPage(Math.min(totalPages, currentPage + 1));
    }
    if (lastPage) {
        lastPage.onclick = () => navigateToPage(totalPages);
    }

    // Simplified search functionality
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    async function performSearch() {
        const currentScroll = window.scrollY;
        const list = document.getElementById('opportunityList');
        const searchButton = document.getElementById('searchButton');
        
        if (searchButton) {
            searchButton.disabled = true;
            searchButton.innerHTML = '<span class="spinner"></span>';
        }
        
        try {
            // Clear existing cache
            loadedPages.clear();
            allOpportunities = [];
            
            // Fetch first page of opportunities
            await fetchOpportunities(1);
        } catch (error) {
            console.error('Search error:', error);
            handleFetchError(error);
        } finally {
            if (searchButton) {
                searchButton.disabled = false;
                searchButton.textContent = 'Search';
            }
            if (list) {
                list.classList.remove('ai-processing');
            }
            smoothScrollTo(currentScroll);
        }
    }

    // Add event listeners for search
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    if (searchInput) {
        // Handle Enter key press
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });

        // Optional: Add debounced search for typing
        searchInput.addEventListener('input', () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            searchTimeout = setTimeout(performSearch, SEARCH_DELAY);
        });
    }

    // Initialize the page and fetch user data if logged in
    if (currentUser && authToken) {
        fetchUserProfile();
    }
    showSection('opportunities');
    updateUIForAuth();
    
    // If user is logged in and there's a stored hash for profile, load profile data
    if (currentUser && window.location.hash === '#profile') {
        fetchUserProfile();
    }

    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handlePasswordReset);
    }

    // Check for reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
        document.getElementById('resetToken').value = resetToken;
        showSection('reset-password');
    }

    addAIToggle();
});

// Remove old navigation listeners and simplify showSection
// Update the showSection function to handle home navigation better
function showSection(sectionId) {
    // If clicking home, always show opportunities
    if (sectionId === 'home' || sectionId === 'opportunities') {
        sectionId = 'opportunities';
        // Refresh opportunities list when returning home
        fetchOpportunities(1);
    }

    // If showing profile, fetch latest data and ensure user is logged in
    if (sectionId === 'profile') {
        if (!currentUser) {
            showSection('login');
            return;
        }
        fetchUserProfile();
        initializeSkillsInterests(); // Initialize skills and interests form
    }

    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });
    
    // Ensure opportunities are visible when appropriate
    if (!currentUser && sectionId !== 'login' && sectionId !== 'register') {
        document.getElementById('opportunities').style.display = 'block';
    }

    // Update URL hash without scrolling
    history.pushState(null, null, `#${sectionId}`);
}

// Add hash change listener to handle browser navigation
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'opportunities';
    showSection(hash);
});

// Function to display opportunities on the page
function displayOpportunities() {
    const list = document.getElementById('opportunityList'); // Gets the element with the ID 'opportunityList'
    opportunities.forEach(opportunity => { // Iterates over each opportunity in the sample data
        const item = document.createElement('div'); // Creates a new div element for each opportunity
        item.textContent = `${opportunity.title} on ${opportunity.date}`; // Sets the text content of the div to the opportunity's title and date
        list.appendChild(item); // Adds the div to the opportunity list element
    });
}

// Add this new function for smooth scrolling
function smoothScrollTo(y, duration = 300) {
    const startY = window.scrollY;
    const difference = y - startY;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        window.scrollTo(0, startY + difference * easeInOutQuad(progress));

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// Update the trackOpportunity function to refresh UI
async function trackOpportunity(opportunity, status = 'interested') {
    if (!currentUser) {
        showSection('login');
        return;
    }

    // Check if already tracked
    if (isOpportunityTracked(opportunity.id)) {
        alert('You are already tracking this opportunity');
        return;
    }

    // Prepare the complete opportunity data
    const opportunityData = {
        opportunityId: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        organization: {
            name: opportunity.organization?.name,
            logo: opportunity.organization?.logo,
            description: opportunity.organization?.description
        },
        url: `https://www.volunteerconnector.org/opportunity/${opportunity.id}`,
        remote_or_online: opportunity.remote_or_online,
        dates: opportunity.dates,
        audience: opportunity.audience,
        activities: opportunity.activities,
        date: new Date(),
        status: status
    };

    try {
        const response = await fetch('http://localhost:3000/api/track-opportunity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(opportunityData)
        });

        const data = await response.json();
        if (response.ok) {
            updateTrackedOpportunities(data.activities);
            updateUserInfo({ ...currentUser, activities: data.activities });
            alert('Opportunity tracked successfully!');
        } else {
            if (response.status === 409) {
                alert('You are already tracking this opportunity');
            } else {
                alert(data.message || 'Failed to track opportunity');
            }
        }
    } catch (error) {
        console.error('Error tracking opportunity:', error);
        alert('Failed to track opportunity. Please try again.');
    }
}

// Add function to check if opportunity is tracked
function isOpportunityTracked(opportunityId) {
    const user = JSON.parse(localStorage.getItem('user')); // Get fresh user data
    return user?.activities?.some(a => String(a.opportunityId) === String(opportunityId));
}

// Update the updateTrackedOpportunities function (remove the duplicate one)
function updateTrackedOpportunities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;

    activitiesList.innerHTML = activities.length ? activities.map(activity => `
        <div class="tracked-opportunity" onclick="viewTrackedOpportunity('${activity.opportunityId}', '${JSON.stringify(activity).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
            <div class="opportunity-content">
                <h4>${activity.title}</h4>
                <p class="organization">${activity.organization?.name || 'Unknown Organization'}</p>
                <p class="description">${activity.description?.substring(0, 150)}${activity.description?.length > 150 ? '...' : ''}</p>
                <div class="meta">
                    <span class="type ${activity.remote_or_online ? 'remote' : 'in-person'}">
                        ${activity.remote_or_online ? '🌐 Remote' : '📍 In-Person'}
                    </span>
                    ${activity.dates ? `<span class="date">📅 ${activity.dates}</span>` : ''}
                </div>
            </div>
            <button onclick="event.stopPropagation(); untrackOpportunity('${activity.opportunityId}')">
                Untrack
            </button>
        </div>
    `).join('') : '<p>No tracked opportunities yet</p>';
}

// Add new function to handle viewing tracked opportunities
async function viewTrackedOpportunity(opportunityId, fallbackData) {
    try {
        // First try to fetch from server
        const response = await fetch(`http://localhost:3000/api/opportunities/${opportunityId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        let opportunityData;
        
        if (response.ok) {
            const data = await response.json();
            opportunityData = data.opportunity;
        } else {
            // If server fetch fails, use the fallback data
            const parsedFallback = JSON.parse(fallbackData);
            // Create a complete opportunity object using all available data
            opportunityData = {
                id: opportunityId,
                title: parsedFallback.title,
                description: parsedFallback.description,
                organization: parsedFallback.organization,
                url: parsedFallback.url,
                remote_or_online: parsedFallback.remote_or_online,
                dates: parsedFallback.dates,
                audience: parsedFallback.audience,
                activities: parsedFallback.activities,
                requirements: parsedFallback.requirements,
                frequency: parsedFallback.frequency,
                commitment: parsedFallback.commitment,
                location: parsedFallback.location
            };
        }

        // Store the opportunity data
        localStorage.setItem('selectedOpportunity', JSON.stringify(opportunityData));
        localStorage.setItem('returnToProfile', 'true');
        window.location.href = 'opportunity-details.html';

    } catch (error) {
        console.error('Error viewing opportunity:', error);
        alert('Error loading opportunity details. Please try again.');
    }
}

// Add function to update tracked opportunities display
function updateTrackedOpportunities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;

    activitiesList.innerHTML = activities.length ? activities.map(activity => `
        <div class="tracked-opportunity" style="cursor: pointer;">
            <div class="opportunity-content" onclick="viewOpportunityDetails('${activity.opportunityId}')">
                <h4>${activity.title}</h4>
                <p>Status: ${activity.status}</p>
                <p>Date: ${new Date(activity.date).toLocaleDateString()}</p>
            </div>
            <button onclick="event.stopPropagation(); untrackOpportunity('${activity.opportunityId}')">
                Untrack
            </button>
        </div>
    `).join('') : '<p>No tracked opportunities yet</p>';
}

// Add new function to handle viewing opportunity details
async function viewOpportunityDetails(opportunityId) {
    try {
        // First try to find in already loaded opportunities
        let opportunity = allOpportunities.find(opp => opp.id === opportunityId);
        
        if (!opportunity) {
            // If not found, make a direct API call with the ID
            const response = await fetch(`http://localhost:3000/api/opportunities`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch opportunity details');
            }

            const data = await response.json();
            // Look for the opportunity in the returned results
            opportunity = data.results?.find(opp => opp.id === opportunityId);
        }

        if (opportunity) {
            // Store the opportunity details and redirect
            localStorage.setItem('selectedOpportunity', JSON.stringify(opportunity));
            window.location.href = 'opportunity-details.html';
        } else {
            // If still not found, try fetching from tracked activities
            const trackedActivity = currentUser?.activities?.find(a => a.opportunityId === opportunityId);
            if (trackedActivity) {
                // Create a basic opportunity object from tracked data
                const basicOpportunity = {
                    id: trackedActivity.opportunityId,
                    title: trackedActivity.title,
                    date: trackedActivity.date,
                    // Add any other available fields from trackedActivity
                };
                localStorage.setItem('selectedOpportunity', JSON.stringify(basicOpportunity));
                window.location.href = 'opportunity-details.html';
            } else {
                alert('Could not find the opportunity details. It may have expired or been removed.');
            }
        }
    } catch (error) {
        console.error('Error fetching opportunity details:', error);
        alert('Error loading opportunity details. Please try again later.');
    }
}

// Update the untrackOpportunity function to refresh UI
async function untrackOpportunity(opportunityId) {
    try {
        const response = await fetch(`http://localhost:3000/api/track-opportunity/${opportunityId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateTrackedOpportunities(data.activities);
            updateUserInfo({ ...currentUser, activities: data.activities });
            alert('Opportunity untracked successfully!');
        }
    } catch (error) {
        console.error('Error untracking opportunity:', error);
        alert('Failed to untrack opportunity. Please try again.');
    }
}

// Add function to fetch user profile and activities
async function fetchUserProfile() {
    if (!currentUser || !authToken) return;

    try {
        const response = await fetch('http://localhost:3000/api/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            // Update the activities display
            updateTrackedOpportunities(userData.activities || []);
            // Update user info display
            updateUserInfo(userData);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Update function to update user info display
function updateUserInfo(userData) {
    // Update the currentUser object with new data
    if (userData) {
        currentUser = {
            ...currentUser,
            ...userData
        };
        localStorage.setItem('user', JSON.stringify(currentUser));
    }

    const userInfo = document.getElementById('userInfo');
    const trackingCount = document.getElementById('trackingCount');
    const activitiesCount = currentUser?.activities?.length || 0;
    
    // Update tracking count in navigation
    if (trackingCount) {
        trackingCount.textContent = activitiesCount;
    }
    
    // Only update profile info if we're on the profile page
    if (userInfo && window.location.hash === '#profile') {
        // Format date safely
        let memberSinceDisplay = 'Not available';
        if (currentUser?.createdAt) {
            try {
                const date = new Date(currentUser.createdAt);
                if (!isNaN(date.getTime())) {
                    memberSinceDisplay = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            } catch (e) {
                console.error('Error formatting date:', e);
            }
        }

        userInfo.innerHTML = `
            <h2>Profile Information</h2>
            <div class="profile-details">
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Tracked Opportunities:</strong> ${activitiesCount}</p>
                <p><strong>Member Since:</strong> ${memberSinceDisplay}</p>
            </div>
        `;
    }
}

function showLoading() {
    const skeleton = document.getElementById('loadingSkeleton');
    const list = document.getElementById('opportunityList');
    if (skeleton && list) {
        skeleton.style.display = 'grid';
        list.style.opacity = '0';
    }
}

function hideLoading() {
    const skeleton = document.getElementById('loadingSkeleton');
    const list = document.getElementById('opportunityList');
    if (skeleton && list) {
        skeleton.style.display = 'none';
        list.style.opacity = '1';
    }
}

// Add these new functions after your existing functions

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = event.target.querySelector('[name="email"]').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Password reset email has been sent. Please check your inbox.');
            showSection('login');
        } else {
            alert(data.message || 'Error sending reset email');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send reset email. Please try again.');
    }
}

async function handlePasswordReset(event) {
    event.preventDefault();
    const password = event.target.querySelector('[name="password"]').value;
    const confirmPassword = event.target.querySelector('[name="confirmPassword"]').value;
    const token = event.target.querySelector('[name="token"]').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Password has been reset successfully');
            showSection('login');
        } else {
            alert(data.message || 'Error resetting password');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to reset password. Please try again.');
    }
}

// Replace the addAIToggle function with this improved version
function addAIToggle() {
    const aiToggle = document.getElementById('aiToggle');
    const aiPreferences = document.getElementById('aiPreferences');
    const aiTextArea = document.getElementById('aiTextArea');
    
    if (!aiToggle || !aiPreferences || !aiTextArea) return;

    // Load saved state and preferences
    const savedState = localStorage.getItem('aiModeEnabled') === 'true';
    const savedPreferences = localStorage.getItem('aiPreferences');
    
    // Initialize state
    aiModeEnabled = savedState && currentUser;
    aiToggle.checked = aiModeEnabled;
    aiPreferences.classList.toggle('visible', aiModeEnabled);
    
    if (savedPreferences && aiModeEnabled) {
        aiTextArea.value = savedPreferences;
    }

    // Toggle handler
    aiToggle.addEventListener('change', (e) => {
        if (!currentUser) {
            e.preventDefault();
            aiToggle.checked = false;
            alert('Please login to use AI recommendations');
            return;
        }

        aiModeEnabled = e.target.checked;
        localStorage.setItem('aiModeEnabled', aiModeEnabled);
        aiPreferences.classList.toggle('visible', aiModeEnabled);

        if (!aiModeEnabled) {
            // Revert to normal search
            fetchOpportunities(1);
        }
    });

    // Debounced input handler for recommendations
    let timeout;
    aiTextArea.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const preferences = aiTextArea.value;
            if (preferences.length > 10) {
                localStorage.setItem('aiPreferences', preferences);
                if (aiModeEnabled) {
                    getAIRecommendations();
                }
            }
        }, 1000);
    });

    // Handle Enter key (but allow multiline with Shift+Enter)
    aiTextArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (aiTextArea.value.length > 10) {
                getAIRecommendations();
            }
        }
    });
}

// Update getAIRecommendations function to show better feedback
async function getAIRecommendations() {
    const list = document.getElementById('opportunityList');
    const preferencesText = document.querySelector('#aiTextArea')?.value;
    
    if (!list || !preferencesText || !currentUser) {
        alert('Please enter your preferences and ensure you are logged in.');
        return;
    }

    try {
        showLoading();
        list.classList.add('ai-processing');

        const response = await fetch('http://localhost:3000/api/ai-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                userPreferences: preferencesText,
                filters: {
                    locationFilter: document.getElementById('locationFilter')?.value || 'all',
                    scopeFilter: document.getElementById('scopeFilter')?.value || 'all',
                    activityFilter: document.getElementById('activityFilter')?.value || 'all'
                }
            })
        });

        if (!response.ok) {
            throw new Error(`AI recommendations failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success || !data.results) {
            throw new Error('Invalid response format from AI service');
        }

        // Clear and display results
        list.innerHTML = '';
        displayOpportunityItems(data.results, list);

    } catch (error) {
        console.error('AI recommendation error:', error);
        alert('Could not get AI recommendations. Please try again or use regular search.');
        const aiToggle = document.getElementById('aiToggle');
        if (aiToggle) {
            aiToggle.checked = false;
            aiModeEnabled = false;
            localStorage.setItem('aiModeEnabled', 'false');
        }
        await fetchOpportunities(1);
    } finally {
        hideLoading();
        if (list) {
            list.classList.remove('ai-processing');
        }
    }
}

// Add function to handle skills and interests form
function initializeSkillsInterests() {
    const form = document.getElementById('skillsInterestsForm');
    if (!form) return;

    // Load saved preferences
    const skillsInput = document.getElementById('userSkills');
    const interestsInput = document.getElementById('userInterests');
    
    if (currentUser.skills) {
        skillsInput.value = currentUser.skills.join(', ');
    }
    if (currentUser.interests) {
        interestsInput.value = currentUser.interests.join(', ');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const skills = skillsInput.value.split(',').map(s => s.trim()).filter(Boolean);
        const interests = interestsInput.value.split(',').map(i => i.trim()).filter(Boolean);
        
        try {
            const response = await fetch('http://localhost:3000/api/update-preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ skills, interests })
            });

            if (response.ok) {
                const data = await response.json();
                currentUser = { ...currentUser, ...data };
                localStorage.setItem('user', JSON.stringify(currentUser));
                alert('Preferences updated successfully!');
            } else {
                throw new Error('Failed to update preferences');
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            alert('Failed to update preferences. Please try again.');
        }
    });
}

// ...existing code...

// Update the viewTrackedOpportunity function
async function viewTrackedOpportunity(opportunityId, fallbackDataStr) {
    try {
        let opportunityData = null;
        
        // First try to fetch fresh data from server
        const response = await fetch(`http://localhost:3000/api/opportunities/${opportunityId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            opportunityData = data.opportunity;
        }

        // If server fetch fails or returns no data, use the fallback data
        if (!opportunityData) {
            const fallbackData = JSON.parse(fallbackDataStr.replace(/&quot;/g, '"'));
            opportunityData = {
                id: opportunityId,
                title: fallbackData.title,
                description: fallbackData.description,
                organization: fallbackData.organization,
                url: fallbackData.url || `https://www.volunteerconnector.org/opportunity/${opportunityId}`,
                remote_or_online: fallbackData.remote_or_online,
                dates: fallbackData.dates,
                audience: fallbackData.audience,
                activities: fallbackData.activities,
                requirements: fallbackData.requirements,
                frequency: fallbackData.frequency,
                commitment: fallbackData.commitment,
                location: fallbackData.location,
                // Add any missing required fields
                aiScore: fallbackData.aiScore,
                skillsMatch: fallbackData.skillsMatch,
                interestsMatch: fallbackData.interestsMatch,
                aiReason: fallbackData.aiReason
            };
        }

        // Store the opportunity data
        localStorage.setItem('selectedOpportunity', JSON.stringify(opportunityData));
        localStorage.setItem('returnToProfile', 'true');
        
        // Navigate to details page
        window.location.href = 'opportunity-details.html';

    } catch (error) {
        console.error('Error viewing opportunity:', error);
        alert('Error loading opportunity details. Please try again.');
    }
}

// Update the updateTrackedOpportunities function to pass complete data
function updateTrackedOpportunities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;

    activitiesList.innerHTML = activities.length ? activities.map(activity => {
        // Prepare complete activity data that matches the main opportunities format
        const completeActivity = {
            id: activity.opportunityId,
            title: activity.title,
            description: activity.description,
            organization: activity.organization,
            url: activity.url,
            remote_or_online: activity.remote_or_online,
            dates: activity.dates,
            audience: activity.audience,
            activities: activity.activities,
            requirements: activity.requirements,
            frequency: activity.frequency,
            commitment: activity.commitment,
            location: activity.location
        };
        
        // Convert to safe string format for passing through HTML
        const safeActivityData = JSON.stringify(completeActivity)
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;');

        return `
            <div class="tracked-opportunity" onclick="viewTrackedOpportunity('${activity.opportunityId}', '${safeActivityData}')">
                <div class="opportunity-content">
                    <h4>${activity.title}</h4>
                    <p class="organization">${activity.organization?.name || 'Unknown Organization'}</p>
                    <p class="description">${activity.description?.substring(0, 150)}${activity.description?.length > 150 ? '...' : ''}</p>
                    <div class="meta">
                        <span class="type ${activity.remote_or_online ? 'remote' : 'in-person'}">
                            ${activity.remote_or_online ? '🌐 Remote' : '📍 In-Person'}
                        </span>
                        ${activity.dates ? `<span class="date">📅 ${activity.dates}</span>` : ''}
                    </div>
                </div>
                <button onclick="event.stopPropagation(); untrackOpportunity('${activity.opportunityId}')">
                    Untrack
                </button>
            </div>
        `;
    }).join('') : '<p>No tracked opportunities yet</p>';
}

// ...existing code...

// Add this helper function for JSON sanitization
function sanitizeJsonString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
}

// Update the updateTrackedOpportunities function
function updateTrackedOpportunities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;

    activitiesList.innerHTML = activities.length ? activities.map(activity => {
        // Sanitize all text fields
        const sanitizedActivity = {
            ...activity,
            title: sanitizeJsonString(activity.title),
            description: sanitizeJsonString(activity.description),
            organization: activity.organization ? {
                ...activity.organization,
                name: sanitizeJsonString(activity.organization.name),
                description: sanitizeJsonString(activity.organization.description)
            } : null
        };

        // Create safe stringified version of the activity
        const safeActivityData = JSON.stringify(sanitizedActivity)
            .replace(/'/g, "&apos;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

        return `
            <div class="tracked-opportunity" onclick="viewTrackedOpportunity('${activity.opportunityId}', '${safeActivityData}')">
                <div class="opportunity-content">
                    <h4>${sanitizedActivity.title}</h4>
                    <p class="organization">${sanitizedActivity.organization?.name || 'Unknown Organization'}</p>
                    <p class="description">${sanitizedActivity.description?.substring(0, 150) || ''}${sanitizedActivity.description?.length > 150 ? '...' : ''}</p>
                    <div class="meta">
                        <span class="type ${activity.remote_or_online ? 'remote' : 'in-person'}">
                            ${activity.remote_or_online ? '🌐 Remote' : '📍 In-Person'}
                        </span>
                        ${activity.dates ? `<span class="date">📅 ${sanitizeJsonString(activity.dates)}</span>` : ''}
                    </div>
                </div>
                <button onclick="event.stopPropagation(); untrackOpportunity('${activity.opportunityId}')">
                    Untrack
                </button>
            </div>
        `;
    }).join('') : '<p>No tracked opportunities yet</p>';
}

// Update the viewTrackedOpportunity function
async function viewTrackedOpportunity(opportunityId, fallbackDataStr) {
    try {
        let opportunityData = null;
        
        // First try to fetch fresh data from server
        try {
            const response = await fetch(`http://localhost:3000/api/opportunities/${opportunityId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                opportunityData = data.opportunity;
            }
        } catch (fetchError) {
            console.log('Failed to fetch from server, using fallback data');
        }

        // If server fetch fails, safely parse the fallback data
        if (!opportunityData) {
            try {
                // Decode HTML entities and parse JSON
                const decodedStr = fallbackDataStr
                    .replace(/&quot;/g, '"')
                    .replace(/&apos;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                
                const fallbackData = JSON.parse(decodedStr);
                
                opportunityData = {
                    id: opportunityId,
                    title: sanitizeJsonString(fallbackData.title),
                    description: sanitizeJsonString(fallbackData.description),
                    organization: fallbackData.organization ? {
                        name: sanitizeJsonString(fallbackData.organization.name),
                        logo: fallbackData.organization.logo,
                        description: sanitizeJsonString(fallbackData.organization.description)
                    } : null,
                    url: fallbackData.url || `https://www.volunteerconnector.org/opportunity/${opportunityId}`,
                    remote_or_online: Boolean(fallbackData.remote_or_online),
                    dates: sanitizeJsonString(fallbackData.dates),
                    audience: fallbackData.audience,
                    activities: fallbackData.activities,
                    requirements: sanitizeJsonString(fallbackData.requirements),
                    frequency: sanitizeJsonString(fallbackData.frequency),
                    commitment: sanitizeJsonString(fallbackData.commitment),
                    location: sanitizeJsonString(fallbackData.location)
                };
            } catch (parseError) {
                console.error('Error parsing fallback data:', parseError);
                throw new Error('Could not load opportunity details');
            }
        }

        // Store the sanitized opportunity data
        localStorage.setItem('selectedOpportunity', JSON.stringify(opportunityData));
        localStorage.setItem('returnToProfile', 'true');
        
        // Navigate to details page
        window.location.href = 'opportunity-details.html';

    } catch (error) {
        console.error('Error viewing opportunity:', error);
        alert('Error loading opportunity details. Please try again.');
    }
}

// ...existing code...

// Update the updateTrackedOpportunities function
function updateTrackedOpportunities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;

    activitiesList.innerHTML = activities.length ? activities.map(activity => {
        // Sanitize the activity data
        const safeActivity = {
            opportunityId: activity.opportunityId,
            title: sanitizeJsonString(activity.title),
            description: sanitizeJsonString(activity.description),
            organization: activity.organization ? {
                name: sanitizeJsonString(activity.organization.name),
                logo: activity.organization.logo,
                description: sanitizeJsonString(activity.organization.description)
            } : null,
            url: activity.url,
            remote_or_online: activity.remote_or_online,
            dates: sanitizeJsonString(activity.dates),
            audience: activity.audience,
            activities: activity.activities,
            requirements: sanitizeJsonString(activity.requirements),
            frequency: sanitizeJsonString(activity.frequency),
            commitment: sanitizeJsonString(activity.commitment),
            location: sanitizeJsonString(activity.location)
        };

        // Encode the data for HTML attribute
        const encodedData = encodeURIComponent(JSON.stringify(safeActivity));

        return `
            <div class="tracked-opportunity">
                <div class="opportunity-content" onclick="viewTrackedOpportunity('${activity.opportunityId}', '${encodedData}')">
                    <h4>${safeActivity.title}</h4>
                    <p class="organization">${safeActivity.organization?.name || 'Unknown Organization'}</p>
                    <p class="description">${safeActivity.description?.substring(0, 150)}${safeActivity.description?.length > 150 ? '...' : ''}</p>
                    <div class="meta">
                        <span class="type ${activity.remote_or_online ? 'remote' : 'in-person'}">
                            ${activity.remote_or_online ? '🌐 Remote' : '📍 In-Person'}
                        </span>
                        ${activity.dates ? `<span class="date">📅 ${safeActivity.dates}</span>` : ''}
                    </div>
                </div>
                <button onclick="event.stopPropagation(); untrackOpportunity('${activity.opportunityId}')">
                    Untrack
                </button>
            </div>
        `;
    }).join('') : '<p>No tracked opportunities yet</p>';
}

// Update the viewTrackedOpportunity function
async function viewTrackedOpportunity(opportunityId, encodedData) {
    try {
        let opportunityData = null;
        
        // First try to fetch from server
        try {
            const response = await fetch(`http://localhost:3000/api/opportunities/${opportunityId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            
            if (data.success && data.opportunity) {
                opportunityData = data.opportunity;
            }
        } catch (fetchError) {
            console.log('Server fetch failed, using fallback data');
        }

        // If server fetch fails, use the fallback data
        if (!opportunityData) {
            try {
                const decodedStr = decodeURIComponent(encodedData);
                const fallbackData = JSON.parse(decodedStr);
                
                opportunityData = {
                    id: opportunityId,
                    ...fallbackData
                };
            } catch (parseError) {
                console.error('Error parsing fallback data:', parseError);
                throw new Error('Could not load opportunity details');
            }
        }

        // Store the opportunity data
        localStorage.setItem('selectedOpportunity', JSON.stringify(opportunityData));
        localStorage.setItem('returnToProfile', 'true');
        window.location.href = 'opportunity-details.html';

    } catch (error) {
        console.error('Error viewing opportunity:', error);
        alert('Error loading opportunity details. Please try again.');
    }
}

// ...existing code...
