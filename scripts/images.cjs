const fs=require('node:fs');const {pool,tx,rows}=require('../src/config/database');
(async()=>{
 const assets=JSON.parse(fs.readFileSync('database/imagenes.json','utf8'));
 let index=0;await Promise.all(Array.from({length:5},async()=>{while(index<assets.length){const a=assets[index++];let found=false;for(const url of a.alternatives){try{const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Mozilla/5.0'}});const type=r.headers.get('content-type')||'';if(r.ok&&type.startsWith('image/')){await r.arrayBuffer();a.url=url;found=true;break;}await r.body?.cancel();}catch{}}if(!found)throw new Error('No cargan las imágenes del producto '+a.id);console.log('Imagen verificada:',a.id);}}));
 fs.writeFileSync('database/imagenes.json',JSON.stringify(assets,null,2)+'\n');
 await tx(async c=>{for(const a of assets){const p=(await rows(c,'SELECT nombre FROM productos WHERE id=?',[a.id]))[0];if(!p)continue;await rows(c,'INSERT INTO imagenes_producto(producto_id,ruta,texto_alternativo,orden) VALUES(?,?,?,1) ON DUPLICATE KEY UPDATE ruta=VALUES(ruta),texto_alternativo=VALUES(texto_alternativo)',[a.id,a.url,p.nombre]);}});
 console.log('Catálogo actualizado: 30 imágenes por URL.');
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1;}).finally(()=>pool.end());
