import { json, normalizeChannel } from "../_lib/twitch.js";

export async function onRequestGet({ request, env }) {
    const channel = normalizeChannel(new URL(request.url).searchParams.get("channel"));

    if (!channel) {
        return json({ error: "Debes indicar un canal de Twitch." }, 400);
    }

    if (!env.TWITCH_STATUS) {
        return json({ error: "Falta configurar el enlace TWITCH_STATUS de Cloudflare KV." }, 500);
    }

    const savedStatus = await env.TWITCH_STATUS.get(`stream:${channel}`, "json");

    return json(
        {
            live: Boolean(savedStatus?.live),
            channel,
            updatedAt: savedStatus?.updatedAt || null
        },
        200,
        {
            "Cache-Control": "public, max-age=0, s-maxage=20"
        }
    );
}
