// Sample volunteer opportunities data
const opportunities = [
    { title: 'Beach Cleanup', date: '2025-02-15' }, // An opportunity with a title and date
    { title: 'Food Bank Volunteering', date: '2025-02-20' }, // Another opportunity
    { title: 'Park Cleanup', date: '2025-02-25' }, // Another opportunity
    { title: 'Animal Shelter Volunteering', date: '2025-03-01' }, // Another opportunity
    { title: 'Youth Mentorship Program', date: '2025-03-05' }, // Another opportunity
];

let nextPageUrl = null; // Variable to store the URL for the next page of opportunities
let prevPageUrl = null; // Variable to store the URL for the previous page of opportunities
let displayedOpportunities = new Set(); // Set to keep track of displayed opportunities
let currentPage = 1;
let totalPages = 1;
let searchTimeout = null;
const SEARCH_DELAY = 300; // Reduced delay for better responsiveness
let lastScrollPosition = 0; // Variable to store the last scroll position

const MAX_PAGES_TO_LOAD = 20; // Maximum number of pages that can be loaded
const ITEMS_PER_PAGE = 8; // Keep consistent items per page
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache duration
let loadedPages = new Set(); // Track which pages have been loaded
let allOpportunities = []; // Store all loaded opportunities

// Add authentication state
let currentUser = JSON.parse(localStorage.getItem('user'));
let authToken = localStorage.getItem('token');

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
                            <button class="track-opportunity" data-id="${opportunity.id}">
                                ${isOpportunityTracked(opportunity.id) ? '★ Tracked' : '☆ Track'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            // Add click handler
            item.addEventListener('click', () => {
                localStorage.setItem('selectedOpportunity', JSON.stringify(opportunity));
                window.location.href = 'opportunity-details.html';
            });

            // Add track button click handler
            const trackButton = item.querySelector('.track-opportunity');
            if (trackButton) {
                trackButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    trackOpportunity(opportunity);
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

// Update the filterLoadedOpportunities function with better null checking
function filterLoadedOpportunities(opportunities) {
    if (!Array.isArray(opportunities)) return [];
    
    const searchQuery = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
    const locationFilter = document.getElementById('locationFilter')?.value || 'all';
    const scopeFilter = document.getElementById('scopeFilter')?.value || 'all';
    const activityFilter = document.getElementById('activityFilter')?.value || 'all';

    return opportunities.filter(opp => {
        if (!opp) return false;

        // Create searchable text from valid properties only
        const searchableProps = [
            opp.title,
            opp.description,
            opp.organization?.name,
            ...(opp.activities?.map(act => act?.name || '') || []),
            ...(opp.activities?.map(act => act?.category || '') || []),
            opp.audience?.scope,
            ...(opp.audience?.regions || [])
        ].filter(Boolean); // Remove null/undefined/empty values

        const searchableText = searchableProps.join(' ').toLowerCase();
        const matchesSearch = !searchQuery || searchableText.includes(searchQuery);
        
        const matchesLocation = locationFilter === 'all' || 
            (locationFilter === 'remote' ? Boolean(opp.remote_or_online) : !opp.remote_or_online);
        
        const matchesScope = scopeFilter === 'all' || 
            opp.audience?.scope === scopeFilter;
        
        const matchesActivity = activityFilter === 'all' || 
            Array.isArray(opp.activities) && opp.activities.some(act => 
                (act?.name === activityFilter || act?.category === activityFilter)
            );

        return matchesSearch && matchesLocation && matchesScope && matchesActivity;
    });
}

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

    function performSearch() {
        const currentScroll = window.scrollY;
        
        // Clear all cached data when performing new search
        loadedPages.clear();
        allOpportunities = [];
        currentPage = 1;
        
        if (searchButton) {
            searchButton.disabled = true;
            searchButton.innerHTML = '<span class="spinner"></span>';
        }
        
        fetchOpportunities(1).finally(() => {
            if (searchButton) {
                searchButton.disabled = false;
                searchButton.textContent = 'Search';
            }
            smoothScrollTo(currentScroll);
        });
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
    return currentUser?.activities?.some(a => a.opportunityId === opportunityId);
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
