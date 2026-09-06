# Bracket público y panel privado

## Qué cambia

El bracket público ya no permite seleccionar ganadores. Lee un único estado guardado en Cloudflare KV. El panel `admin.html` es el único lugar desde el que se guardan equipos y resultados.

## Reglas implementadas

- High Elo inicia con 14 equipos y 7 partidos.
- Los 7 perdedores de esa primera ronda van a Perdedores High Elo. El octavo lugar es el equipo de reposición, editable desde el panel privado.
- El campeón de Perdedores High Elo ocupa el segundo lugar del cuarto partido de cuartos de High Elo.
- Low Elo inicia con 8 equipos y 4 partidos.
- Los 4 perdedores de esos cuartos forman Perdedores Low Elo.
- Los perdedores de rondas posteriores no bajan a los cuadros de perdedores.

## Configuración obligatoria en Cloudflare

En **Workers & Pages → valhalla-tournament-of-the-gods → Settings**:

1. Crea un KV namespace llamado, por ejemplo, `valhalla-bracket-data`.
2. En **Bindings**, añade ese namespace con el nombre de variable exacto `BRACKET_DATA`.
3. En **Variables and secrets**, crea dos secretos para Production:
   - `ADMIN_PASSWORD`: una contraseña larga que usarás para entrar a `/admin.html`.
   - `ADMIN_SESSION_SECRET`: un valor aleatorio largo para firmar las sesiones.
4. Guarda los cambios y ejecuta un nuevo despliegue.

Para crear un valor aleatorio en PowerShell:

```powershell
-join (1..32 | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

No publiques ni subas esos valores a GitHub.

## Uso

1. Abre `https://TU-SITIO.pages.dev/admin.html`.
2. Introduce `ADMIN_PASSWORD`.
3. Escribe los 14 nombres de High y los 8 de Low.
4. Elige un ganador por partido y pulsa **Guardar cambios públicos**.
5. La página pública se actualiza al recargar o, para quien ya la tenga abierta, en aproximadamente un minuto.

## Archivos principales

- `functions/_lib/bracket-data.js`: reglas de avance y datos del torneo.
- `functions/api/bracket.js`: lectura pública y escritura autenticada.
- `functions/api/admin-login.js`: inicio de sesión del panel.
- `admin.html` y `js/admin.js`: interfaz privada de edición.
- `js/bracket.js`: renderiza la versión pública sin controles editables.
