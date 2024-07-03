const clientId = '129566';
const redirectUri = 'https://bananahealth.netlify.app';
const authorizeLink = document.getElementById('authorize-link');
const resultDiv = document.getElementById('result');

authorizeLink.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read,activity:write`;

function getStravaAccessToken(code) {
    return fetch('/.netlify/functions/get-access-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Access token:', data.access_token);
        return data;
    })
    .catch(error => {
        console.error('Error fetching access token:', error);
    });
}

function getActivities(accessToken) {
    return fetch('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log('Activities:', data);
        return data;
    })
    .catch(error => {
        console.error('Error fetching activities:', error);
    });
}

function updateActivityDescription(accessToken, activityId, description) {
    return fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error updating activity description');
        }
        return response.json();
    })
    .then(data => {
        console.log('Activity updated:', data);
    })
    .catch(error => {
        console.error('Error updating activity description:', error);
    });
}

function calculateBananaConsumption(caloriesBurned) {
    const bananaCalories = 105;
    return caloriesBurned / bananaCalories;
}

function handleAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log('Authorization code:', code);
    if (code) {
        getStravaAccessToken(code).then(tokenInfo => {
            const accessToken = tokenInfo.access_token;
            getActivities(accessToken).then(activities => {
                if (activities && activities.length > 0) {
                    const latestActivity = activities[0];
                    const caloriesBurned = latestActivity.calories;
                    const bananasNeeded = calculateBananaConsumption(caloriesBurned);
                    const description = `This run equals to approximately ${bananasNeeded.toFixed(2)} bananas. https://bananahealth.netlify.app/ (i cant afford a domain)`;
                    updateActivityDescription(accessToken, latestActivity.id, description).then(() => {
                        resultDiv.textContent = description;
                    });
                } else {
                    console.error('No activities found');
                }
            });
        });
    }
}

handleAuth();
