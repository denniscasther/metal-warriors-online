# Metal Warriors Arena

## GitHub y publicación

### Servidor gratuito en Render (preparado; pendiente de activar)

[Crear el servidor gratuito en Render](https://render.com/deploy?repo=https://github.com/denniscasther/metal-warriors-online)

El archivo `render.yaml` define únicamente un servicio Node con `plan: free`, sin base de datos, discos ni complementos de pago. Iniciar sesión en Render, revisar que el plan sea **Free** y crear el servicio. Si solicita contratar un plan de pago, no continuar. El servidor escucha en `0.0.0.0` y el puerto asignado por Render; `/api/health` es su comprobación de salud. La raíz redirige al juego en GitHub Pages. No necesita emulador ni ROM en Render.

Cuando Render muestre el despliegue **Live**, copiar la URL HTTPS real y comprobar `/api/health`. Después establecer esa URL en la variable `BACKEND_URL` del repositorio GitHub y ejecutar el workflow de Pages. No sustituir el backend temporal hasta verificar el nuevo servicio. El botón de despliegue no activa actualizaciones automáticas; tras cambios futuros del servidor, desplegar manualmente en Render.

La página reintenta al iniciar durante aproximadamente dos minutos si el backend es `*.onrender.com`, para soportar el despertar del plan gratuito. Si falla, permite práctica individual; recargar para volver a intentar las salas. No realiza sondeos en segundo plano para evitar la suspensión. Las salas se pierden al reiniciar el servidor. El plan gratuito tiene cuotas y no garantiza disponibilidad continua. TURN sigue sin estar configurado: ciertas redes pueden impedir la conexión directa entre jugadores.

Web: https://denniscasther.github.io/metal-warriors-online/

Repositorio: https://github.com/denniscasther/metal-warriors-online

GitHub Actions prepara el emulador fijado a su revisión, verifica las huellas del núcleo SNES y publica únicamente `dist/` en Pages al hacer push a `main`. No se publican ROMs, archivos privados ni registros. La variable de repositorio `BACKEND_URL` señala el servicio Node/Socket.IO de salas. Cuando cambie esa dirección, actualizar la variable y volver a ejecutar el workflow.

La web y la práctica individual funcionan sin el servidor de salas, siempre que el navegador pueda descargar los recursos y el usuario seleccione su ROM. Si el servidor no está disponible, la interfaz lo informa y desactiva crear/buscar salas. El multijugador aún depende del servidor externo: publicar en GitHub no convierte el túnel temporal en un alojamiento permanente.

Prototipo local con lobby real, presencia de jugadores, salas de dos plazas y versus mediante EmulatorJS. Prioriza la ROM aportada con traducción parcial al español. El menú original aún muestra ONE PLAYER y HEAD TO HEAD.

## Abrir y jugar

1. Ejecutar `npm start` en esta carpeta y abrir http://127.0.0.1:4178.
2. Escribir un apodo y pulsar **Entrar al hangar**.
3. Pulsar **Usar mi ROM en español**. También se acepta un archivo .smc o .sfc local; los comprimidos deben extraerse primero.
4. Elegir **Practicar**, **Crear sala** o **Buscar rival**. Buscar rival entra a la primera sala compatible o crea una si no hay ninguna.
5. Para una prueba en este equipo, abrir otra pestaña con otro apodo, cargar la misma ROM y pulsar **Unirme**.
6. Esperar las pantallas iniciales del juego. Pulsar Enter para ir al título, esperar que aparezca el menú, bajar a **HEAD TO HEAD** y confirmar con Enter. Elegir escenario y robots dentro del juego.

Flechas para dirección, Enter para Start, Shift para Select, Z/X/A/S para los cuatro botones, Q/W para L/R. El menú del emulador permite reasignar botones y mandos. Mantener la pestaña del anfitrión abierta y activa. Al salir el anfitrión termina la sala; no hay migración de anfitrión.

## Qué está implementado

- Presencia y salas en tiempo real mediante Socket.IO; ninguna sala o persona ficticia.
- Admisión atómica de hasta dos personas. Validación de ROM por SHA-256 y versión de juego.
- Emulación SNES y envío de audio/video del anfitrión al invitado mediante WebRTC. Los controles remotos van al jugador 2.
- Enlaces de invitación, práctica local y cierre de sala al desconectarse.
- Carga de ROM en memoria del navegador. La copia preparada en `private/` solo se sirve en la interfaz de loopback local. No hay subida de ROM ni archivos originales modificados.

## Arquitectura y versiones

Esta implementación **transmite la partida del anfitrión**; no es rollback ni emulación determinista en paralelo. El invitado arranca el núcleo por compatibilidad con la interfaz de EmulatorJS y después lo congela para visualizar la transmisión. El audio y video consumen ancho de banda del anfitrión.

EmulatorJS está fijado al commit `f4f0f1c7c4e24440820767203adf04cfe39aed0c` en `vendor/emulatorjs`. `public/app.js` contiene un adaptador a sus interfaces internas; al actualizar el proveedor hay que repetir las pruebas. Se conserva la licencia del proveedor en su repositorio. El núcleo SNES estable descargado declara compilación del 14 de junio de 2025. El proveedor emite una advertencia sobre `getControllerPortInfo`, función opcional ausente en ese núcleo; usa su alternativa de configuración.

ROM española: `7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3`.

ROM USA: `0d7f875877fe856066cfb39b4ecdbbe7d48393a75770720876c94419f809bb1c`.

## Preparación y pruebas

`npm ci` instala las dependencias fijadas en package-lock.json. `npm run setup` descarga los núcleos y extrae exclusivamente la ROM española del RAR aportado, sin ejecutar ni abrir los enlaces que contiene. La ruta de ese archivo está documentada en `tools/setup.mjs` y puede pasarse como argumento.

`npm test` comprueba admisión, capacidad, incompatibilidad de ROM, señalización, desconexión y autenticación. `npm run test:browser` abre Edge sin ventanas, ejecuta dos clientes, comprueba recepción de video/audio, entrada del control 2 y salida del anfitrión. Las capturas y los registros quedan en `artifacts/`. Las pruebas no equivalen a validar latencia en dos redes físicas diferentes ni a una sesión prolongada de juego.

Verificación del 11 de octubre de 2026: pruebas de servidor aprobadas; dos navegadores conectados localmente y mediante el enlace HTTPS temporal; audio y video recibidos, pulsaciones del invitado observadas en el control 2, modo HEAD TO HEAD con ambos robots y cierre al salir el anfitrión comprobados. El usuario confirmó que funciona en su entorno local. Falta el ensayo entre dos redes físicas diferentes. `INICIAR.ps1` abre la instancia si ya está activa; si no lo está, intenta iniciar servidor y túnel sin ventanas de consola visibles.

## Para acceso desde internet

El servidor escucha en `127.0.0.1:4178`, y se ha abierto un túnel HTTPS temporal en https://ladder-reduces-holds-salaries.trycloudflare.com. El acceso local ofrece el botón para usar la ROM preparada; el acceso público requiere elegir el archivo desde el equipo de cada jugador. La ROM, la carpeta privada y el código del servidor devuelven 404 por la URL pública. Las invitaciones generadas localmente usan el enlace público cuando `PUBLIC_URL` está configurada.

El túnel depende de que este equipo, el servidor Node y cloudflared permanezcan encendidos. Su dirección puede cambiar cuando se reinicia. No es un alojamiento permanente. Para operación continua se necesita un alojamiento Node con HTTPS y soporte WebSocket, y configurar TURN mediante `ICE_SERVERS_JSON` para redes que no logren una conexión directa. La configuración actual usa STUN y no dispone de TURN. El servidor admite `PORT` y `HOST`; al cambiar HOST la ROM local deja de estar disponible.

Una web estática por sí sola no aloja el servidor de salas. Este servidor Node/Socket.IO no se despliega directamente como un Worker de Sites. La prueba pública usa Cloudflare Quick Tunnel hacia el proceso local. No se ha contratado infraestructura ni configurado un servidor TURN. La memoria de salas se pierde al reiniciar, y no existen cuentas, ranking, moderación avanzada ni reconexión a mitad de combate.

La siguiente prueba de aceptación es completar tres duelos desde dos redes distintas y medir retraso, continuidad de audio/video y recuperación tras una salida. No se afirma aún que ese ensayo haya pasado.
