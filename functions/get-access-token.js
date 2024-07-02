const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { code } = JSON.parse(event.body);
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
        }),
    });

    const data = await response.json();
    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};
