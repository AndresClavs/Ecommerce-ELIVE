const {randomUUID}=require('node:crypto');
const {pool,rows,tx}=require('../config/database');const Shop=require('./shop');const {AppError}=require('../validation');
const delivery=['nombre','apellido','email','direccion','telefono'];
async function create(session,data){
 return tx(async c=>{
  const cartId=await Shop.lockCart(c,session);
  const previous=(await rows(c,'SELECT * FROM pedidos WHERE sesion_id=? AND clave_idempotencia=?',[session.id,data.claveIdempotencia]))[0];
  if(previous){if(delivery.some(k=>previous[k]!==data[k]))throw new AppError(409,'Este intento ya creó un pedido con otros datos.');return previous.numero;}
  const items=await rows(c,`SELECT i.cantidad,v.id,v.sku,v.stock,v.activo,p.activo AS producto_activo,p.nombre,p.precio,t.codigo AS talla FROM carrito_items i JOIN variantes_producto v ON v.id=i.variante_id JOIN productos p ON p.id=v.producto_id JOIN tallas t ON t.id=v.talla_id WHERE i.carrito_id=? ORDER BY v.id FOR UPDATE`,[cartId]);
  if(!items.length)throw new AppError(409,'Tu bolsa está vacía. Añade una prenda para continuar.');
  for(const i of items)if(!i.activo||!i.producto_activo||i.stock<i.cantidad)throw new AppError(409,`Revisa la disponibilidad de ${i.nombre}, talla ${i.talla}.`);
  const subtotal=items.reduce((a,i)=>a+Shop.cents(i.precio)*i.cantidad,0);
  const config=(await rows(c,'SELECT * FROM configuracion_tienda WHERE id=1'))[0];
  const envio=session.cliente_id&&config.envio_gratis_con_cuenta?0:Shop.cents(config.costo_envio);
  const number='EL-'+randomUUID();
  const r=await rows(c,`INSERT INTO pedidos(numero,sesion_id,cliente_id,clave_idempotencia,nombre,apellido,email,direccion,telefono,subtotal,envio,estado_codigo) VALUES(?,?,?,?,?,?,?,?,?,?,?,'recibido')`,[number,session.id,session.cliente_id||null,data.claveIdempotencia,...delivery.map(k=>data[k]),(subtotal/100).toFixed(2),(envio/100).toFixed(2)]);
  for(const i of items){
   const update=await rows(c,'UPDATE variantes_producto SET stock=stock-? WHERE id=? AND stock>=?',[i.cantidad,i.id,i.cantidad]);if(update.affectedRows!==1)throw new AppError(409,'Cambió la disponibilidad. Revisa tu bolsa.');
   await rows(c,'INSERT INTO pedido_items(pedido_id,variante_id,nombre_producto,sku,talla,cantidad,precio_unitario) VALUES(?,?,?,?,?,?,?)',[r.insertId,i.id,i.nombre,i.sku,i.talla,i.cantidad,i.precio]);
  }
  await rows(c,"INSERT INTO historial_pedido(pedido_id,estado_codigo,nota) VALUES(?,'recibido','Pedido recibido; pago pendiente')",[r.insertId]);
  await rows(c,'DELETE FROM carrito_items WHERE carrito_id=?',[cartId]);return number;
 });
}
async function list(session){return rows(pool,'SELECT numero,estado_codigo,total,creado_en FROM pedidos WHERE sesion_id=? OR (cliente_id IS NOT NULL AND cliente_id=?) ORDER BY id DESC LIMIT 50',[session.id,session.cliente_id||null]);}
async function get(session,number){const p=(await rows(pool,'SELECT * FROM pedidos WHERE numero=? AND (sesion_id=? OR (cliente_id IS NOT NULL AND cliente_id=?))',[number,session.id,session.cliente_id||null]))[0];if(!p)throw new AppError(404,'No encontramos ese pedido en tu sesión.');return {numero:p.numero,estado:p.estado_codigo,email:p.email,subtotal:Number(p.subtotal),envio:Number(p.envio),total:Number(p.total),items:await rows(pool,'SELECT nombre_producto AS nombre,talla,cantidad AS cant,subtotal AS sub FROM pedido_items WHERE pedido_id=?',[p.id]),historial:await rows(pool,'SELECT estado_codigo,creado_en,nota FROM historial_pedido WHERE pedido_id=? ORDER BY id',[p.id]),simulado:!!(await rows(pool,'SELECT id FROM pagos WHERE pedido_id=? AND es_simulado=1',[p.id])).length};}
module.exports={create,list,get};
