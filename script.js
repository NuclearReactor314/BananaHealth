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
    }).then(response => response.json());
}

function getActivities(accessToken) {
    return fetch('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    }).then(response => response.json());
}

function updateActivityDescription(accessToken, activityId, description) {
    return fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description }),
    });
}

function calculateBananaConsumption(caloriesBurned) {
    const bananaCalories = 105;
    return caloriesBurned / bananaCalories;
}

function handleAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        getStravaAccessToken(code).then(tokenInfo => {
            const accessToken = tokenInfo.access_token;
            getActivities(accessToken).then(activities => {
                const latestActivity = activities[0];
                const caloriesBurned = latestActivity.calories;
                const bananasNeeded = calculateBananaConsumption(caloriesBurned);
                const description = `Great run! To refuel, you'll need approximately ${bananasNeeded.toFixed(2)} bananas. Check out more at: https://bananahealth.netlify.app/`;
                updateActivityDescription(accessToken, latestActivity.id, description).then(() => {
                    resultDiv.textContent = description;
                });
            });
        });
    }
}

handleAuth();
