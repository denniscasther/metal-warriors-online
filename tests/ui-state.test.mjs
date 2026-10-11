import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lobbyHint,emptyRooms,roomAction} from '../public/ui-state.js';
const ready={session:true,rom:true,connected:true,hash:'es'};
const room={id:'duel',current:1,rom:'es'};
test('guía de preparación: piloto, ROM y combate',()=>{
 assert.match(lobbyHint({}),/01/);
 assert.match(lobbyHint({session:true}),/02/);
 assert.match(lobbyHint(ready),/03/);
});
test('offline mantiene práctica y no promete salas vacías',()=>{
 assert.match(emptyRooms({...ready,offline:true}),/sin conexión/);
 assert.match(lobbyHint({...ready,offline:true}),/práctica/);
 assert.match(emptyRooms({...ready,connected:false}),/Reconectando/);
});
test('botón de sala explica requisitos sin falsa incompatibilidad',()=>{
 assert.deepEqual(roomAction(room,ready),{label:'Unirme',disabled:false});
 assert.equal(roomAction(room,{...ready,rom:false,hash:null}).label,'Carga tu ROM');
 assert.equal(roomAction(room,{...ready,hash:'us'}).label,'Otra versión');
 assert.equal(roomAction({...room,current:2},ready).label,'Sala completa');
 for(const change of [{busy:true},{connected:false},{activeRoom:{id:'other'}}])assert.equal(roomAction(room,{...ready,...change}).disabled,true);
 assert.equal(roomAction(room,{...ready,activeRoom:{id:'duel'}}).label,'Tu sala');
});
