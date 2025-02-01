document.addEventListener('DOMContentLoaded', async () => {
    const detailsContainer = document.getElementById('opportunityDetails');
    let opportunityData = JSON.parse(localStorage.getItem('selectedOpportunity'));
    
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
                <a href="index.html" class="back-button">Back to Opportunities</a>
            </div>
        </div>
    `;
});
