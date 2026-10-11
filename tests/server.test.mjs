import {test} from 'node:test';
import assert from 'node:assert/strict';
import {io} from 'socket.io-client';
import {createApp,ROMS} from '../server.mjs';
const hashes=Object.keys(ROMS);
test('servidor Render: salud, CORS y ausencia de ROM pública',async t=>{
 const app=createApp({backendOnly:true});await new Promise(r=>app.http.listen(0,'127.0.0.1',r));t.after(()=>app.close());
 const url=`http://127.0.0.1:${app.http.address().port}`;
 assert.equal((await fetch(url+'/api/health').then(r=>r.json())).ok,true);
 const config=await fetch(url+'/api/config',{headers:{Origin:'https://denniscasther.github.io'}});
 assert.equal(config.headers.get('access-control-allow-origin'),'https://denniscasther.github.io');
 assert.equal((await config.json()).localRom,false);
 assert.equal((await fetch(url+'/api/local-rom')).status,404);
 assert.equal((await fetch(url+'/private/metal-warriors-es.smc')).status,404);
 assert.equal((await fetch(url+'/',{redirect:'manual'})).headers.get('location'),'https://denniscasther.github.io/metal-warriors-online/');
});
test('salas reales: capacidad, ROM, señales y desconexión',async t=>{
 const app=createApp();await new Promise(r=>app.http.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.http.address().port}`,clients=[];t.after(async()=>{for(const s of clients)s.disconnect();await app.close();});
 async function pilot(name,hash=hashes[0]){const ses=await fetch(url+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})}).then(r=>r.json());async function connect(role){const s=io(url,{auth:{token:ses.token,role},reconnection:false});clients.push(s);await new Promise((r,j)=>{s.once('connect',r);s.once('connect_error',j);});return s;}const lobby=await connect('lobby');assert.equal((await lobby.emitWithAck('set-rom',hash)).ok,true);return {lobby,emu:await connect('emulator'),hash};}
 const a=await pilot('A'),b=await pilot('B'),c=await pilot('C'),d=await pilot('USA',hashes[1]);
 const payload=(p,id='duelo')=>({extra:{sessionid:id,userid:p.emu.id,game_id:ROMS[p.hash].gameId,room_name:'Duelo'},maxPlayers:2});
 assert.equal(await a.emu.emitWithAck('open-room',payload(a)),null);
 assert.match(await d.emu.emitWithAck('join-room',payload(d)),/misma ROM/);
 const joined=await new Promise(r=>b.emu.emit('join-room',payload(b),(err,users)=>r({err,users})));assert.equal(joined.err,null);assert.equal(Object.keys(joined.users).length,2);
 assert.match(await c.emu.emitWithAck('join-room',payload(c)),/llena/);
 const signal=new Promise(r=>b.emu.once('webrtc-signal',r));a.emu.emit('webrtc-signal',{target:b.emu.id,offer:{type:'offer',sdp:'test'}});assert.equal((await signal).sender,a.emu.id);
 const rooms=await fetch(url+'/list?game_id=210201').then(r=>r.json());assert.equal(rooms.duelo.current,2);
 const ended=new Promise(r=>b.emu.once('room-ended',r));a.emu.disconnect();assert.match(await ended,/anfitrión/);assert.equal(app.rooms.size,0);
 assert.equal((await fetch(url+'/api/local-rom')).status,404);
});
test('rechaza conexiones sin sesión y archivos desconocidos',async t=>{
 const app=createApp();await new Promise(r=>app.http.listen(0,'127.0.0.1',r));t.after(()=>app.close());const url=`http://127.0.0.1:${app.http.address().port}`;const bad=io(url,{auth:{token:'x',role:'emulator'},reconnection:false});const error=await new Promise(r=>bad.on('connect_error',r));bad.disconnect();assert.match(error.message,/Sesión/);assert.equal((await fetch(url+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"name":""}'})).status,400);
});
