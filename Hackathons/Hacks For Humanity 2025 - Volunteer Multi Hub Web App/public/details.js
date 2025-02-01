document.addEventListener('DOMContentLoaded', async () => {
    const detailsContainer = document.getElementById('opportunityDetails');
    let opportunityData = JSON.parse(localStorage.getItem('selectedOpportunity'));
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const authToken = localStorage.getItem('token');
    
    if (!opportunityData) {
        detailsContainer.innerHTML = `
            <div class="error">
                <h2>Opportunity Not Found</h2>
                <p>The requested opportunity could not be found.</p>
                <a href="index.html" class="back-button">Return to Opportunities</a>
            </div>
        `;
        return;
    }

    function isOpportunityTracked(opportunityId) {
        const user = JSON.parse(localStorage.getItem('user')); // Get fresh user data
        return user?.activities?.some(a => a.opportunityId === String(opportunityId));
    }

    // Refresh tracking state function
    function updateTrackingState() {
        const isTracked = isOpportunityTracked(opportunityData.id);
        const trackButton = document.getElementById('trackButton');
        if (trackButton) {
            trackButton.classList.toggle('tracked', isTracked);
            trackButton.textContent = isTracked ? '★ Tracked' : '☆ Track';
        }
    }

    // Update the back button logic
    const referrer = document.referrer;
    const cameFromProfile = referrer.includes('#profile');
    const backButtonText = cameFromProfile ? 'Back to Profile' : 'Back to Opportunities';
    const backButtonHref = `index.html${cameFromProfile ? '#profile' : ''}`;

    detailsContainer.innerHTML = `
        <div class="opportunity-details-content">
            <h2>${opportunityData.title || 'Untitled Opportunity'}</h2>
            
            ${opportunityData.organization ? `
                <div class="organization-section">
                    <div class="organization-header">
                        ${opportunityData.organization.logo ? `
                            <img src="${opportunityData.organization.logo}" 
                                alt="${opportunityData.organization.name} logo" 
                                class="org-logo-large">
                        ` : ''}
                        <h3>${opportunityData.organization.name}</h3>
                    </div>
                </div>
            ` : ''}

            <div class="details-section">
                <div class="description">
                    ${opportunityData.description || 'No description available'}
                </div>
                
                <div class="meta-info">
                    ${opportunityData.dates ? `
                        <div class="meta-item">
                            <strong>Dates:</strong> ${opportunityData.dates}
                        </div>
                    ` : ''}
                    <div class="meta-item">
                        <strong>Type:</strong> 
                        ${opportunityData.remote_or_online ? 'Remote/Online' : 'In-Person'}
                    </div>
                </div>
            </div>

            <div class="action-buttons">
                ${opportunityData.url ? `
                    <a href="${opportunityData.url}" target="_blank" class="apply-button">
                        Apply on Volunteer Connector
                    </a>
                ` : ''}
                ${currentUser ? `
                    <button id="trackButton" class="track-opportunity ${isOpportunityTracked(opportunityData.id) ? 'tracked' : ''}">
                        ${isOpportunityTracked(opportunityData.id) ? '★ Tracked' : '☆ Track'}
                    </button>
                ` : ''}
                <a href="${backButtonHref}" class="back-button">${backButtonText}</a>
            </div>
        </div>
    `;

    // Update track button handler
    const trackButton = document.getElementById('trackButton');
    if (trackButton) {
        trackButton.addEventListener('click', async () => {
            try {
                const isTracked = isOpportunityTracked(opportunityData.id);
                const response = await fetch(`http://localhost:3000/api/track-opportunity${isTracked ? `/${opportunityData.id}` : ''}`, {
                    method: isTracked ? 'DELETE' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
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

                if (response.ok) {
                    const userData = await response.json();
                    localStorage.setItem('user', JSON.stringify({
                        ...currentUser,
                        activities: userData.activities
                    }));
                    updateTrackingState();
                }
            } catch (error) {
                console.error('Error updating tracking status:', error);
                alert('Failed to update tracking status. Please try again.');
            }
        });
    }

    // Initial state update
    updateTrackingState();
});
