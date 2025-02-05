// This line tells the browser to wait until the webpage is fully loaded before running any code
document.addEventListener('DOMContentLoaded', async () => {
    // Get the container element where we'll put the opportunity details
    const detailsContainer = document.getElementById('opportunityDetails');
    
    // Get the opportunity data that was saved when user clicked on an opportunity
    // JSON.parse converts the stored text back into a JavaScript object we can use
    let opportunityData = JSON.parse(localStorage.getItem('selectedOpportunity'));
    
    // Get the logged-in user's information from browser storage
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Get the authentication token needed to make secure requests to the server
    const authToken = localStorage.getItem('token');
    
    // If no opportunity data was found, show an error message
    if (!opportunityData) {
        // Create error message HTML
        detailsContainer.innerHTML = `
            <div class="error">
                <h2>Opportunity Not Found</h2>
                <p>The requested opportunity could not be found.</p>
                <a href="index.html" class="back-button">Return to Opportunities</a>
            </div>
        `;
        return; // Stop executing the rest of the code
    }

    // Function to check if the current user is tracking this opportunity
    function isOpportunityTracked(opportunityId) {
        // Get fresh user data from storage
        const user = JSON.parse(localStorage.getItem('user'));
        // Check if this opportunity ID exists in user's tracked activities
        // The ?. operator safely checks if activities exists before trying to use it
        // some() checks if any activity matches our condition
        return user?.activities?.some(a => String(a.opportunityId) === String(opportunityId));
    }

    // Function to update the tracking button's appearance
    function updateTrackingState() {
        // Check if this opportunity is being tracked
        const isTracked = isOpportunityTracked(opportunityData.id);
        // Find the track button on the page
        const trackButton = document.getElementById('trackButton');
        if (trackButton) {
            // Toggle the 'tracked' class based on tracking status
            trackButton.classList.toggle('tracked', isTracked);
            // Update the button text with either a filled star or empty star
            trackButton.textContent = isTracked ? '★ Tracked' : '☆ Track';
        }
    }

    // Check if user came from their profile page
    const returnToProfile = localStorage.getItem('returnToProfile') === 'true';
    // Set appropriate back button text based on where user came from
    const backButtonText = returnToProfile ? 'Back to Profile' : 'Back to Opportunities';
    // Set the correct URL for the back button
    const backButtonHref = returnToProfile ? 'index.html#profile' : 'index.html#opportunities';

    // Clear the return to profile flag since we don't need it anymore
    localStorage.removeItem('returnToProfile');

    // Create the HTML for the opportunity details page
    detailsContainer.innerHTML = `
        <div class="opportunity-details-content">
            <!-- Display the opportunity title, or 'Untitled Opportunity' if no title exists -->
            <h2>${opportunityData.title || 'Untitled Opportunity'}</h2>
            
            <!-- Organization section - only show if organization data exists -->
            ${opportunityData.organization ? `
                <div class="organization-section">
                    <div class="organization-header">
                        <!-- Show organization logo if it exists -->
                        ${opportunityData.organization.logo ? `
                            <img src="${opportunityData.organization.logo.startsWith('http') ? 
                                opportunityData.organization.logo : 
                                opportunityData.organization.logo.startsWith('//') ? 
                                    `https:${opportunityData.organization.logo}` :
                                    opportunityData.organization.logo}" 
                                alt="${opportunityData.organization.name || 'Organization'} logo" 
                                class="org-logo-large"
                                onerror="this.style.display='none'">
                        ` : ''}
                        <h3>${opportunityData.organization.name || 'Organization'}</h3>
                    </div>
                    <!-- Show organization description if it exists -->
                    ${opportunityData.organization.description ? `
                        <div class="organization-description">
                            <p>${opportunityData.organization.description}</p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <!-- Main details section -->
            <div class="details-section">
                <!-- Opportunity description -->
                <div class="description">
                    ${opportunityData.description || 'No description available'}
                </div>
                
                <!-- Meta information section -->
                <div class="meta-info">
                    <!-- Show dates if they exist -->
                    ${opportunityData.dates ? `
                        <div class="meta-item">
                            <strong>Dates:</strong> ${opportunityData.dates}
                        </div>
                    ` : ''}
                    <!-- Show whether opportunity is remote or in-person -->
                    <div class="meta-item">
                        <strong>Type:</strong> 
                        ${opportunityData.remote_or_online ? 'Remote/Online' : 'In-Person'}
                    </div>
                    <!-- Show audience information if it exists -->
                    ${opportunityData.audience ? `
                        <div class="meta-item">
                            <strong>Audience:</strong>
                            <div class="audience-details">
                                ${opportunityData.audience.scope ? `
                                    <p>Scope: ${opportunityData.audience.scope}</p>
                                ` : ''}
                                ${opportunityData.audience.regions && opportunityData.audience.regions.length ? `
                                    <p>Regions: ${opportunityData.audience.regions.join(', ')}</p>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    <!-- Show activities if they exist -->
                    ${opportunityData.activities && opportunityData.activities.length ? `
                        <div class="meta-item">
                            <strong>Activities:</strong>
                            <ul class="activities-list">
                                ${opportunityData.activities.map(activity => `
                                    <li>
                                        ${activity.name}
                                        ${activity.category ? ` (${activity.category})` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <!-- Show frequency if it exists -->
                    ${opportunityData.frequency ? `
                        <div class="meta-item">
                            <strong>Frequency:</strong> ${opportunityData.frequency}
                        </div>
                    ` : ''}
                    <!-- Show commitment if it exists -->
                    ${opportunityData.commitment ? `
                        <div class="meta-item">
                            <strong>Commitment:</strong> ${opportunityData.commitment}
                        </div>
                    ` : ''}
                    <!-- Show location if it exists -->
                    ${opportunityData.location ? `
                        <div class="meta-item">
                            <strong>Location:</strong> ${opportunityData.location}
                        </div>
                    ` : ''}
                </div>

                <!-- Show requirements section if it exists -->
                ${opportunityData.requirements ? `
                    <div class="requirements-section">
                        <h3>Requirements</h3>
                        <div class="requirements-content">
                            ${opportunityData.requirements}
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Action buttons section -->
            <div class="action-buttons">
                <!-- Show apply button if URL exists -->
                ${opportunityData.url ? `
                    <a href="${opportunityData.url}" target="_blank" class="apply-button">
                        Apply on Volunteer Connector
                    </a>
                ` : ''}
                <!-- Show track button only if user is logged in -->
                ${currentUser ? `
                    <button id="trackButton" class="track-opportunity ${isOpportunityTracked(opportunityData.id) ? 'tracked' : ''}">
                        ${isOpportunityTracked(opportunityData.id) ? '★ Tracked' : '☆ Track'}
                    </button>
                ` : ''}
                <!-- Back button -->
                <a href="${backButtonHref}" class="back-button">${backButtonText}</a>
            </div>
        </div>
    `;

    // Set up track button functionality
    const trackButton = document.getElementById('trackButton');
    if (trackButton) {
        // Add click handler to the track button
        trackButton.addEventListener('click', async () => {
            try {
                // Check if opportunity is currently tracked
                const isTracked = isOpportunityTracked(opportunityData.id);
                
                // Make API request to server to track/untrack opportunity
                const response = await fetch(`http://localhost:3000/api/track-opportunity${isTracked ? `/${opportunityData.id}` : ''}`, {
                    method: isTracked ? 'DELETE' : 'POST', // DELETE to untrack, POST to track
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}` // Include auth token
                    },
                    // Only include body data when tracking (not untracking)
                    body: !isTracked ? JSON.stringify({
                        opportunityId: String(opportunityData.id),
                        title: opportunityData.title,
                        description: opportunityData.description,
                        organization: opportunityData.organization,
                        url: opportunityData.url,
                        remote_or_online: opportunityData.remote_or_online,
                        dates: opportunityData.dates,
                        audience: opportunityData.audience,
                        activities: opportunityData.activities,
                        date: new Date(),
                        status: 'interested'
                    }) : undefined
                });

                // If request was successful
                if (response.ok) {
                    // Get updated user data from response
                    const userData = await response.json();
                    // Update user data in browser storage
                    localStorage.setItem('user', JSON.stringify({
                        ...currentUser,
                        activities: userData.activities
                    }));
                    // Update the track button appearance
                    updateTrackingState();
                }
            } catch (error) {
                // If anything goes wrong, show error message
                console.error('Error updating tracking status:', error);
                alert('Failed to update tracking status. Please try again.');
            }
        });
    }

    // Update the initial state of the track button
    updateTrackingState();
});
