import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createApp} from '../server.mjs';
const out=new URL('../artifacts/',import.meta.url);await mkdir(out,{recursive:true});
const app=createApp({localRom:true,iceServers:[]});await new Promise(r=>app.http.listen(0,'127.0.0.1',r));
const url=process.env.TEST_URL||`http://127.0.0.1:${app.http.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const logs=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const host=await context.newPage();
 const observe=(page,label)=>{page.on('pageerror',e=>{logs.push(label+' ERROR '+e.message);console.log(label,e.message);});page.on('console',m=>{if(['error','warning'].includes(m.type())){logs.push(label+' '+m.type()+' '+m.text());console.log(label,m.text());}});page.on('response',r=>{if(r.status()>=400)logs.push(label+' HTTP '+r.status()+' '+r.url());});};observe(host,'host');
 async function login(page,name){await page.goto(url);await page.locator('#nickname').fill(name);await page.locator('#enter').click();await page.locator('#identity').waitFor({state:'visible'});if(process.env.TEST_URL){await page.locator('#rom-file').setInputFiles(new URL('../private/metal-warriors-es.smc',import.meta.url).pathname.slice(1));}else{await page.locator('#local-rom').waitFor({state:'visible'});await page.locator('#local-rom').click();}await page.locator('#rom-status').filter({hasText:'verificado'}).waitFor();}
 await login(host,'Dennis');await host.screenshot({path:new URL('lobby.png',out).pathname.slice(1),fullPage:true});
 await host.locator('#create').click();await host.locator('#room-name').fill('Duelo de prueba');await host.locator('#create-form button.primary').click();
 await host.waitForFunction(()=>window.EJS_emulator?.isNetplay===true,{},{timeout:90000});console.log('HOST_ROOM_OK');
 await host.screenshot({path:new URL('host.png',out).pathname.slice(1),fullPage:true});
 await host.waitForTimeout(3500);console.log('HOST_INITIAL',await host.evaluate(()=>({frame:EJS_emulator.gameManager.getFrameNum(),paused:EJS_emulator.paused,visibility:document.visibilityState})));
 const guest=await context.newPage();observe(guest,'guest');await login(guest,'Rival');await guest.getByRole('button',{name:'Unirme',exact:true}).click();
 await guest.waitForFunction(()=>window.EJS_emulator?.netplay?.webRtcReady===true,{},{timeout:90000});
 await guest.waitForFunction(()=>{const v=window.EJS_emulator?.netplay?.video;return v&&v.videoWidth>0&&v.currentTime>0;},{},{timeout:20000});
 console.log('GUEST_VIDEO_OK',await guest.evaluate(()=>({width:EJS_emulator.netplay.video.videoWidth,time:EJS_emulator.netplay.video.currentTime,players:Object.keys(EJS_emulator.netplay.players).length})));
 // Observe input at the actual host core boundary, then send one guest input.
 await host.evaluate(()=>{const f=EJS_emulator.gameManager.functions.simulateInput;window.receivedInputs=[];EJS_emulator.gameManager.functions.simulateInput=(...args)=>{window.receivedInputs.push(args);return f(...args);};});
 await guest.evaluate(()=>{EJS_emulator.gameManager.simulateInput(0,8,1);EJS_emulator.gameManager.simulateInput(0,8,0);});
 await host.waitForFunction(()=>window.receivedInputs?.some(x=>x[0]===1&&x[1]===8&&x[2]===1),{},{timeout:10000});console.log('GUEST_CONTROL_2_OK');
 async function press(page,index){await page.evaluate(i=>EJS_emulator.gameManager.simulateInput(0,i,1),index);await page.waitForTimeout(100);await page.evaluate(i=>EJS_emulator.gameManager.simulateInput(0,i,0),index);await page.waitForTimeout(600);}
 await host.bringToFront();await host.waitForTimeout(3000);console.log('HOST_AFTER_GUEST',await host.evaluate(()=>({frame:EJS_emulator.gameManager.getFrameNum(),paused:EJS_emulator.paused,visibility:document.visibilityState})));
 await press(host,3);await press(host,3);
 await host.locator('#game-wrap').screenshot({path:new URL('menu.png',out).pathname.slice(1)});
 await press(host,5);await press(host,3);
 await host.locator('#game-wrap').screenshot({path:new URL('versus-selection.png',out).pathname.slice(1)});
 await press(host,3);await press(host,0);await press(guest,3);await press(guest,0);
 await guest.waitForTimeout(2000);
 await host.locator('#game-wrap').screenshot({path:new URL('versus-host.png',out).pathname.slice(1)});
 const before=await guest.evaluate(()=>EJS_emulator.netplay.video.currentTime);
 await guest.waitForTimeout(15000);
 const after=await guest.evaluate(()=>EJS_emulator.netplay.video.currentTime);if(after-before<8)throw Error('Video detenido durante el ensayo');
 const audio=await guest.evaluate(async()=>{const pcs=Object.values(EJS_emulator.netplay.peerConnections);const reports=await Promise.all(pcs.map(x=>x.pc.getStats()));return reports.flatMap(r=>[...r.values()]).filter(r=>r.type==='inbound-rtp').map(r=>({kind:r.kind,packetsReceived:r.packetsReceived,framesDecoded:r.framesDecoded}));});console.log('STREAM_STABILITY_OK',after-before,audio);
 await press(host,3);await host.waitForTimeout(4500);await host.locator('#game-wrap').screenshot({path:new URL('actual-menu.png',out).pathname.slice(1)});
 await press(host,5);await press(host,3);await host.waitForTimeout(1500);await host.locator('#game-wrap').screenshot({path:new URL('actual-selection.png',out).pathname.slice(1)});
 await press(host,0);await press(guest,0);await press(host,3);await host.waitForTimeout(2000);
 await press(guest,3);await host.waitForTimeout(1200);await host.locator('#game-wrap').screenshot({path:new URL('stage.png',out).pathname.slice(1)});
 await press(host,3);await press(guest,3);await host.waitForTimeout(2000);
 await press(host,8);await press(guest,8);await press(host,7);await press(guest,6);
 await host.locator('#game-wrap').screenshot({path:new URL('fight.png',out).pathname.slice(1)});
 const litPixels=await guest.evaluate(()=>{const c=EJS_emulator.netplayCanvas;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let lit=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>50)lit++;return lit;});if(litPixels<1000)throw Error('La imagen remota está vacía');console.log('VISIBLE_GAME_PIXELS_OK',litPixels);
 await guest.screenshot({path:new URL('guest.png',out).pathname.slice(1),fullPage:true});
 await host.close();await guest.locator('#message').filter({hasText:'anfitrión'}).waitFor({timeout:10000});console.log('HOST_DISCONNECT_OK');
 await guest.setViewportSize({width:390,height:844});await guest.screenshot({path:new URL('mobile.png',out).pathname.slice(1),fullPage:true});
 console.log('BROWSER_TEST_PASSED');
}catch(e){console.error(e);for(const c of browser.contexts())for(const [i,p]of c.pages().entries())await p.screenshot({path:new URL('failure-'+i+'.png',out).pathname.slice(1),fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{await writeFile(new URL('browser-log.json',out),JSON.stringify(logs,null,2));console.log(logs.join('\n'));await browser.close();await app.close();}
