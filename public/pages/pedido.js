(async()=>{
 await Ready;mountHeader();$('#sim').remove();
 const orders=await api('/orders');let number=new URLSearchParams(location.search).get('numero');
 if(!number&&orders.length)number=orders[0].numero;
 if(!number){$('#nada').classList.remove('hidden');return;}
 const ped=await api('/orders/'+encodeURIComponent(number));
 $('#ok').classList.remove('hidden');$('#num').textContent=ped.numero;
 if(orders.length>1){const nav=document.createElement('nav');nav.setAttribute('aria-label','Mis pedidos');nav.className='mt-6 flex flex-col gap-2';for(const order of orders){const a=document.createElement('a');a.className='underline text-sm';a.href='pedido.html?numero='+encodeURIComponent(order.numero);a.textContent=order.numero+' — '+money(Number(order.total));nav.append(a);}$('#ok').append(nav);}
 const steps=[['recibido','Pedido recibido'],['pago_confirmado','Pago confirmado'],['preparando','Preparando tu pedido'],['en_camino','En camino'],['entregado','Entregado']];
 if(ped.estado==='cancelado')steps.push(['cancelado','Cancelado']);
 $('#actual').textContent='Estado actual: '+(steps.find(s=>s[0]===ped.estado)?.[1]||ped.estado)+(ped.estado==='recibido'?' · Pago pendiente.':'');
 $('#linea').innerHTML=steps.map(([code,label])=>{const history=ped.historial.find(h=>h.estado_codigo===code);return `<li class="border-l-2 border-black/20 pl-4 pb-5" ${code===ped.estado?'aria-current="step"':''}><p class="font-semibold">${escapa(label)} — ${history?'Completado':'Pendiente'}</p>${history?`<p class="text-sm">${escapa(new Date(history.creado_en.replace(' ','T')+'Z').toLocaleString('es-EC'))}</p>`:''}</li>`;}).join('');
 $('#items').innerHTML=ped.items.map(i=>`<li class="flex justify-between gap-4 py-3 text-sm"><span>${escapa(i.nombre)} · Talla ${escapa(i.talla)} · Cantidad ${i.cant}</span><span>${money(Number(i.sub))}</span></li>`).join('');
 $('#r-sub').textContent=money(ped.subtotal);$('#r-env').textContent=ped.envio?money(ped.envio):'Gratis';$('#r-tot').textContent=money(ped.total);
})().catch(showFailure);
