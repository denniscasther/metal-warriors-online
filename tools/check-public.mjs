import assert from 'node:assert/strict';
const url=process.argv[2];if(!url?.startsWith('https://'))throw Error('Se requiere la URL HTTPS de prueba');
const health=await fetch(url+'/api/health');assert.equal(health.status,200);
const cfg=await fetch(url+'/api/config').then(r=>r.json());assert.equal(cfg.localRom,false);
for(const p of ['/api/local-rom','/private/metal-warriors-es.smc','/.git/config','/server.mjs'])assert.equal((await fetch(url+p)).status,404,p);
console.log('HTTPS y API disponibles. ROM local y archivos de servidor inaccesibles desde la URL pública.');
