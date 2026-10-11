export function lobbyHint({offline,connected,session,rom,busy,activeRoom}) {
 if(busy)return 'Preparando la cabina. La primera carga puede tardar un momento.';
 if(activeRoom)return 'Ya estás en una sala. Abajo encontrarás tu partida y la invitación.';
 if(!session)return '01 / Elige tu apodo para entrar al hangar.';
 if(!rom)return '02 / Carga tu archivo .smc o .sfc para preparar el robot.';
 if(offline)return 'Modo práctica disponible. Recarga la página para reintentar las salas.';
 if(!connected)return 'Reconectando al servidor. La práctica individual sigue disponible.';
 return '03 / Todo listo. Busca rival, crea una sala o practica por tu cuenta.';
}
export function emptyRooms({offline,connected,session,rom}) {
 if(offline)return 'Salas sin conexión. Puedes cargar tu ROM y practicar.';
 if(!session)return 'Tu próxima batalla empieza aquí. Entra al hangar para ver las salas.';
 if(!connected)return 'Reconectando al hangar. Espera para consultar las salas.';
 if(!rom)return 'El hangar está libre. Prepara tu ROM para crear el primer duelo.';
 return 'La arena te espera. Crea el primer duelo e invita a tu rival.';
}
export function roomAction(room,{rom,hash,busy,activeRoom,connected}) {
 if(activeRoom?.id===room.id)return {label:'Tu sala',disabled:true};
 if(room.current>=2)return {label:'Sala completa',disabled:true};
 if(!rom)return {label:'Carga tu ROM',disabled:true};
 if(room.rom!==hash)return {label:'Otra versión',disabled:true};
 if(activeRoom)return {label:'En otra sala',disabled:true};
 if(busy)return {label:'Preparando…',disabled:true};
 if(!connected)return {label:'Sin conexión',disabled:true};
 return {label:'Unirme',disabled:false};
}
