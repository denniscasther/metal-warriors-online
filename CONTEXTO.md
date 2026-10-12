# Contexto para retomar Metal Warriors Arena

Actualizado: 2026-10-11.

## Ubicación y publicación

- Carpeta principal solicitada: `C:\Plataformas\Proyectos\denniscasther\metal-warriors-online`.
- Copia anterior conservada como respaldo: `C:\Users\denni\metal-warriors-online`. Las carpetas no se sincronizan automáticamente entre sí; continuar desde la principal.
- GitHub: https://github.com/denniscasther/metal-warriors-online (rama `main`).
- Portal: https://denniscasther.github.io/metal-warriors-online/
- Servidor de salas: https://metal-warriors-salas.onrender.com
- Variable GitHub Actions `BACKEND_URL`: apunta al servidor de Render. No necesita la laptop encendida.

## Implementación

HTML/CSS/JavaScript, Express y Socket.IO; EmulatorJS fijado a `f4f0f1c7c4e24440820767203adf04cfe39aed0c`. El anfitrión emula y transmite audio/video mediante WebRTC; el invitado controla al jugador 2. No es rollback. Máximo dos pilotos por sala, misma huella de ROM requerida. Sesiones y salas solo en memoria. El anfitrión debe mantener su pestaña abierta.

GitHub Actions publica `dist/` al subir a `main`. Render usa `render.yaml`, plan Free, `HOST=0.0.0.0`, `BACKEND_ONLY=true`; la raíz redirige a Pages. Actualizaciones del servidor requieren despliegue manual en Render (`autoDeployTrigger: off`). El plan gratuito puede dormir; la interfaz espera su arranque y ofrece práctica si falla. No hay TURN; falta validar partidas prolongadas entre dos redes físicas distintas.

## Últimos cambios

- Portal renovado con cabina retrofuturista, robot SVG original, guía piloto/ROM/combate, salas con estados explícitos, adaptación móvil y movimiento reducido.
- Revisión visual de esta renovación pendiente: no había navegador conectado a la herramienta durante la sesión. No afirmar que pasó inspección visual completa.
- Descarga pública en `public/downloads/metal-warriors-es.smc`, publicada a petición del usuario tras confirmar autorización de distribución; no se verificaron los derechos independientemente.
- Traducción parcial: el menú versus sigue llamándose HEAD TO HEAD.
- SHA-256 español: `7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3`; tamaño 2097152 bytes.
- Publicación de descarga verificada por HTTP y SHA-256. Doce pruebas automatizadas aprobadas (servidor, estados, contrato HTML y descarga).

## Trabajar y verificar

`npm ci`, `npm test`, `npm start` (http://127.0.0.1:4178). `node tools/prepare-emulator.mjs` prepara el emulador sin extraer archivos originales. `INICIAR.ps1` corresponde al arranque local y al antiguo túnel de prueba, no al servidor público actual. Revisar antes de usarlo para no confundir una instancia local anterior con esta carpeta.

`npm run test:browser` contiene el ensayo anterior con dos clientes Edge y requiere navegador disponible y ROM local. Capturas/registros están en `artifacts/` y no se publican. No modificar `wireNetplay` sin repetir pruebas del emulador.

Las carpetas `private/`, `vendor/`, `node_modules/`, `artifacts/`, `dist/` y los logs son locales e ignorados por Git. Única excepción ROM versionada: `public/downloads/metal-warriors-es.smc`. No subir otras carpetas privadas, credenciales o archivos personales.

## Próximos pasos

1. Revisar visualmente el diseño en escritorio y móvil.
2. Completar duelos desde dos redes distintas y evaluar latencia y necesidad de TURN.
3. Mantener la ficha del proyecto en el cerebro del directorio principal si se incorpora al inventario compartido.
