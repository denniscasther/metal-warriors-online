import {loadBackendConfig} from './backend-config.js';
const $=id=>document.getElementById(id),baseIO=window.io;
const backend=(window.MW_BACKEND_URL||location.origin).replace(/\/$/,'');
const assetBase=new URL('./',location.href).href;
const offlineConfig={offline:true,localRom:false,iceServers:[],roms:{'7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3':{label:'Español',gameId:210201},'0d7f875877fe856066cfb39b4ecdbbe7d48393a75770720876c94419f809bb1c':{label:'USA · Inglés',gameId:210202}}};
const config=await loadBackendConfig(backend,{attempts:new URL(backend).hostname.endsWith('.onrender.com')?12:1,onWaiting:()=>{$('connection').textContent='Despertando servidor · puede tardar hasta 2 minutos';$('rooms').textContent='El alojamiento gratuito está iniciando. Espera un momento para entrar al hangar.';}}).catch(()=>offlineConfig);
if(config.offline||window.MW_STATIC_HOST||config.publicUrl)document.querySelector('.notice').replaceChildren(document.createTextNode(config.offline?'PRÁCTICA DISPONIBLE ':'BETA EN PRUEBAS '),Object.assign(document.createElement('span'),{textContent:config.offline?'El servidor de salas está apagado. Puedes cargar tu ROM y practicar.':window.MW_STATIC_HOST?'Web alojada en GitHub. Las salas usan un servidor externo de prueba.':'Invitaciones por enlace temporal. El anfitrión debe mantener abierta la partida.'}));
let session=null,lobby=null,rom=null,hash=null,emuReady=false,loading=null,pending=null,activeRoom=null,lastState={rooms:[],players:[]},busy=false;
let messageTimer;
function message(t){$('message').textContent=t;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('message').textContent='',7000);}
function buttons(){for(const id of ['create','quick'])$(id).disabled=!rom||!lobby?.connected||busy||!!activeRoom;$('solo').disabled=!rom||busy||!!activeRoom;}
function text(tag,value,cls){const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;}
function render(state=lastState){
 lastState=state;$('room-count').textContent=state.rooms.length;$('player-count').textContent=state.players.length;
 $('rooms').replaceChildren();$('rooms').className=state.rooms.length?'':'empty';
 if(!state.rooms.length)$('rooms').textContent='No hay salas abiertas. Crea una e invita a tu rival.';
 for(const r of state.rooms){const row=text('div','','room'),info=text('div','');info.append(text('strong',r.room_name),text('small',`${r.host} · ${r.language} · ${r.current}/2 pilotos`));const b=text('button',r.current===2?'En partida':r.rom!==hash?'Otra versión':'Unirme');b.disabled=r.current===2||r.rom!==hash||busy||!!activeRoom||!rom;b.onclick=()=>startAction({type:'join',room:r});row.append(info,b);$('rooms').append(row);}
 $('players').replaceChildren();for(const p of state.players){const e=text('div',p.name,'pilot');e.append(text('span',p.state));$('players').append(e);}buttons();
}
$('login').onsubmit=async e=>{e.preventDefault();$('enter').disabled=true;try{
 if(config.offline){session={name:$('nickname').value.trim()};$('login').hidden=true;$('identity').hidden=false;$('identity').textContent=session.name+' · práctica individual';$('rooms').textContent='Servidor de salas no disponible. Carga tu ROM y pulsa Practicar.';buttons();return;}
 const res=await fetch(backend+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('nickname').value})});session=await res.json();if(!res.ok)throw Error(session.error);
 lobby=baseIO(backend,{auth:{token:session.token,role:'lobby'}});
 window.io=(url,opts={})=>baseIO(url,{...opts,auth:{token:session.token,role:'emulator'}});
 lobby.on('connect',()=>{$('connection').textContent='Conectado al hangar';$('login').hidden=true;$('identity').hidden=false;$('identity').textContent=session.name;$('local-rom').hidden=!config.localRom;buttons();});
 lobby.on('lobby:update',render);lobby.on('disconnect',()=>{$('connection').textContent='Sin conexión · reintentando';buttons();});lobby.on('connect_error',e=>message(e.message));
 }catch(e){message(e.message);$('enter').disabled=false;}};
async function selectRom(file){
 if(!session)return message('Entra al hangar con tu apodo primero.');if(!config.offline&&!lobby?.connected)return message('Espera a que se restablezca la conexión.');if(loading||emuReady||activeRoom)return message('Recarga la página para cambiar la ROM.');
 const bytes=await file.arrayBuffer();let data=bytes;
 if(bytes.byteLength%32768===512)data=bytes.slice(512);
 const digest=await crypto.subtle.digest('SHA-256',data);const h=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(!config.roms[h])throw Error('ROM no reconocida. Elige la ROM española extraída o la versión USA verificada.');
 const result=config.offline?config.roms[h]:await lobby.timeout(5000).emitWithAck('set-rom',h);if(result.error)throw Error(result.error);
 rom=new Blob([data],{type:'application/octet-stream'});hash=h;$('rom-status').textContent=`✓ ${result.label} · archivo verificado`;$('local-rom').hidden=true;render();
 const requested=new URLSearchParams(location.search).get('sala');if(requested){const room=lastState.rooms.find(r=>r.id===requested);if(room&&room.rom===hash&&room.current<2)startAction({type:'join',room});else message('La sala de la invitación está llena, cerrada o usa otra versión del juego.');}
}
$('local-rom').onclick=async()=>{try{const res=await fetch('/api/local-rom');if(!res.ok)throw Error('No se pudo abrir la ROM local');await selectRom(await res.blob());}catch(e){message(e.message);}};
$('rom-file').onchange=async e=>{try{const f=e.target.files[0];if(f){if(f.size>8*1024*1024)throw Error('Archivo demasiado grande');await selectRom(f);}}catch(e){message(e.message);}};
$('refresh').onclick=()=>{if(lobby?.connected)render();else message('Entra al hangar primero.');};
$('create').onclick=()=>{$('room-name').value=`Duelo de ${session.name}`;$('create-dialog').showModal();};
$('cancel-create').onclick=()=>$('create-dialog').close();
$('create-form').onsubmit=e=>{e.preventDefault();$('create-dialog').close();startAction({type:'host',name:$('room-name').value.trim()});};
$('quick').onclick=()=>{const r=lastState.rooms.find(r=>r.rom===hash&&r.current<2);startAction(r?{type:'join',room:r}:{type:'host',name:`Duelo de ${session.name}`});};
$('solo').onclick=()=>startAction({type:'solo'});
function boot(){
 if(emuReady)return Promise.resolve(window.EJS_emulator);if(loading)return loading;
 $('game-panel').hidden=false;
 loading=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{busy=false;buttons();message('La carga tarda demasiado. Revisa la conexión y recarga para reintentar.');reject(Error('Tiempo de carga agotado'));},90000);
  Object.assign(window,{EJS_player:'#game',EJS_core:'snes9x',EJS_gameUrl:URL.createObjectURL(rom),EJS_gameName:'Metal Warriors '+config.roms[hash].label,EJS_gameID:config.roms[hash].gameId,EJS_pathtodata:'/emulator/',EJS_language:'es-ES',EJS_startOnLoaded:true,EJS_DEBUG_XX:true,EJS_threads:false,EJS_netplayServer:location.origin,EJS_netplayICEServers:config.iceServers,EJS_color:'#93bb6a',EJS_volume:0.5,EJS_Buttons:{netplay:false,cheat:false},EJS_defaultControls:{0:{0:{value:'z'},1:{value:'a'},2:{value:'shift'},3:{value:'enter'},4:{value:'up arrow'},5:{value:'down arrow'},6:{value:'left arrow'},7:{value:'right arrow'},8:{value:'x'},9:{value:'s'},10:{value:'q'},11:{value:'w'}}}});
  window.EJS_language='es';window.EJS_pathtodata=assetBase+'emulator/';window.EJS_netplayServer=backend;
  window.EJS_onGameStart=()=>{clearTimeout(timer);emuReady=true;const emu=window.EJS_emulator;wireNetplay(emu);$('game-status').textContent='Espera la introducción y pulsa Enter. El versus se llama HEAD TO HEAD.';resolve(emu);};
  const script=document.createElement('script');script.src=assetBase+'emulator/loader.js';script.onerror=()=>{clearTimeout(timer);reject(Error('No se pudo cargar el emulador'));};document.body.append(script);
 });return loading;
}
// Adapter tied to upstream f4f0f1c7. Re-test whenever upgrading EmulatorJS.
function wireNetplay(emu){
 // The emulator loads its own Socket.IO bundle during boot; restore authenticated factory afterwards.
 window.io=(url,opts={})=>baseIO(url,{...opts,forceNew:true,auth:{token:session.token,role:'emulator'}});
 const n=emu.netplay;n.name=session.name;
 const joined=n.roomJoined.bind(n);n.roomJoined=(owner,name,pw,id)=>{joined(owner,name,pw,id);activeRoom={id,name,owner};busy=false;$('game-title').textContent=name;$('game-status').textContent=owner?'Sala abierta. Esperando un rival…':'Conectando video y controles…';$('invite').hidden=false;render();};
 const oldLeave=n.leaveRoom.bind(n);n.leaveRoom=()=>{oldLeave();activeRoom=null;busy=false;$('invite').hidden=true;$('game-status').textContent='Fuera de la sala. Puedes crear o unirte a otra.';render();};
 const startSocket=n.startSocketIO.bind(n);n.startSocketIO=cb=>{startSocket(()=>{const sock=n.socket;if(!sock._arenaBound){sock._arenaBound=true;sock.on('room-ended',reason=>{message(reason);n.leaveRoom();});}cb();});n.socket?.on('connect_error',e=>{busy=false;message(e.message);console.error('Netplay connection:',e.message);render();});};
 n.showJoinErrorDialog=(id,name,max,error)=>{busy=false;message(error);if(n.socket){n.socket.disconnect();n.socket=null;}render();};
 const oldOpen=n.openRoom.bind(n);n.openRoom=(...args)=>oldOpen(...args);
 setInterval(()=>{if(!activeRoom)return;const count=Object.keys(n.players).length;if(activeRoom.owner)$('game-status').textContent=count===2?'Rival conectado. Selecciona 2 jugadores en el menú del juego.':'Esperando un rival. Copia la invitación para compartir la sala.';else if(n.webRtcReady)$('game-status').textContent='Video conectado · tú controlas al jugador 2';},1000);
}
async function startAction(action){
 if(busy||activeRoom)return;busy=true;pending=action;render();$('game-panel').hidden=false;$('game-panel').scrollIntoView({behavior:'smooth',block:'start'});
 $('game-title').textContent=action.type==='solo'?'Práctica local':action.type==='host'?action.name:action.room.room_name;
 try{const emu=await boot();if(pending!==action)return;emu.play();const n=emu.netplay;
  if(action.type==='solo'){busy=false;render();return;}
  if(!n.updateList)n.defineNetplayFunctions();emu.originalControls=JSON.parse(JSON.stringify(emu.controls));
  if(action.type==='host')n.openRoom(action.name,2,'');else n.joinRoom(action.room.id,action.room.room_name,2,null);
  setTimeout(()=>{if(busy&&!activeRoom){busy=false;message('No se pudo entrar a la sala. Inténtalo otra vez.');render();}},12000);
 }catch(e){busy=false;message(e.message);render();}
}
$('leave').onclick=()=>{if(busy&&!emuReady){location.reload();return;}pending=null;const e=window.EJS_emulator;if(activeRoom)e.netplay.leaveRoom();e?.pause();$('game-panel').hidden=true;busy=false;render();};
$('invite').onclick=async()=>{if(!activeRoom)return;const url=new URL(window.MW_STATIC_HOST?location.href:config.publicUrl||location.href);url.searchParams.set('sala',activeRoom.id);try{await navigator.clipboard.writeText(url.href);message(config.publicUrl?'Invitación copiada. Tu rival necesita cargar la misma ROM.':'Enlace local copiado. Solo funciona donde sea accesible este servidor.');}catch{message(url.href);}};
window.addEventListener('unhandledrejection',e=>console.error('Arena:',e.reason));
$('connection').textContent=config.offline?'Solo práctica · salas sin conexión':'Hangar disponible';$('enter').disabled=false;
