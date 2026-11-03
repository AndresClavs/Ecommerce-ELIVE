(async()=>{
 await Ready;mountHeader();$('#sim').remove();
 const number=new URLSearchParams(location.search).get('numero');
 if(!number){
   const orders=await api('/orders');
   if(!orders.length){$('#nada').classList.remove('hidden');return;}
   const estados={recibido:'Recibido',pago_confirmado:'Pago confirmado',preparando:'En preparación',en_camino:'En camino',entregado:'Entregado',cancelado:'Cancelado'};
   $('#compras').innerHTML=orders.map(order=>{
     const fecha=new Date(order.creado_en.replace(' ','T')+'Z').toLocaleDateString('es-EC',{day:'numeric',month:'long',year:'numeric'});
     return `<li class="border border-black/10 bg-white p-5"><div class="flex flex-wrap items-center justify-between gap-3"><h2 class="text-lg font-semibold">Compra del ${escapa(fecha)}</h2><span class="rounded-full bg-black/5 px-3 py-1 text-sm">${escapa(estados[order.estado_codigo]||order.estado_codigo)}</span></div><p class="mt-2 text-sm">Referencia · ${escapa(order.numero.slice(-8).toUpperCase())}</p><div class="mt-4 flex flex-wrap items-center justify-between gap-3"><strong>Total ${money(Number(order.total))}</strong><a class="bg-black px-4 py-2 text-sm text-white" href="pedido.html?numero=${encodeURIComponent(order.numero)}" aria-label="Ver seguimiento del pedido ${escapa(order.numero.slice(-8))}">Ver seguimiento</a></div></li>`;
   }).join('');
   $('#historial').classList.remove('hidden');return;
 }
 const ped=await api('/orders/'+encodeURIComponent(number));
 $('#ok').classList.remove('hidden');$('#num').textContent=ped.numero;
 const steps=[['recibido','Pedido recibido'],['pago_confirmado','Pago confirmado'],['preparando','Preparando tu pedido'],['en_camino','En camino'],['entregado','Entregado']];
 if(ped.estado==='cancelado')steps.push(['cancelado','Cancelado']);
 $('#actual').textContent='Estado actual: '+(steps.find(s=>s[0]===ped.estado)?.[1]||ped.estado)+(ped.simulado?' Â· Pago simulado completado, sin cobro.':ped.estado==='recibido'?' Â· Pago pendiente.':'');
 $('#linea').innerHTML=steps.map(([code,label])=>{const history=ped.historial.find(h=>h.estado_codigo===code);return `<li class="border-l-2 border-black/20 pl-4 pb-5" ${code===ped.estado?'aria-current="step"':''}><p class="font-semibold">${escapa(label)} â€” ${history?'Completado':'Pendiente'}</p>${history?`<p class="text-sm">${escapa(new Date(history.creado_en.replace(' ','T')+'Z').toLocaleString('es-EC'))}</p>`:''}</li>`;}).join('');
 $('#items').innerHTML=ped.items.map(i=>`<li class="flex justify-between gap-4 py-3 text-sm"><span>${escapa(i.nombre)} Â· Talla ${escapa(i.talla)} Â· Cantidad ${i.cant}</span><span>${money(Number(i.sub))}</span></li>`).join('');
 $('#r-sub').textContent=money(ped.subtotal);$('#r-env').textContent=ped.envio?money(ped.envio):'Gratis';$('#r-tot').textContent=money(ped.total);
})().catch(showFailure);
