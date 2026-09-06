const encoder = new TextEncoder();

function encodeBase64Url(value) {
    const bytes = value instanceof Uint8Array ? value : encoder.encode(value);
    let binary = "";

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(left, right) {
    if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) {
        return false;
    }

    let difference = 0;

    for (let index = 0; index < left.length; index += 1) {
        difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }

    return difference === 0;
}

async function sign(value, secret) {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
    return encodeBase64Url(new Uint8Array(signature));
}

function readCookie(request, name) {
    const value = request.headers.get("Cookie") || "";
    const item = value.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`));
    return item ? item.slice(name.length + 1) : null;
}

export async function createAdminSession(secret) {
    const payload = encodeBase64Url(JSON.stringify({ exp: Date.now() + 1000 * 60 * 60 * 12 }));
    return `${payload}.${await sign(payload, secret)}`;
}

export async function hasAdminSession(request, secret) {
    const token = readCookie(request, "valhalla_admin");

    if (!token || !secret) {
        return false;
    }

    const [payload, signature] = token.split(".");

    if (!payload || !signature || !safeEqual(signature, await sign(payload, secret))) {
        return false;
    }

    try {
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return Number.isFinite(decoded.exp) && decoded.exp > Date.now();
    } catch {
        return false;
    }
}

export function isCorrectPassword(password, expectedPassword) {
    return Boolean(expectedPassword) && safeEqual(password, expectedPassword);
}
