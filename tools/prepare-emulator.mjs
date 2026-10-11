import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),vendor=path.join(root,'vendor/emulatorjs');
const revision='f4f0f1c7c4e24440820767203adf04cfe39aed0c';
await mkdir(path.dirname(vendor),{recursive:true});
try{await readFile(path.join(vendor,'package.json'));}catch{execFileSync('git',['clone','https://github.com/EmulatorJS/EmulatorJS.git',vendor],{stdio:'inherit'});execFileSync('git',['-C',vendor,'switch','--detach',revision],{stdio:'inherit'});}
const current=execFileSync('git',['-C',vendor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(current!==revision)throw Error('Revisión de EmulatorJS no compatible');
const files={
 'reports/snes9x.json':'dc7ac963eb7935a7ac78956235ac0b8912ec785c57026336825aa2ed8031b3ad',
 'snes9x-wasm.data':'eaa0bcfce67673809886e50387a80a616b719502175db64c090d04c9d75958ee',
 'snes9x-legacy-wasm.data':'7d427a575cefad98ff400493fa1d7e892da63fe7bab68979babd9cea0bfaaf3b'
};
for(const [file,expected]of Object.entries(files)){
 const dest=path.join(vendor,'data/cores',file);let data;try{data=await readFile(dest);}catch{const r=await fetch('https://cdn.emulatorjs.org/stable/data/cores/'+file);if(!r.ok)throw Error(file+': '+r.status);data=Buffer.from(await r.arrayBuffer());}
 if(createHash('sha256').update(data).digest('hex')!==expected)throw Error('El núcleo cambió: revisar antes de desplegar '+file);
 await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,data);
}
console.log('Emulador y núcleo preparados, sin archivos de juego.');
