# Migración a Cloudflare Pages + Twitch EventSub

Este proyecto ya no usa la función de Netlify para revisar Twitch cada 30 segundos. Twitch avisa directamente a Cloudflare cuando el canal inicia o termina un directo. Cloudflare guarda el estado en KV y la página lo consulta cada minuto.

El archivo `_routes.json` asegura que solo las rutas `/api/*` ejecuten una Function; el resto de la web sigue siendo estática.

## 1. Publicar la página

1. Sube este proyecto a un repositorio de GitHub.
2. En Cloudflare entra a **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Selecciona el repositorio y configura:
   - Framework preset: `None`.
   - Build command: déjalo vacío.
   - Build output directory: `.`
4. Publica el proyecto y conserva su URL de producción `https://<proyecto>.pages.dev`.

## 2. Crear el almacenamiento del estado

En el proyecto de Pages abre **Settings** > **Bindings** y agrega un enlace de tipo **KV namespace**:

- Variable name: `TWITCH_STATUS`
- Namespace: crea uno nuevo, por ejemplo `valhalla-twitch-status`.

Guarda el cambio para el entorno de producción.

## 3. Agregar secretos

En **Settings** > **Variables and Secrets**, crea estos secretos para producción:

| Nombre | Valor |
| --- | --- |
| `TWITCH_CLIENT_ID` | Client ID de la aplicación Valhalla Tournament en Twitch Developers |
| `TWITCH_CLIENT_SECRET` | Client Secret de esa aplicación |
| `TWITCH_EVENTSUB_SECRET` | Texto aleatorio ASCII de 10 a 100 caracteres; no lo compartas |
| `EVENTSUB_SETUP_TOKEN` | Otro texto aleatorio largo; se usará una sola vez para proteger la configuración |

No pongas ninguno de esos valores en GitHub, HTML o JavaScript del navegador.

## 4. Registrar los avisos de Twitch

Después de que Pages esté desplegado y los secretos estén guardados, abre PowerShell y ejecuta este comando. Sustituye la URL y el token; el canal ya está configurado como `AthenaKamelot`.

```powershell
$headers = @{ Authorization = "Bearer TU_EVENTSUB_SETUP_TOKEN" }
Invoke-RestMethod -Method Post -Headers $headers -Uri "https://TU-PROYECTO.pages.dev/api/setup-twitch-eventsub?channel=AthenaKamelot"
```

Debe responder con dos suscripciones: `stream.online` y `stream.offline`, ambas con código `202`. Twitch validará de inmediato la ruta `/api/twitch-eventsub`.

## 5. Comprobar la página

Abre:

```text
https://TU-PROYECTO.pages.dev/api/twitch-status?channel=AthenaKamelot
```

Debe responder `live: true` si el canal está transmitiendo o `live: false` si no lo está. Cuando Twitch cambie de estado, EventSub actualizará KV y la página lo reflejará en un máximo de un minuto.

## Cuando cambies de dominio

Si después conectas un dominio propio y quieres que Twitch entregue las notificaciones a ese dominio, vuelve a ejecutar el paso 4 desde ese dominio. Después elimina las suscripciones antiguas desde la consola de Twitch o vuelve a configurar con una nueva URL.

## Archivos importantes

- `functions/api/twitch-status.js`: API pública que consume la página.
- `functions/api/twitch-eventsub.js`: receptor seguro de los avisos de Twitch.
- `functions/api/setup-twitch-eventsub.js`: registra las suscripciones de Twitch; está protegida por `EVENTSUB_SETUP_TOKEN`.
- `netlify/functions/twitch-stream.js`: se conserva como referencia y ya no se usa.
