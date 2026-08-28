import { json, normalizeChannel, verifyTwitchMessage } from "../_lib/twitch.js";

export async function onRequestPost({ request, env }) {
    if (!env.TWITCH_STATUS || !env.TWITCH_EVENTSUB_SECRET) {
        return json({ error: "Faltan los enlaces o secretos de Twitch EventSub." }, 500);
    }

    const rawBody = await request.text();
    const isValid = await verifyTwitchMessage(
        request,
        rawBody,
        env.TWITCH_EVENTSUB_SECRET
    );

    if (!isValid) {
        return new Response("Firma de Twitch no válida.", { status: 403 });
    }

    let payload;

    try {
        payload = JSON.parse(rawBody);
    } catch {
        return new Response("JSON no válido.", { status: 400 });
    }

    const messageType = request.headers.get("Twitch-Eventsub-Message-Type");

    if (messageType === "webhook_callback_verification") {
        const challenge = payload.challenge || "";

        return new Response(challenge, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Length": String(new TextEncoder().encode(challenge).byteLength)
            }
        });
    }

    if (messageType === "notification") {
        const channel = normalizeChannel(payload.event?.broadcaster_user_login);
        const eventType = payload.subscription?.type;

        if (channel && (eventType === "stream.online" || eventType === "stream.offline")) {
            await env.TWITCH_STATUS.put(
                `stream:${channel}`,
                JSON.stringify({
                    live: eventType === "stream.online",
                    channel,
                    updatedAt: new Date().toISOString()
                })
            );
        }

        return new Response(null, { status: 204 });
    }

    if (messageType === "revocation") {
        console.warn("Twitch revocó una suscripción EventSub.", payload.subscription);
        return new Response(null, { status: 204 });
    }

    return new Response(null, { status: 204 });
}
