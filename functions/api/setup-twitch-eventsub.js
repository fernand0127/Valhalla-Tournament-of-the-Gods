import {
    getAppAccessToken,
    hasValidSetupToken,
    json,
    normalizeChannel
} from "../_lib/twitch.js";

async function getTwitchUser(channel, clientId, accessToken) {
    const response = await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(channel)}`,
        {
            headers: {
                "Client-ID": clientId,
                "Authorization": `Bearer ${accessToken}`
            }
        }
    );
    const data = await response.json();

    if (!response.ok || !data.data?.[0]) {
        throw new Error(data.message || "No se encontró el canal de Twitch.");
    }

    return data.data[0];
}

async function saveInitialStatus(channel, userId, env, accessToken) {
    const response = await fetch(
        `https://api.twitch.tv/helix/streams?user_id=${encodeURIComponent(userId)}`,
        {
            headers: {
                "Client-ID": env.TWITCH_CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`
            }
        }
    );
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "No se pudo consultar el estado inicial del canal.");
    }

    const live = data.data?.length > 0;

    await env.TWITCH_STATUS.put(
        `stream:${channel}`,
        JSON.stringify({ live, channel, updatedAt: new Date().toISOString() })
    );

    return live;
}

async function createSubscription(type, broadcasterId, callback, env, accessToken) {
    const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        method: "POST",
        headers: {
            "Client-ID": env.TWITCH_CLIENT_ID,
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type,
            version: "1",
            condition: { broadcaster_user_id: broadcasterId },
            transport: {
                method: "webhook",
                callback,
                secret: env.TWITCH_EVENTSUB_SECRET
            }
        })
    });
    const data = await response.json();

    if (!response.ok && response.status !== 409) {
        throw new Error(data.message || `No se pudo crear ${type}.`);
    }

    return { type, status: response.status, data };
}

export async function onRequestPost({ request, env }) {
    if (!hasValidSetupToken(request, env.EVENTSUB_SETUP_TOKEN)) {
        return new Response("No autorizado.", { status: 401 });
    }

    if (!env.TWITCH_STATUS || !env.TWITCH_EVENTSUB_SECRET) {
        return json({ error: "Faltan secretos o el enlace TWITCH_STATUS." }, 500);
    }

    const channel = normalizeChannel(new URL(request.url).searchParams.get("channel"));

    if (!channel) {
        return json({ error: "Agrega ?channel=nombre_del_canal." }, 400);
    }

    try {
        const accessToken = await getAppAccessToken(env);
        const twitchUser = await getTwitchUser(channel, env.TWITCH_CLIENT_ID, accessToken);
        const live = await saveInitialStatus(channel, twitchUser.id, env, accessToken);
        const callback = new URL("/api/twitch-eventsub", request.url).toString();
        const subscriptions = await Promise.all([
            createSubscription("stream.online", twitchUser.id, callback, env, accessToken),
            createSubscription("stream.offline", twitchUser.id, callback, env, accessToken)
        ]);

        return json({
            channel,
            live,
            callback,
            subscriptions: subscriptions.map(({ type, status }) => ({ type, status }))
        });
    } catch (error) {
        console.error("Error configurando Twitch EventSub:", error);
        return json({ error: error.message }, 500);
    }
}
