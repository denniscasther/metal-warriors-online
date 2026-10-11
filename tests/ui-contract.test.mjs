import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
test('rediseño conserva los elementos requeridos por el juego',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'IDs duplicados');
 for(const match of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),`Falta #${match[1]}`);
 for(const id of ['create','quick','solo','step-pilot','step-rom','step-battle'])assert.ok(ids.includes(id),`Falta #${id}`);
 for(const script of ['./runtime-config.js','./socket.io/socket.io.js','./app.js'])assert.ok(html.includes(`src="${script}"`));
 const fileInput=html.match(/<input[^>]+id="rom-file"[^>]*>/)?.[0];
 assert.ok(fileInput&&!/\bhidden\b/.test(fileInput),'Selector ROM debe recibir foco de teclado');
 assert.match(html,/<dialog[^>]+aria-labelledby="create-title"/);
});
test('recursos propios y movimiento reducido',async()=>{
 const css=await readFile(new URL('../public/style.css',import.meta.url),'utf8');
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/:focus-visible/);
 for(const match of html.matchAll(/(?:href|src)="\.\/([^"#]+)"/g)){
  if(match[1]==='socket.io/socket.io.js')continue;
  await readFile(new URL('../public/'+match[1],import.meta.url));
 }
});
