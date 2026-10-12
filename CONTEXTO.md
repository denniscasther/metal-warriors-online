# Contexto para retomar el proyecto

Actualizado: 2026-10-11. Continuar desde `C:\Plataformas\Proyectos\denniscasther\metal-warriors-online`. La copia `C:\Users\denni\metal-warriors-online` se conserva como respaldo y **no se sincroniza automáticamente** con la principal.

## Estado actual

- Repositorio `denniscasther/metal-warriors-online`, rama `main`; portal https://denniscasther.github.io/metal-warriors-online/.
- Servidor de salas https://metal-warriors-salas.onrender.com, definido en `render.yaml` como servicio Free. `BACKEND_URL` del repositorio GitHub apunta allí. El servidor Render no se despliega automáticamente (`autoDeployTrigger: off`). GitHub Pages sí se publica al hacer push a `main`.
- La aplicación funciona para Metal Warriors: salas de dos jugadores, lista de pilotos, práctica, invitaciones, verificación de ROM y WebRTC. El anfitrión emula y transmite; invitado controla jugador 2. El anfitrión debe mantener su pestaña abierta. Las salas y sesiones no son persistentes.
- EmulatorJS fijado a `f4f0f1c7c4e24440820767203adf04cfe39aed0c`. El adaptador de `public/app.js` depende de APIs internas de esa revisión.
- Descarga pública: `public/downloads/metal-warriors-es.smc`, publicada tras confirmación de autorización del usuario. Traducción parcial, 2097152 bytes, SHA-256 `7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3`. Derechos no verificados independientemente. `private/` solo es local.
- La interfaz se renovó con robot vectorial, pasos piloto/ROM/combate, estados de salas y adaptación móvil.

## Próxima dirección acordada

El usuario quiere dejar abierta la posibilidad de ofrecer salas para **otros juegos de Super Nintendo**. Esto es una dirección futura, no una capacidad actual. La propuesta técnica, límites y criterios de aceptación están en [docs/PLATAFORMA-SNES.md](docs/PLATAFORMA-SNES.md). No se ha elegido el siguiente juego ni se han autorizado/publicado otras ROM. No transformar la aplicación en un catálogo sin verificar el versus de cada título.

La ampliación debe conservar Metal Warriors funcionando. Separar catálogo de juegos/versiones de la lógica de salas; identificar cada sala por juego y huella exacta de ROM; configurar EmulatorJS, controles e instrucciones por título. Probar primero un segundo juego en dos navegadores y luego dos redes físicas. Evaluar TURN si la conexión directa falla. Evitar afirmar que todos los juegos SNES comparten el mismo modo multijugador.

## Comandos y comprobaciones

`npm ci`, `node tools/prepare-emulator.mjs`, `npm test`, `npm start` para el entorno local. `npm run test:browser` requiere Edge, la ROM local y una prueba específica del juego. Revisar `README.md` antes de iniciar el túnel antiguo con `INICIAR.ps1`.

En el traslado a la carpeta principal, el commit local coincidía con GitHub y pasaban 12 pruebas; esta nota documental puede generar un nuevo commit. Verificar de nuevo `git status --short`, `git rev-parse HEAD` y el remoto al continuar.

Pendientes: revisión visual del portal con navegador conectado, sesiones prolongadas desde redes diferentes, latencia, TURN y recuperación tras desconexiones. Las carpetas `private/`, `vendor/`, `node_modules/`, `artifacts/`, `dist/` y logs son locales; no publicar secretos ni otros archivos personales. La única ROM versionada por ahora es `public/downloads/metal-warriors-es.smc`.
