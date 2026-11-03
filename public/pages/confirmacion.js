(async()=>{
 await Ready;
 const number=new URLSearchParams(location.search).get('numero');
 if(!number){$('#nada').classList.remove('hidden');return;}
 const ped=await api('/orders/'+encodeURIComponent(number));
 const pago=ped.simulado?'Pago simulado completado. No se ha realizado ningún cobro.':'Pago pendiente. No se ha realizado ningún cobro.';
 $('#pago-info').textContent=pago;
 $('#ok').classList.remove('hidden');$('#num').textContent=ped.numero;$('#mail').textContent=ped.email;
 $('#items').innerHTML=ped.items.map(i=>`<li class="flex justify-between gap-4 py-3 text-sm"><span>${escapa(i.nombre)} · Talla ${escapa(i.talla)} · Cantidad ${i.cant}</span><span>${money(Number(i.sub))}</span></li>`).join('');
 $('#r-sub').textContent=money(ped.subtotal);$('#r-env').textContent=ped.envio?money(ped.envio):'Gratis';$('#r-tot').textContent=money(ped.total);
 $('a[href="pedido.html"]').href='pedido.html?numero='+encodeURIComponent(ped.numero);
 const body=`Pedido ${ped.numero} de ELIVE. Pedido recibido. ${pago}\n`+ped.items.map(i=>`${i.nombre}, talla ${i.talla}, cantidad ${i.cant}: ${money(Number(i.sub))}`).join('\n')+`\nEnvío: ${money(ped.envio)}\nTotal: ${money(ped.total)}`;
 $('#btn-correo').textContent='Abrir resumen en mi aplicación de correo';
 $('#btn-correo').href=`mailto:${encodeURIComponent(ped.email)}?subject=${encodeURIComponent('Pedido '+ped.numero)}&body=${encodeURIComponent(body)}`;
 $('#h1').focus();
})().catch(showFailure);
