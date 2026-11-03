(async()=>{await Ready;

    mountHeader();

    const p = prod(new URLSearchParams(location.search).get('id'));
    if(!p){document.querySelector('main').innerHTML='<h1 class="text-3xl">Producto no encontrado</h1><a class="underline" href="index.html#catalogo">Volver al catálogo</a>';return;}
    if(p.g==='ninos') document.querySelector('details').innerHTML='<summary class="cursor-pointer text-sm font-medium">Guía de tallas infantiles</summary><p class="mt-3">Tallas disponibles: 4, 6, 8 y 10. Consulta las medidas de la prenda antes de comprar.</p>';
    const TALLAS=p.variantes.map(v=>v.talla);
    const GEN = { mujeres: 'Mujeres', hombres: 'Hombres', ninos: 'Niños' };
    const N = 1;
    const OK = '<svg class="mr-1 inline h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
    const ALERTA = '<svg class="h-5 w-5 flex-none" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17v.5"/></svg>';
    let talla = null, ultimoFoco = null;

    document.title = `${escapa(p.nombre)} | ELIVE`;
    $('#p-nombre').textContent = p.nombre;
    $('#p-desc').textContent = p.desc;
    $('#p-precio').innerHTML = precioHtml(p);

    // Migas de pan
    $('#migas').innerHTML = [
      `<li><a href="index.html" class="underline-offset-4 hover:underline">Inicio</a></li>`,
      `<li><a href="${tienda({ g: p.g })}" class="underline-offset-4 hover:underline">${GEN[p.g]}</a></li>`,
      `<li><a href="${tienda({ g: p.g, c: p.c })}" class="underline-offset-4 hover:underline">${escapa(p.c)}</a></li>`,
      `<li aria-current="page" class="font-semibold">${escapa(p.nombre)}</li>`
    ].join('<li aria-hidden="true">/</li>');

    // Favorito
    const pf = $('#p-fav');
    pf.dataset.fav = p.id;
    pf.innerHTML = heartSvg('h-[18px] w-[18px]', false) + '<span>Guardar en favoritos</span>';
    syncHearts();

    // Galería: la imagen principal cambia al elegir una miniatura
    function verImagen(n) {
      const img = $('#img-principal');
      img.src = foto(p.id, n, 600, 800);
      img.alt = `${escapa(p.nombre)}, imagen ${n} de ${N}`;
      $$('#miniaturas button').forEach(b => {
        const on = +b.dataset.n === n;
        b.setAttribute('aria-current', on);
        b.classList.toggle('border-black', on);
        b.classList.toggle('border-transparent', !on);
      });
    }
    $('#miniaturas').innerHTML = Array.from({ length: N }, (_, i) => i + 1).map(n => `
      <li><button type="button" data-n="${n}" aria-label="Ver imagen ${n} de ${N}" aria-current="false" class="block w-full border-2 border-transparent">
        <img src="${foto(p.id, n, 150, 200)}" alt="" width="150" height="200" class="aspect-[3/4] w-full object-cover"></button></li>`).join('');
    $('#miniaturas').classList.toggle('hidden', N < 2);
    $('#miniaturas').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) verImagen(+b.dataset.n);
    });
    verImagen(1);

    // Tallas: la elegida muestra un check y se anuncia en texto
    $('#tallas').innerHTML = TALLAS.map(t => `<button type="button" data-talla="${t}" ${p.variantes.find(v=>v.talla===t).stock===0 ? 'disabled' : ''} aria-pressed="false" aria-label="Talla ${t}" class="border border-black bg-white py-3 text-center transition-colors hover:bg-black/5">${t}</button>`).join('');
    $('#tallas').addEventListener('click', e => {
      const b = e.target.closest('[data-talla]');
      if (!b) return;
      $$('#tallas button').forEach(x => {
        x.setAttribute('aria-pressed', 'false');
        x.classList.remove('bg-black', 'text-white');
        x.classList.add('bg-white');
        x.textContent = x.dataset.talla;
      });
      b.setAttribute('aria-pressed', 'true');
      b.classList.remove('bg-white');
      b.classList.add('bg-black', 'text-white');
      b.innerHTML = OK + b.dataset.talla;
      talla = b.dataset.talla;
      $('#talla-sel').innerHTML = `<span class="font-medium text-green-700">${OK}Talla seleccionada: <strong>${talla}</strong></span>`;
      $('#error-talla').textContent = '';
    });

    // Añadir a la bolsa con validación
    $('#btn-anadir').addEventListener('click', async () => {
      if (!talla) {
        $('#error-talla').innerHTML = ALERTA + '<span>Por favor, selecciona una talla</span>';
        $('#tallas button').focus();
        return;
      }
      const btn=$('#btn-anadir');btn.disabled=true;
      try{await Cart.add(p.id,talla);abrirModal();}catch(e){$('#error-talla').textContent=e.message;}finally{btn.disabled=false;}
    });

    // Modal
    const modal = $('#modal');
    function abrirModal() {
      ultimoFoco = document.activeElement;
      $('#modal-img').src = foto(p.id, 1, 150, 200);
      $('#modal-nombre').textContent = p.nombre;
      $('#modal-talla').textContent = talla;
      $('#modal-precio').textContent = money(p.precio);
      const n = Cart.count();
      $('#modal-total').textContent = `En tu bolsa: ${n} ${n === 1 ? 'artículo' : 'artículos'}`;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
      $('#modal-registro').classList.toggle('hidden', Store.get('registrado', false));
      $('a[href="carrito.html"]', modal).focus();
    }
    function cerrarModal() {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');
      if (ultimoFoco) ultimoFoco.focus();
    }
    $('#modal-cerrar').addEventListener('click', cerrarModal);
    $('#modal-seguir').addEventListener('click', cerrarModal);
    modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

    // El artículo ya está en la bolsa; tras registrarse, continúa al checkout sin volver a añadirlo.
    $('#modal-registro').addEventListener('click', () => { cerrarModal(); Registro.abrir({ redirectTo: 'checkout.html' }); });

    document.addEventListener('keydown', e => {
      if (modal.classList.contains('hidden')) return;
      if (e.key === 'Escape') { cerrarModal(); return; }
      if (e.key === 'Tab') {
        const f = $$('button, a[href]', modal).filter(x=>x.getClientRects().length&&!x.disabled), a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });

})().catch(showFailure);
