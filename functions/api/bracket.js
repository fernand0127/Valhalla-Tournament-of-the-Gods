import { hasAdminSession } from "../_lib/admin-auth.js";
import { buildBracket, loadBracket, saveBracket } from "../_lib/bracket-data.js";
import { json } from "../_lib/twitch.js";

export async function onRequestGet({ env }) {
    try {
        return json(buildBracket(await loadBracket(env)), 200, {
            "Cache-Control": "no-store"
        });
    } catch (error) {
        return json({ error: error.message }, 500);
    }
}

export async function onRequestPost({ request, env }) {
    if (!await hasAdminSession(request, env.ADMIN_SESSION_SECRET)) {
        return json({ error: "No autorizado." }, 401);
    }

    try {
        const body = await request.json();
        const saved = await saveBracket(env, body);
        return json(buildBracket(saved));
    } catch (error) {
        return json({ error: error.message || "No se pudo guardar el bracket." }, 400);
    }
}
