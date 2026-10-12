# Posible plataforma de salas para más juegos de Super Nintendo

**Estado:** propuesta de evolución, no implementada. La experiencia actual de Metal Warriors es el primer caso. El siguiente juego todavía no se eligió.

## Objetivo

Permitir que una persona elija un juego compatible, vea las salas de ese juego, cargue una ROM de la versión admitida y juegue un versus desde el navegador. Conservar la página y las partidas actuales de Metal Warriors durante la evolución.

## Qué es reutilizable hoy

- Acceso con apodo y sesiones temporales.
- Presencia, salas de dos plazas, invitaciones y señales WebRTC.
- Transmisión de video/audio desde el anfitrión y controles del invitado.
- Verificación SHA-256 de archivos cargados en el navegador.
- GitHub Pages para el portal y Render para las salas.

## Qué está ligado a Metal Warriors

| Área | Situación actual | Necesidad para varios juegos |
| --- | --- | --- |
| Catálogo | `ROMS` en `server.mjs` y copia de hashes en `public/app.js` | Una sola definición compartida y versionada de juego, variante y huella. |
| Identidad de sala | El servidor valida el hash y el `game_id`; el lobby general muestra todas las salas | Filtrar salas y búsqueda rápida por juego; además exigir exactamente la misma variante de ROM dentro de cada sala. |
| Emulador | `EJS_core='snes9x'`, nombre, IDs y controles escritos en `public/app.js` | Configuración por juego, con núcleo y controles probados. |
| Pantalla | Títulos, ayuda del modo HEAD TO HEAD y descarga propios de Metal Warriors | Selector de juego y ayuda específica; mantener la página de Metal Warriors como ruta o selección estable. |
| ROM | Una descarga pública española y una versión USA aceptada | Registrar por separado compatibilidad y permiso de distribución de cada archivo. No publicar otra ROM por defecto. |
| Pruebas | Versus comprobado para Metal Warriors | Comprobar arranque, dos jugadores, video, audio, controles y desconexión por cada nuevo título. |

## Modelo propuesto

Un registro por juego define `id` estable, nombre, núcleo del emulador, modos compatibles, número de jugadores probado, instrucciones y variantes. Cada variante tiene `sha256`, región/idioma, tamaño y `gameId` compatible con el adaptador. El enlace de descarga es opcional: solo existe si ese archivo específico se decidió publicar. La ROM que carga cada persona se comprueba localmente con SHA-256; una sala acepta exactamente la misma variante en ambos lados.

El backend debería devolver un catálogo público mínimo (`/api/games` o ampliación versionada de `/api/config`) y asociar `gameId` + hash a cada sesión y sala. La lista, el buscador rápido y las invitaciones deben conservar el juego elegido. Al abrir una invitación de otro juego, el portal ofrece cambiar de juego y cargar la variante requerida antes de entrar. El servidor debe validar estas reglas; ocultar botones en la interfaz no es suficiente.

La primera versión puede mantener un único backend y una sola web. Si el uso crece, decidir entonces si hacen falta salas persistentes, moderación o más instancias. Render gratuito reinicia y pierde el estado en memoria; esa limitación también aplicaría a los nuevos juegos.

## Secuencia de trabajo

1. Elegir un segundo título concreto y confirmar que tiene un modo local de dos jugadores que pueda controlarse con el esquema actual. Registrar variantes y hashes de archivos que se usarán para probar; decidir por separado si habrá descarga pública.
2. Extraer un catálogo compartido sin cambiar el comportamiento de Metal Warriors. Mantener una prueba de regresión para sus salas, ROM española, versión USA y enlaces actuales.
3. Asociar juego y variante a sesión, sala y búsqueda. Rechazar de forma explícita unirse con otro juego, otra región o una ROM diferente.
4. Añadir selector e instrucciones por juego. Evitar presentar como compatible un juego aún no ensayado. Mantener práctica individual cuando el servidor esté dormido.
5. Probar el segundo título en dos pestañas y luego en dos redes: entrada al modo versus, control de ambos jugadores, imagen y audio continuos, salida del anfitrión y rendimiento razonable. Si falla WebRTC en alguna red, evaluar TURN antes de anunciar compatibilidad amplia.
6. Publicar primero como beta con criterios de compatibilidad visibles. Documentar por título los controles, versión admitida, problemas y resultado de pruebas.

## Decisiones pendientes

- Próximo juego a probar y sus variantes exactas.
- Portal único «Arena SNES» o páginas individuales enlazadas por un catálogo. No se ha decidido un cambio de marca.
- Política de descargas por archivo; la confirmación dada para la ROM española de Metal Warriors no se extiende automáticamente a otras ROM.
- Necesidad de TURN y almacenamiento persistente después de medir sesiones reales.

## Criterio para llamar compatible a un juego

Dos personas cargan la misma variante, una crea la sala y la otra entra desde otra red; ambas pueden manejar su jugador en un modo versus real durante una partida prolongada, con video/audio estable y cierre comprensible al salir el anfitrión. Metal Warriors sigue pasando su prueba de regresión. Hasta entonces, el título se muestra como experimental o no se publica.
