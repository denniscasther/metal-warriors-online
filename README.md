# Metal Warriors Arena

Juego de Super Nintendo en el navegador con práctica individual y salas versus de dos personas. La partida corre en el navegador del anfitrión; el video y el audio llegan al invitado por WebRTC, y sus controles vuelven como jugador 2. Es una versión funcional para **Metal Warriors**, todavía no un catálogo de varios juegos.

- Portal: https://denniscasther.github.io/metal-warriors-online/
- Salas: https://metal-warriors-salas.onrender.com
- Código: https://github.com/denniscasther/metal-warriors-online

La documentación para continuar está en [CONTEXTO.md](CONTEXTO.md). La propuesta para incorporar otros juegos está en [docs/PLATAFORMA-SNES.md](docs/PLATAFORMA-SNES.md).

## Jugar

1. Abre el portal, escribe un apodo y pulsa **Entrar al hangar**.
2. Descarga la ROM en español desde el portal si la necesitas. Luego pulsa **Elegir archivo .smc o .sfc** y selecciona el archivo descargado. El archivo cargado se procesa en el navegador.
3. Pulsa **Practicar**, **Crear sala** o **Buscar rival**. Buscar rival entra en una sala compatible disponible o crea una nueva.
4. Ambos jugadores deben cargar exactamente la misma versión. El anfitrión mantiene abierta su pestaña.
5. Dentro del juego el versus se llama **HEAD TO HEAD**; la traducción al español es parcial. Selecciona dos jugadores en el menú del juego.

Flechas para mover; Enter para Start; Shift para Select; Z/X/A/S para los botones; Q/W para L/R. El emulador permite reasignarlos. El enlace de invitación se copia desde una sala abierta.

La ROM publicada a petición del usuario es `public/downloads/metal-warriors-es.smc`, de 2 MiB, con SHA-256 `7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3`. El usuario confirmó autorización para distribuir ese archivo; el proyecto no verificó los derechos de forma independiente. La versión USA también es aceptada si el jugador ya la tiene, pero no se ofrece como descarga. La carpeta local `private/` no se publica.

## Arquitectura y publicación

`public/` contiene el portal y el adaptador de EmulatorJS. `server.mjs` ofrece sesiones, presencia, salas de dos plazas, validación de ROM, señalización WebRTC y retransmisión de controles. Las salas y sesiones viven en memoria: al reiniciar Render se pierden. No hay cuentas, ranking ni migración del anfitrión. Actualmente se usa STUN; falta TURN para redes que no consiguen conectar directamente.

GitHub Actions (`.github/workflows/pages.yml`) prepara el emulador y publica `dist/` en GitHub Pages cuando hay cambios en `main`. La variable de repositorio `BACKEND_URL` apunta al servicio de Render. `render.yaml` define un servicio Node gratuito para las salas; tiene `autoDeployTrigger: off`, por lo que los cambios del servidor requieren despliegue manual en Render. La instancia gratuita puede suspenderse por inactividad; la página espera su arranque y permite practicar si sigue sin responder. La laptop no necesita estar encendida para la web pública.

El emulador está fijado al commit `f4f0f1c7c4e24440820767203adf04cfe39aed0c`. `public/app.js` adapta interfaces internas de esa versión; repetir las pruebas del juego antes de actualizarla. El servidor publicado en Render funciona solo como backend (`BACKEND_ONLY=true`); no aloja el emulador ni la ROM.

## Trabajo local

La carpeta de trabajo principal es `C:\Plataformas\Proyectos\denniscasther\metal-warriors-online`.

```powershell
npm ci
node tools/prepare-emulator.mjs
npm test
npm start
```

Abrir http://127.0.0.1:4178. Para jugar localmente, usa **Elegir archivo** y la ROM de `public/downloads/`. `npm run setup` y `INICIAR.ps1` son utilidades del prototipo inicial: pueden depender del RAR de Downloads o abrir el antiguo túnel local. No son necesarios para usar la web pública.

`npm test` comprueba el servidor, los estados de interfaz, los elementos necesarios del portal y la huella de la descarga. `npm run test:browser` contiene un ensayo de dos clientes con Edge y requiere navegador y ROM local. Se verificó una partida versus en dos pestañas y a través de un túnel HTTPS temporal antes del traslado a Render; todavía faltan partidas prolongadas entre dos redes físicas diferentes. También está pendiente una revisión visual de la renovación del portal en escritorio y móvil.

## Próxima etapa

Antes de incorporar otro juego, seguir [docs/PLATAFORMA-SNES.md](docs/PLATAFORMA-SNES.md): catálogo por juego y versión, salas aisladas, configuración del emulador por título y una prueba real del versus. Añadir un nombre o una ROM a `server.mjs` por sí solo no garantiza que el multijugador del nuevo juego funcione.
