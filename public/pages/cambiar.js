(async()=>{
  await Ready;
  const source=Number(new URLSearchParams(location.search).get('linea'));
  const item=Cart.list().find(row=>row.varianteId===source);
  const form=$('#cambio'), garment=$('#prenda'), size=$('#talla');
  if(!item){form.textContent='Esta prenda ya no está en tu bolsa.';return;}
  $('#actual').textContent='En tu bolsa: '+item.nombre+', talla '+item.talla+'. Se conservará la cantidad: '+item.cant+'.';
  for(const product of PRODUCTOS)garment.add(new Option(product.nombre,product.id));
  garment.value=item.id;
  function options(){
    const product=prod(garment.value);
    size.replaceChildren();
    for(const variant of product.variantes){
      const option=new Option(variant.talla,variant.id);
      option.disabled=variant.stock<item.cant;
      size.add(option);
    }
    const available=[...size.options].find(o=>!o.disabled);
    size.value=available?.value||'';
    $('#precio').textContent='Precio por unidad: '+money(product.precio)+'. Total de esta prenda: '+money(product.precio*item.cant)+'.';
    $('button',form).disabled=!available;
    $('#error').textContent=available?'':'Sin tallas disponibles para esta cantidad.';
  }
  garment.onchange=options;
  options();size.value=source;
  form.onsubmit=async event=>{
    event.preventDefault();const button=$('button',form);button.disabled=true;
    try{await api('/cart/'+source+'/variante/'+size.value,'PUT',{});location.href='carrito.html';}
    catch(error){$('#error').textContent=error.message;button.disabled=false;}
  };
})().catch(showFailure);
