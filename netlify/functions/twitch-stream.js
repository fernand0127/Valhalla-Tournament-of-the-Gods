exports.handler = async function (event) {

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    const url = new URL(
        event.rawUrl || `https://${event.headers.host}${event.path}`
    );

    const channel =
        url.searchParams.get("channel") || "AthenaKamelot";

    try {

        // 1. Obtener token de Twitch
        const tokenResponse = await fetch(
            "https://id.twitch.tv/oauth2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: "client_credentials"
                })
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(
                tokenData.message || "No se pudo obtener el token de Twitch"
            );
        }

        // 2. Preguntar a Twitch si el canal está en vivo
        const streamResponse = await fetch(
            `https://api.twitch.tv/helix/streams?user_login=${channel}`,
            {
                headers: {
                    "Client-ID": clientId,
                    "Authorization": `Bearer ${tokenData.access_token}`
                }
            }
        );

        const streamData = await streamResponse.json();

        if (!streamResponse.ok) {
            throw new Error(
                streamData.message || "Error consultando Twitch"
            );
        }

        const isLive = streamData.data && streamData.data.length > 0;

        return {
            statusCode: 200,

            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            },

            body: JSON.stringify({
                live: isLive,
                channel: channel
            })
        };

    } catch (error) {

        console.error("Twitch API Error:", error);

        return {
            statusCode: 500,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                live: false,
                error: error.message
            })
        };
    }
};