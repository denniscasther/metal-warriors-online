// Retry only during startup; never keep a free host awake with background pings.
export async function loadBackendConfig(backend, {fetcher=fetch, sleep=ms=>new Promise(r=>setTimeout(r,ms)), onWaiting=()=>{}, attempts=12, timeout=10000}={}) {
 for(let attempt=0;attempt<attempts;attempt++) {
  try {
   const response=await fetcher(backend+'/api/config',{signal:AbortSignal.timeout(timeout)});
   if(!response.ok)throw Error('Servidor no disponible');
   const config=await response.json();
   if(!config.roms||!Array.isArray(config.iceServers))throw Error('Configuración no válida');
   return config;
  } catch(error) {
   if(attempt===attempts-1)throw error;
   onWaiting(attempt+1);
   await sleep(2000);
  }
 }
 throw Error('Servidor no disponible');
}
