import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadBackendConfig} from '../public/backend-config.js';
const config={roms:{},iceServers:[]};
test('espera el arranque de Render y recupera configuración',async()=>{
 let calls=0,waits=0;
 const result=await loadBackendConfig('https://example.onrender.com',{fetcher:async()=>{calls++;if(calls===1)throw Error('asleep');if(calls===2)return {ok:false};return {ok:true,json:async()=>config};},sleep:async()=>{},onWaiting:()=>waits++});
 assert.deepEqual(result,config);assert.equal(calls,3);assert.equal(waits,2);
});
test('abandona tras intentos acotados para permitir práctica',async()=>{
 let calls=0;
 await assert.rejects(loadBackendConfig('https://example.onrender.com',{attempts:3,fetcher:async()=>{calls++;throw Error('offline');},sleep:async()=>{}}),/offline/);
 assert.equal(calls,3);
});
test('rechaza respuesta de arranque que no es configuración',async()=>{
 await assert.rejects(loadBackendConfig('https://example.onrender.com',{attempts:1,fetcher:async()=>({ok:true,json:async()=>({})})}),/Configuración/);
});
