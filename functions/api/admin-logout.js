import { json } from "../_lib/twitch.js";

export async function onRequestPost() {
    return json(
        { ok: true },
        200,
        {
            "Set-Cookie": "valhalla_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
        }
    );
}
