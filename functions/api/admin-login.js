import { createAdminSession, isCorrectPassword } from "../_lib/admin-auth.js";
import { json } from "../_lib/twitch.js";

export async function onRequestPost({ request, env }) {
    try {
        const { password } = await request.json();

        if (!isCorrectPassword(password, env.ADMIN_PASSWORD) || !env.ADMIN_SESSION_SECRET) {
            return json({ error: "Contraseña incorrecta." }, 401);
        }

        const session = await createAdminSession(env.ADMIN_SESSION_SECRET);
        return json(
            { ok: true },
            200,
            {
                "Set-Cookie": `valhalla_admin=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`
            }
        );
    } catch {
        return json({ error: "Solicitud no válida." }, 400);
    }
}
