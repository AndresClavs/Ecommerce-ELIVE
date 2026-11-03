(async()=>{
  await Ready;
  const source=Number(new URLSearchParams(location.search).get('linea'));
  const original=Cart.list().find(item=>item.varianteId===source);
  if(!original){location.replace('carrito.html');return;}
  $('#actual').textContent='Elige el reemplazo de '+original.nombre+' (talla '+original.talla+'). En la ficha podrás ver las tallas y confirmar el cambio.';
  $('#opciones').innerHTML=PRODUCTOS.filter(p=>p.variantes.some(v=>v.stock>=original.cant)).map(p=>card(p,{linea:source})).join('');
})().catch(showFailure);
