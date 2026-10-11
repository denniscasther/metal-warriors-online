import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import {randomBytes} from 'node:crypto';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export const ROMS={
 '7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3':{label:'Español',gameId:210201},
 '0d7f875877fe856066cfb39b4ecdbbe7d48393a75770720876c94419f809bb1c':{label:'USA · Inglés',gameId:210202}
};
const root=import.meta.dirname;
const clean=(s,max=24)=>typeof s==='string'?s.trim().replace(/[\x00-\x1f]/g,'').slice(0,max):'';
export function createApp({localRom=false,iceServers=[]}={}){
 const allowedOrigins=['https://denniscasther.github.io'];
 const app=express(),http=createServer(app),io=new Server(http,{maxHttpBufferSize:65536,cors:{origin:allowedOrigins,methods:['GET','POST']}});
 const sessions=new Map(),rooms=new Map();
 app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');next();});
 app.use((req,res,next)=>{if(allowedOrigins.includes(req.headers.origin)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');}if(req.method==='OPTIONS')return res.status(204).end();next();});
 app.use(express.json({limit:'2kb'}));
 const isLocal=req=>['localhost','127.0.0.1','[::1]'].includes(req.hostname)&&!req.headers['x-forwarded-host']&&!req.headers['x-forwarded-for']&&!req.headers['cf-connecting-ip'];
 app.get('/favicon.ico',(req,res)=>res.status(204).end());
 app.get('/api/config',(req,res)=>res.json({roms:ROMS,publicUrl:process.env.PUBLIC_URL||null,localRom:localRom&&isLocal(req)&&existsSync(path.join(root,'private/metal-warriors-es.smc')),iceServers}));
 app.get('/api/health',(req,res)=>res.json({ok:true,rooms:rooms.size}));
 app.post('/api/session',(req,res)=>{
  if(sessions.size>=200)return res.status(503).json({error:'Servidor ocupado'});
  const name=clean(req.body?.name);if(!name)return res.status(400).json({error:'Escribe tu apodo'});
  const token=randomBytes(24).toString('hex');sessions.set(token,{id:randomBytes(8).toString('hex'),token,name,rom:null,room:null,lobby:null,emu:null,seen:Date.now()});res.json({token,name});
 });
 app.get('/api/local-rom',(req,res)=>{
  const addr=req.socket.remoteAddress;
  if(!localRom||!isLocal(req)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(addr))return res.sendStatus(404);
  res.sendFile(path.join(root,'private/metal-warriors-es.smc'));
 });
 const publicRooms=()=>Object.fromEntries([...rooms].map(([id,r])=>[id,{id,room_name:r.name,current:r.members.size,max:2,hasPassword:false,rom:r.rom,language:ROMS[r.rom].label,host:r.host.name,game_id:ROMS[r.rom].gameId}]));
 const snapshot=()=>({rooms:Object.values(publicRooms()),players:[...sessions.values()].filter(s=>s.lobby).map(s=>({id:s.id,name:s.name,room:s.room,rom:s.rom,state:s.room?'En sala':s.rom?'Disponible':'Preparando juego'}))});
 const broadcast=()=>io.to('lobby').emit('lobby:update',snapshot());
 const users=r=>Object.fromEntries([...r.members.values()].map(m=>[m.userid,{userid:m.userid,player_name:m.session.name,socketId:m.socketId}]));
 function leave(socket){
  const s=socket.data.session,r=rooms.get(s?.room);if(!r||!r.members.has(socket.id))return;
  if(r.host===s){rooms.delete(r.id);for(const m of r.members.values()){m.session.room=null;io.sockets.sockets.get(m.socketId)?.leave(r.id);io.to(m.socketId).emit('room-ended','El anfitrión salió de la sala');}}
  else{r.members.delete(socket.id);s.room=null;socket.leave(r.id);io.to(r.id).emit('users-updated',users(r));}
  broadcast();
 }
 app.get('/list',(req,res)=>res.json(Object.fromEntries(Object.entries(publicRooms()).filter(([,r])=>String(r.game_id)===String(req.query.game_id)))));
 io.use((socket,next)=>{
  const s=sessions.get(socket.handshake.auth?.token);if(!s)return next(Error('Sesión no válida'));
  const role=socket.handshake.auth?.role;if(!['lobby','emulator'].includes(role))return next(Error('Rol no válido'));
  if(s[role==='lobby'?'lobby':'emu'])return next(Error('Ya existe una conexión de esta sesión'));
  socket.data.session=s;socket.data.role=role;next();
 });
 io.on('connection',socket=>{
  const s=socket.data.session,role=socket.data.role,key=role==='lobby'?'lobby':'emu';s[key]=socket.id;s.seen=Date.now();
  if(role==='lobby'){socket.join('lobby');broadcast();}
  let count=0;const rateTimer=setInterval(()=>count=0,1000);rateTimer.unref();
  socket.use((packet,next)=>{if(++count>240)return next(Error('Demasiados mensajes'));next();});
  socket.on('set-rom',(hash,ack=()=>{})=>{if(role!=='lobby'||s.room)return ack({error:'Sal de la sala primero'});if(!ROMS[hash])return ack({error:'ROM no reconocida. Usa una de las dos versiones verificadas.'});s.rom=hash;ack({ok:true,...ROMS[hash]});broadcast();});
  const validated=(payload,ack)=>{
   if(typeof ack!=='function')return null;
   if(role!=='emulator'||!s.rom){ack('Carga el juego primero');return null;}
   if(s.room){ack('Ya estás en una sala');return null;}
   const e=payload?.extra;if(!e||typeof e.sessionid!=='string'||!/^[\w-]{1,80}$/.test(e.sessionid)||typeof e.userid!=='string'||!/^[\w-]{1,80}$/.test(e.userid)){ack('Solicitud inválida');return null;}
   if(e.game_id!==ROMS[s.rom].gameId){ack('Versión de juego incompatible');return null;}return e;
  };
  socket.on('open-room',(p,ack)=>{
   const e=validated(p,ack);if(!e)return;if(rooms.has(e.sessionid))return ack('La sala ya existe');
   const name=clean(e.room_name,32);if(!name)return ack('Falta el nombre de sala');
   const r={id:e.sessionid,name,rom:s.rom,host:s,members:new Map()};r.members.set(socket.id,{userid:e.userid,session:s,socketId:socket.id});rooms.set(r.id,r);s.room=r.id;socket.join(r.id);ack(null);queueMicrotask(()=>io.to(r.id).emit('users-updated',users(r)));broadcast();
  });
  socket.on('join-room',(p,ack)=>{
   const e=validated(p,ack);if(!e)return;const r=rooms.get(e.sessionid);if(!r)return ack('La sala ya no existe');
   if(r.rom!==s.rom)return ack('Los jugadores deben usar la misma ROM');
   if(r.members.size>=2)return ack('La sala está llena');
   if([...r.members.values()].some(m=>m.userid===e.userid))return ack('Identificador duplicado');
   r.members.set(socket.id,{userid:e.userid,session:s,socketId:socket.id});s.room=r.id;socket.join(r.id);ack(null,users(r));queueMicrotask(()=>io.to(r.id).emit('users-updated',users(r)));broadcast();
  });
  socket.on('leave-room',()=>leave(socket));
  socket.on('webrtc-signal',p=>{const r=rooms.get(s.room);if(!r?.members.has(socket.id)||!r.members.has(p?.target)||p.target===socket.id)return;const out={sender:socket.id};for(const k of ['offer','answer','candidate','requestRenegotiate'])if(p[k]!==undefined)out[k]=p[k];io.to(p.target).emit('webrtc-signal',out);});
  socket.on('data-message',p=>{
   const r=rooms.get(s.room);if(!r?.members.has(socket.id)||!p||typeof p!=='object')return;
   const out={};if(Array.isArray(p['sync-control']))out['sync-control']=p['sync-control'].slice(0,32).filter(v=>Array.isArray(v.connected_input)&&v.connected_input.length===3&&Number.isInteger(v.connected_input[1])&&v.connected_input[1]>=0&&v.connected_input[1]<=15&&[0,1].includes(v.connected_input[2])).map(v=>({...v,connected_input:[r.host===s?0:1,v.connected_input[1],v.connected_input[2]]}));
   if(r.host===s)for(const k of ['pause','play','restart'])if(p[k]===true)out[k]=true;
   if(p.frameAck!==undefined)out.frameAck=p.frameAck;
   if(Object.keys(out).length)socket.to(r.id).emit('data-message',out);
  });
  socket.on('disconnect',()=>{clearInterval(rateTimer);if(role==='lobby'&&s.emu)io.sockets.sockets.get(s.emu)?.disconnect(true);leave(socket);if(s[key]===socket.id)s[key]=null;s.seen=Date.now();broadcast();});
 });
 const cleanup=setInterval(()=>{for(const [t,s]of sessions)if(!s.lobby&&!s.emu&&Date.now()-s.seen>60000)sessions.delete(t);},30000);cleanup.unref();
 app.use('/emulator',express.static(path.join(root,'vendor/emulatorjs/data'),{dotfiles:'deny'}));
 app.use(express.static(path.join(root,'public'),{dotfiles:'deny'}));
 app.use((err,req,res,next)=>res.status(400).json({error:'Solicitud inválida'}));
 return {app,http,io,rooms,sessions,close:()=>new Promise(resolve=>{clearInterval(cleanup);io.close(()=>http.close(()=>resolve()));})};
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const port=Number(process.env.PORT||4178),host=process.env.HOST||'127.0.0.1';
 const iceServers=process.env.ICE_SERVERS_JSON?JSON.parse(process.env.ICE_SERVERS_JSON):[{urls:'stun:stun.l.google.com:19302'}];
 const {http}=createApp({localRom:host==='127.0.0.1',iceServers});http.listen(port,host,()=>console.log(`Metal Warriors: http://${host}:${port}`));
}
