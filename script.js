let bananaBalance = 0;
let leaderboard = [];
const clientId = 'Y129566'; 
const clientSecret = '24202e2054ac02c10eb6e6730bb050813338b3d1'; 
const redirectUri = 'https://bananahealth.netlify.app/'; 

const accelerators = {
    low: { multiplier: 2, cost: 20 },
    mid: { multiplier: 3, cost: 50 },
    high: { multiplier: 5, cost: 100 }
};

document.getElementById('login-button').addEventListener('click', () => {
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all,activity:write&approval_prompt=force`;
});

async function fetchStravaData(code) {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code'
        })
    });

    const data = await response.json();
    const accessToken = data.access_token;

    const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const activities = await activitiesResponse.json();
    const latestActivity = activities[0];
    const calories = latestActivity.calories;
    const bananaCount = (calories / 100).toFixed(2);
    updateBananaCount(bananaCount);

    bananaBalance += parseFloat(bananaCount);
    updateStravaActivityDescription(latestActivity.id, bananaCount, bananaBalance, accessToken);
    updateLeaderboard('Player', bananaBalance);
}

function updateBananaCount(count) {
    const amountInput = document.getElementById('amount');
    amountInput.value = count;
}

async function updateStravaActivityDescription(activityId, bananaCount, bananaBalance, accessToken) {
    const description = `Bananas earned：${bananaCount}，current banana balence：${bananaBalance}`;

    await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description })
    });
}

function updateLeaderboard(player, bananas) {
    leaderboard.push({ player, bananas });
    leaderboard.sort((a, b) => b.bananas - a.bananas);
    leaderboard = leaderboard.slice(0, 20);

    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';

    leaderboard.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.textContent = `${entry.player}: ${entry.bananas} Bananas`;
        leaderboardList.appendChild(listItem);
    });
}

document.getElementById('toggle-leaderboard').addEventListener('click', () => {
    const leaderboard = document.querySelector('.leaderboard');
    leaderboard.classList.toggle('hidden');
    const button = document.getElementById('toggle-leaderboard');
    button.textContent = leaderboard.classList.contains('hidden') ? 'Show Leaderboard' : 'Hide Leaderboard';
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        fetchStravaData(code);
    }
});
