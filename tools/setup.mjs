import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const coreDir=path.join(root,'vendor/emulatorjs/data/cores');
await mkdir(path.join(coreDir,'reports'),{recursive:true});
for(const file of ['reports/snes9x.json','snes9x-wasm.data','snes9x-legacy-wasm.data']){
  const target=path.join(coreDir,file);
  try{if((await readFile(target)).length>100)continue;}catch{}
  const res=await fetch('https://cdn.emulatorjs.org/stable/data/cores/'+file);
  if(!res.ok)throw Error(`${file}: HTTP ${res.status}`);
  const bytes=Buffer.from(await res.arrayBuffer());await writeFile(target,bytes);
  console.log('Core downloaded',file,bytes.length,createHash('sha256').update(bytes).digest('hex'));
}
await mkdir(path.join(root,'private'),{recursive:true});
const archive=process.argv[2]||'C:/Users/denni/Downloads/m3-t-4-w-4-rl0r.rar';
const rom=execFileSync('tar',['-xOf',archive,'m3-t-4-w-4-rl0r/J-v-3-g-0/075-322-32-5234.smc'],{maxBuffer:8*1024*1024,windowsHide:true});
const hash=createHash('sha256').update(rom).digest('hex');
if(hash!=='7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3')throw Error('La ROM no coincide con el archivo español inspeccionado');
await writeFile(path.join(root,'private/metal-warriors-es.smc'),rom);
console.log('ROM española preparada localmente. Original intacto. SHA-256:',hash);
