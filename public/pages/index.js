(async()=>{await Ready;

    mountHeader();

    // Filtros que llegan desde el menú: ?g=mujer&c=Vestidos&s=hombre&q=texto
    const url = new URLSearchParams(location.search);
    const g = url.get('g'), c = url.get('c'), s = url.get('s');
    const qRaw = (url.get('q') || '').trim(), qq = qRaw.toLowerCase();
    const NOMBRES = { mujeres: 'Mujeres', hombres: 'Hombres', ninos: 'Niños', nuevos: 'Nuevos', ofertas: 'Ofertas' };
    const ORDEN = { menor: 'de menor a mayor precio', mayor: 'de mayor a menor precio' };

    const base = PRODUCTOS.filter(p =>
      (!g || (g === 'nuevos' ? p.nuevo : g === 'ofertas' ? p.antes : p.g === g)) &&
      (!s || p.g === s) && (!c || p.c === c) &&
      (!qq || (p.nombre + ' ' + p.c).toLowerCase().includes(qq)));

    const filtrado = g || c || s || qq;
    $('#catalogo-titulo').textContent = qq
      ? `Resultados para “${qRaw}”`
      : filtrado ? [NOMBRES[g], s && NOMBRES[s], c].filter(Boolean).join(' / ') : 'Lo nuevo en Elive';
    $('#ver-todo').classList.toggle('hidden', !filtrado);
    $('#sin-resultados').classList.toggle('hidden', base.length > 0);

    function pintar() {
      const o = $('#orden').value;
      const lista = [...base];
      if (o === 'menor') lista.sort((a, b) => a.precio - b.precio);
      if (o === 'mayor') lista.sort((a, b) => b.precio - a.precio);
      $('#conteo').textContent = `${lista.length} ${lista.length === 1 ? 'prenda' : 'prendas'}` + (o ? `, ordenadas ${ORDEN[o]}` : '');
      $('#productos').innerHTML = lista.map(card).join('');
    }
    $('#orden').addEventListener('change', pintar);
    pintar();

})().catch(showFailure);
