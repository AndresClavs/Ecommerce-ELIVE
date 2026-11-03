const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {randomUUID}=require('node:crypto');const mysql=require('mysql2/promise');
test('Integración MVC: persistencia, permisos, stock y doble compra',async()=>{
 const database='elive_test_'+randomUUID().replaceAll('-','');
 const admin=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
 let server,pool;
 try{
  await admin.query(fs.readFileSync('database/01_esquema.sql','utf8').replaceAll('elive_ecommerce_mvc',database));
  await admin.query(fs.readFileSync('database/02_catalogo_inicial.sql','utf8').replaceAll('elive_ecommerce_mvc',database));
  await admin.query(fs.readFileSync('database/05_favoritos_cuenta.sql','utf8'));
  process.env.DB_NAME=database;process.env.PAYMENT_MODE='demo';
  const app=require('../src/app');pool=require('../src/config/database').pool;
  server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base='http://127.0.0.1:'+server.address().port;
  function client(){let cookie='';return async(path,method='GET',body)=>{const res=await fetch(base+'/api'+path,{method,headers:{cookie,'Content-Type':'application/json','X-Elive-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)});if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];return {status:res.status,data:await res.json()};};}
  const a=client(),b=client();const boot=await a('/bootstrap');assert.equal(boot.status,200);assert.equal(boot.data.products.length,30);const variant=boot.data.products.find(p=>p.id===1).variantes[0].id;
  await b('/bootstrap');assert.equal((await a('/cart/'+variant,'POST',{cantidad:1})).data.cart.envio,4.99);
  assert.equal((await a('/cart/'+variant,'PATCH',{cantidad:11})).status,422);
  assert.equal((await a('/favorites/1','PUT',{})).status,401);
  assert.equal((await a('/auth/register','POST',{nombre:'Ana',email:'ana@example.com',clave:'Secreto123!'})).status,200);
  await a('/favorites/1','PUT',{});await a('/favorites/1','PUT',{});assert.equal((await a('/state')).data.fav.length,1);
  assert.equal((await a('/state')).data.cart.envio,0);assert.equal((await a('/state')).data.cart.items.length,1);
  const order={nombre:'Ana',apellido:'Pérez',email:'ana@example.com',telefono:'+593991234567',direccion:'Av. Central 123, Quito',claveIdempotencia:randomUUID()};
  assert.equal((await a('/orders','POST',{...order,tarjeta:'4242'})).status,400);
  const [one,two]=await Promise.all([a('/orders','POST',order),a('/orders','POST',order)]);assert.equal(one.status,201);assert.equal(two.status,201);assert.equal(one.data.numero,two.data.numero);
  assert.equal((await a('/orders/'+one.data.numero)).data.total,12.9);assert.equal((await a('/orders/'+one.data.numero)).data.estado,'recibido');
  const [[payments]]=await pool.query('SELECT COUNT(*) AS n FROM pagos');assert.equal(payments.n,0);
  assert.equal((await b('/orders/'+one.data.numero)).status,404);
  assert.equal((await a('/orders','POST',{...order,nombre:'Otra'})).status,409);
  const [[stock]]=await pool.query('SELECT stock FROM variantes_producto WHERE id=?',[variant]);assert.equal(stock.stock,14);
  assert.equal((await a('/state')).data.cart.items.length,0);
  await a('/auth/logout','POST',{});assert.equal((await a('/orders/'+one.data.numero)).status,404);
  await a('/auth/login','POST',{email:'ana@example.com',clave:'Secreto123!'});assert.equal((await a('/orders/'+one.data.numero)).status,200);assert.equal((await a('/state')).data.fav.length,1);
  const other=client();await other('/bootstrap');await other('/auth/login','POST',{email:'ana@example.com',clave:'Secreto123!'});assert.equal((await other('/state')).data.fav.length,1);
  // Dos compradores disputan la última unidad; uno solo debe completar compra.
  const c=client();await c('/bootstrap');await pool.query('UPDATE variantes_producto SET stock=1 WHERE id=?',[variant]);
  await b('/cart/'+variant,'POST',{cantidad:1});await c('/cart/'+variant,'POST',{cantidad:1});
  const race=await Promise.all([b('/orders','POST',{...order,claveIdempotencia:randomUUID()}),c('/orders','POST',{...order,claveIdempotencia:randomUUID()})]);assert.deepEqual(race.map(x=>x.status).sort(),[201,409]);
  const [[remaining]]=await pool.query('SELECT stock FROM variantes_producto WHERE id=?',[variant]);assert.equal(remaining.stock,0);
  const [[count]]=await pool.query('SELECT COUNT(*) AS n FROM pedidos');assert.equal(count.n,2);
  const denied=await fetch(base+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});assert.equal(denied.status,403);
  for(const page of ['index','producto','carrito','favoritos','checkout','confirmacion','pedido'])assert.equal((await fetch(base+'/'+page+'.html')).status,200);
 }finally{
  if(server)await new Promise(r=>server.close(r));if(pool)await pool.end();
  if(!/^elive_test_[a-f0-9]{32}$/.test(database))throw new Error('Base temporal inválida');
  await admin.query('DROP DATABASE IF EXISTS `'+database+'`');await admin.end();
 }
});
