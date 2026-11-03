(async()=>{await Ready;

    const lista = $('#lista'), btnPago = $('#btn-pago');
    const BASURA = '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

    function render() {
      const foco = document.activeElement && document.activeElement.id;
      const items = Cart.list(), n = Cart.count(), reg = Store.get('registrado', false);

      $('#contador').textContent = `(${n} ${n === 1 ? 'artículo' : 'artículos'})`;
      $('#vacio').classList.toggle('hidden', items.length > 0);
      $('#seguir').classList.toggle('hidden', !items.length);

      lista.innerHTML = items.map((it, i) => {
        const p = prod(it.id) || {id:it.id,nombre:it.nombre,precio:it.precio}, url = `producto.html?id=${p.id}`;
        return `
        <li class="flex gap-4 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:gap-6 sm:p-6">
          <a href="${url}" class="flex-none" tabindex="-1" aria-hidden="true"><img src="${foto(p.id, 1, 300, 400)}" alt="" width="300" height="400" class="h-32 w-24 object-cover sm:h-40 sm:w-[7.5rem]"></a>
          <div class="flex min-w-0 flex-1 flex-col justify-between gap-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-medium"><a href="${url}" class="underline-offset-4 hover:underline">${escapa(p.nombre)}</a></h3>
                <p class="mt-1 text-sm">Talla: <span class="font-semibold">${escapa(it.talla)}</span></p>
              </div>
              <button type="button" id="del-${i}" data-del="${i}" aria-label="Eliminar ${escapa(p.nombre)}, talla ${escapa(it.talla)}, de la bolsa" class="-mr-2 -mt-2 p-2">${BASURA}</button>
            </div>
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <label for="cant-${i}" class="mb-1 block text-sm">Cantidad</label>
                <select id="cant-${i}" data-cant="${i}" class="border border-black bg-white px-3 py-2">
                  ${Array.from({ length: 10 }, (_, k) => k + 1).map(v => `<option value="${v}" ${v === it.cant ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
              </div>
              <p class="text-lg font-semibold">${money(it.precio * it.cant)}</p>
            </div>
          </div>
        </li>`;
      }).join('');

      // Resumen
      $('#subtotal').textContent = money(Cart.subtotal());
      $('#envio').innerHTML = !items.length ? '—'
        : reg ? `<span class="mr-2 text-black/60 line-through"><span class="sr-only">Antes: </span>${money(ENVIO)}</span><span class="font-semibold">Gratis</span>`
        : money(ENVIO);
      $('#total').textContent = money(Cart.total());
      $('#aviso-registro').classList.toggle('hidden', reg || !items.length);
      $('#envio-ok').classList.toggle('hidden', !(reg && items.length));
      $('#envio-ok').classList.toggle('flex', !!(reg && items.length));

      // Botón de pago: deshabilitado si la bolsa está vacía, con explicación visible
      const vacia = !items.length;
      btnPago.setAttribute('aria-disabled', vacia);
      btnPago.classList.toggle('bg-black', !vacia);
      btnPago.classList.toggle('hover:bg-black/85', !vacia);
      btnPago.classList.toggle('bg-black/30', vacia);
      btnPago.classList.toggle('cursor-not-allowed', vacia);
      $('#ayuda-pago').classList.toggle('hidden', !vacia);

      // Conserva el foco tras repintar; si el elemento ya no existe, va al título
      const mismo = foco && document.getElementById(foco);
      (mismo || (foco ? $('#h1') : null))?.focus();
    }

    lista.addEventListener('click', e => {
      const d = e.target.closest('[data-del]');
      if (d) Cart.remove(+d.dataset.del).catch(e=>Aviso(e.message));
    });
    lista.addEventListener('change', e => {
      const s = e.target.closest('[data-cant]');
      if (s) Cart.setCant(+s.dataset.cant, +s.value).catch(e=>{Aviso(e.message);render();});
    });
    btnPago.addEventListener('click', e => {
      if (btnPago.getAttribute('aria-disabled') === 'true') e.preventDefault();
    });

    document.addEventListener('elive:change', render);
    render();

})().catch(showFailure);
