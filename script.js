const clientId = '129566';
const redirectUri = 'https://bananahealth.netlify.app';
const authorizeLink = document.getElementById('authorize-link');
const resultDiv = document.getElementById('result');

authorizeLink.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all,activity:write`;

function getStravaAccessToken(code) {
    return fetch('/.netlify/functions/get-access-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    }).then(response => response.json());
}

function getActivities(accessToken, afterTimestamp = 0) {
    return fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}`, {
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

function displayBananaConsumption(accessToken) {
    const oneDay = 86400; // seconds in a day
    const oneWeek = oneDay * 7;
    const oneYear = oneDay * 365;

    const currentTime = Math.floor(Date.now() / 1000);

    const afterOneDay = currentTime - oneDay;
    const afterOneWeek = currentTime - oneWeek;
    const afterOneYear = currentTime - oneYear;

    Promise.all([
        getActivities(accessToken, afterOneDay),
        getActivities(accessToken, afterOneWeek),
        getActivities(accessToken, afterOneYear),
        getActivities(accessToken, 0) // Get the latest activity
    ]).then(([dayActivities, weekActivities, yearActivities, allActivities]) => {
        const dayCalories = dayActivities.reduce((acc, activity) => acc + activity.calories, 0);
        const weekCalories = weekActivities.reduce((acc, activity) => acc + activity.calories, 0);
        const yearCalories = yearActivities.reduce((acc, activity) => acc + activity.calories, 0);

        const dayBananas = calculateBananaConsumption(dayCalories);
        const weekBananas = calculateBananaConsumption(weekCalories);
        const yearBananas = calculateBananaConsumption(yearCalories);

        resultDiv.innerHTML = `
            <p>Last Day: ${dayBananas.toFixed(2)} bananas</p>
            <p>Last Week: ${weekBananas.toFixed(2)} bananas</p>
            <p>Last Year: ${yearBananas.toFixed(2)} bananas</p>
        `;

        if (allActivities.length > 0) {
            const latestActivity = allActivities[0];
            const latestActivityBananas = calculateBananaConsumption(latestActivity.calories);
            const description = `This run equals to approximately ${latestActivityBananas.toFixed(2)} bananas. https://bananahealth.netlify.app/ (I can't afford a domain)`;
            updateActivityDescription(accessToken, latestActivity.id, description).then(() => {
                console.log('Activity description updated successfully.');
            }).catch(error => {
                console.error('Error updating activity description:', error);
            });
        }
    }).catch(error => {
        console.error('Error getting activities:', error);
    });
}

function handleAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        getStravaAccessToken(code).then(tokenInfo => {
            const accessToken = tokenInfo.access_token;
            displayBananaConsumption(accessToken);
        }).catch(error => {
            console.error('Error getting access token:', error);
        });
    }
}

handleAuth();
