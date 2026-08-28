const textEncoder = new TextEncoder();

export function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...headers
        }
    });
}

export function normalizeChannel(channel) {
    return (channel || "")
        .trim()
        .toLowerCase()
        .replace(/^@/, "")
        .replace(/[^a-z0-9_]/g, "");
}

export async function getAppAccessToken(env) {
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
        throw new Error("Faltan las credenciales de Twitch en Cloudflare.");
    }

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            client_id: env.TWITCH_CLIENT_ID,
            client_secret: env.TWITCH_CLIENT_SECRET,
            grant_type: "client_credentials"
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "No se pudo autenticar con Twitch.");
    }

    return data.access_token;
}

export async function verifyTwitchMessage(request, body, secret) {
    const messageId = request.headers.get("Twitch-Eventsub-Message-Id");
    const timestamp = request.headers.get("Twitch-Eventsub-Message-Timestamp");
    const signature = request.headers.get("Twitch-Eventsub-Message-Signature");

    if (!messageId || !timestamp || !signature || !secret) {
        return false;
    }

    const key = await crypto.subtle.importKey(
        "raw",
        textEncoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signed = await crypto.subtle.sign(
        "HMAC",
        key,
        textEncoder.encode(messageId + timestamp + body)
    );

    const expected = `sha256=${[...new Uint8Array(signed)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("")}`;

    if (expected.length !== signature.length) {
        return false;
    }

    let difference = 0;

    for (let index = 0; index < expected.length; index += 1) {
        difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
    }

    return difference === 0;
}

export function hasValidSetupToken(request, token) {
    const authorization = request.headers.get("Authorization") || "";
    return Boolean(token) && authorization === `Bearer ${token}`;
}
