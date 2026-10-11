import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('descarga española coincide con la ROM admitida en las salas',async()=>{
 const rom=await readFile(new URL('../public/downloads/metal-warriors-es.smc',import.meta.url));
 assert.equal(rom.length,2097152);
 assert.equal(createHash('sha256').update(rom).digest('hex'),'7179556197d57fce35968f1fc1f303c825ec0a376bfda6ad3e8d8c36207ea2f3');
});
