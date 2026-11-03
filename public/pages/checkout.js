(async()=>{await Ready;

    const form = $('#form-checkout'), btn = $('#btn-finalizar');
    const ALERTA = '<svg class="h-5 w-5 flex-none" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17v.5"/></svg>';
    const OKI = '<svg class="pointer-events-none absolute right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2" fill="none" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

    /* ----- Campos: [id, etiqueta, type, autocomplete, ayuda, inputmode, maxlength, ancho completo] ----- */
    const SECC = [
      ['1. Contacto y datos personales', [
        ['nombre', 'Nombre', 'text', 'given-name', '', '', 60],
        ['apellido', 'Apellido', 'text', 'family-name', '', '', 60],
        ['email', 'Correo electrónico', 'email', 'email', 'Ejemplo: nombre@correo.com', '', 254, 1]]],
      ['2. Dirección de entrega', [
        ['direccion', 'Dirección (calle, número, ciudad)', 'text', 'street-address', 'Incluye calle, número y ciudad. Máximo 120 caracteres.', '', 120, 1],
        ['telefono', 'Celular', 'tel', 'tel-national', 'Escribe 9 dígitos, empezando por 9. No incluyas el 0 inicial. Ejemplo: 991234567.', 'numeric', 9, 1]]]
    ];
    $('#secciones').innerHTML = SECC.map(([t, cs], si) => `
      <fieldset class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend class="mb-4 text-lg font-semibold uppercase tracking-wide">${t}${CHECK.replace('<svg class="h-5 w-5 flex-none"', `<svg id="secok-${si}" class="ml-2 hidden h-5 w-5 flex-none align-middle"`)}</legend>
        ${cs.map(([id, et, tipo, ac, ayuda = '', im = '', ml = '', full]) => `
        <div class="${full ? 'sm:col-span-2' : ''}">
          <label for="${id}" class="mb-1 block text-sm font-medium">${et}</label>
          <div class="relative">${id==='telefono'?'<span class="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">+593</span>':''}
            <input type="${tipo}" id="${id}" name="${id}" autocomplete="${ac}" required aria-describedby="ayuda-${id} error-${id}" ${im ? `inputmode="${im}"` : ''} ${ml ? `maxlength="${ml}"` : ''} class="w-full border border-black bg-white px-4 py-3 pr-11 ${id==='telefono'?'pl-20':''}">
            ${OKI.replace('<svg ', `<svg id="ok-${id}" `)}
          </div>
          <p id="ayuda-${id}" class="mt-1 text-xs ${ayuda ? '' : 'hidden'}">${ayuda}</p>
          <p id="error-${id}" class="mt-1 hidden items-center gap-2 text-sm font-medium text-red-600"></p>
        </div>`).join('')}
      </fieldset>`).join('');

    const campos = {};
    SECC.forEach(([, cs]) => cs.forEach(c => campos[c[0]] = $('#' + c[0])));
    campos.telefono.setAttribute('aria-label','Celular de Ecuador, código +593');

    /* ----- Resumen calculado por el modelo del servidor ----- */
    function pintarPedido() {
      const items = Cart.list(), vacia = !items.length;
      $('#items').innerHTML = vacia ? '<li class="text-sm">Tu bolsa está vacía.</li>' : items.map(it => {
        const p = prod(it.id) || {nombre:it.nombre,precio:it.precio,id:it.id};
        return `<li class="flex items-center gap-4">
          <img src="${foto(p.id, 1, 150, 200)}" alt="" width="75" height="100" class="h-24 w-[72px] object-cover">
          <div class="flex-1"><p class="font-medium">${escapa(p.nombre)}</p>
            <p class="mt-1 text-sm">Talla: <span class="font-semibold">${escapa(it.talla)}</span></p>
            <p class="mt-1 text-sm">Cantidad: ${it.cant}</p></div>
          <p class="font-semibold">${money(it.precio * it.cant)}</p></li>`;
      }).join('');
      $('#r-subtotal').textContent = money(Cart.subtotal());
      $('#r-envio').innerHTML = vacia ? '—' : Cart.envio() === 0
        ? `<span class="mr-2 text-black/60 line-through"><span class="sr-only">Antes: </span>${money(ENVIO)}</span><span class="font-semibold">Gratis</span>`
        : money(ENVIO);
      $('#r-total').textContent = money(Cart.total());
      const reg = Store.get('registrado', false), u = Store.get('usuario', null);
      $('#caja-registro').innerHTML = vacia ? '' : reg
        ? `<p class="flex items-center gap-2 text-sm font-medium text-green-700">${CHECK}<span>Envío gratis por tu cuenta${u ? ', ' + escapa(u.nombre.split(' ')[0]) : ''}</span></p>`
        : `<div class="border border-black p-3 text-sm"><p>El envío cuesta ${money(ENVIO)}. Si creas tu cuenta gratis, no pagas envío.</p><button type="button" data-registro class="mt-2 w-full border border-black bg-white px-4 py-2 font-medium transition-colors hover:bg-black hover:text-white">Crear cuenta gratis</button></div>`;
      if (reg && u) precargar(u);
      btn.setAttribute('aria-disabled', vacia);
      btn.classList.toggle('bg-black', !vacia);
      btn.classList.toggle('hover:bg-black/85', !vacia);
      btn.classList.toggle('bg-black/30', vacia);
      btn.classList.toggle('cursor-not-allowed', vacia);
      $('#aviso-vacio').classList.toggle('hidden', !vacia);
    }

    /* ----- Formato mientras escribe ----- */
    ['nombre', 'apellido'].forEach(n => campos[n].addEventListener('input', () => { campos[n].value = campos[n].value.replace(/[^\p{L}\s'’-]/gu, ''); }));
    campos.telefono.addEventListener('input',()=>{campos.telefono.value=campos.telefono.value.replace(/\D/g,'').slice(0,9);});

    /* ----- Reglas: devuelven el mensaje de error o '' ----- */
    const letras = (v, q) => !v.trim() ? `Escribe ${q}`
      : v.trim().length < 2 ? `Escribe al menos 2 caracteres para ${q}`
      : !/^[\p{L}][\p{L}\s'’-]*$/u.test(v.trim()) ? 'Usa solo letras, espacios, apóstrofes o guiones' : '';
    const reglas = {
      nombre:   v => letras(v, 'tu nombre'),
      apellido: v => letras(v, 'tu apellido'),
      email: v => !v.trim() ? 'Escribe tu correo electrónico'
        : !window.emailValido(v) ? 'Escribe un correo válido con un nombre y dominio correctos, por ejemplo nombre@correo.com' : '',
      direccion: v => {
        const direccion = v.trim();
        if (!direccion) return 'Escribe tu dirección de entrega (calle, número y ciudad)';
        if (direccion.length < 8 || (direccion.match(/\p{L}/gu) || []).length < 3) return 'Incluye el nombre de la calle y la ciudad';
        if (!/^[\p{L}\p{N}\s.,#'’/-]+$/u.test(direccion)) return 'La dirección contiene caracteres no válidos';
        if (/\d{7,}/.test(direccion) || (direccion.match(/\d/g) || []).length > 12) return 'Revisa el número de calle y la dirección ingresada';
        return '';
      },
      telefono: v => Reglas.phoneError(v)
    };

    function mostrarError(n, msg) {
      const e = $('#error-' + n);
      e.innerHTML = ALERTA + '<span>' + msg + '</span>';
      e.classList.remove('hidden'); e.classList.add('flex');
      $('#ok-' + n).classList.add('hidden');
      campos[n].setAttribute('aria-invalid', 'true');
      campos[n].classList.remove('border-black', 'border-green-700');
      campos[n].classList.add('border-red-600', 'border-2');
    }
    function limpiarError(n, ok) {
      const e = $('#error-' + n);
      e.textContent = ''; e.classList.add('hidden'); e.classList.remove('flex');
      $('#ok-' + n).classList.toggle('hidden', !ok);
      campos[n].removeAttribute('aria-invalid');
      campos[n].classList.remove('border-red-600', 'border-2', 'border-black', 'border-green-700');
      campos[n].classList.add(...(ok ? ['border-green-700', 'border-2'] : ['border-black']));
    }
    // Devuelve true si el campo es válido y actualiza error/check
    function validar(n) {
      const msg = reglas[n](campos[n].value);
      msg ? mostrarError(n, msg) : limpiarError(n, true);
      progreso();
      return !msg;
    }
    Object.keys(campos).forEach(n => {
      // Al salir del campo: valida solo si el usuario escribió algo
      campos[n].addEventListener('blur', () => { if (campos[n].value.trim()) validar(n); });
      // Al corregir, el error desaparece en cuanto el valor es válido
      campos[n].addEventListener('input', () => {
        if (campos[n].getAttribute('aria-invalid') === 'true' && !reglas[n](campos[n].value)) limpiarError(n, true);
        else {
          $('#ok-' + n).classList.add('hidden');
          if (campos[n].getAttribute('aria-invalid') !== 'true') { campos[n].classList.remove('border-green-700', 'border-2'); campos[n].classList.add('border-black'); }
        }
        progreso();
      });
    });

    /* ----- Envío ----- */
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const res = $('#errores-resumen');res.tabIndex=-1;
      if (!Cart.count()) { $('#aviso-vacio').classList.remove('hidden'); return; }
      const malos = Object.keys(campos).filter(n => !validar(n));
      if (malos.length) {
        res.textContent = `Revisa ${malos.length} ${malos.length === 1 ? 'campo marcado' : 'campos marcados'} antes de continuar.`;
        res.classList.remove('hidden');
        campos[malos[0]].focus();
        return;
      }
      if (btn.dataset.enviando) return;
      btn.dataset.enviando = '1';
      res.classList.add('hidden');
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Procesando tu pedido…';
      $('#estado').textContent = 'Procesando tu pedido, no cierres esta página.';
      try {
        let claveIdempotencia=sessionStorage.getItem('elive_intento');
        if(!claveIdempotencia){claveIdempotencia=crypto.randomUUID();sessionStorage.setItem('elive_intento',claveIdempotencia);}
        const payload={claveIdempotencia};
        for(const key of ['nombre','apellido','email','direccion','telefono'])payload[key]=campos[key].value.trim();
        payload.telefono='+593'+payload.telefono;
        const pedido=await api('/orders','POST',payload);
        sessionStorage.removeItem('elive_intento');
        location.href='confirmacion.html?numero='+encodeURIComponent(pedido.numero);
      }catch(error){
        res.textContent=error.message;res.classList.remove('hidden');
        for(const [key,msg] of Object.entries(error.fields||{}))if(campos[key])mostrarError(key,msg);
        const first=Object.keys(error.fields||{}).find(k=>campos[k]);if(first)campos[first].focus();else res.focus();
        $('#estado').textContent='No pudimos confirmar el envío. Tus datos siguen aquí; vuelve a intentarlo.';
        delete btn.dataset.enviando;btn.textContent='Enviar pedido';btn.setAttribute('aria-disabled','false');
      }

    });

    // Cuenta campos correctos: marca cada sección completa y avisa cuando todo está listo
    function progreso() {
      const ids = Object.keys(campos);
      const ok = ids.filter(n => campos[n].value.trim() && !reglas[n](campos[n].value));
      SECC.forEach(([, cs], i) => $('#secok-' + i).classList.toggle('hidden', !cs.every(c => ok.includes(c[0]))));
      $('#progreso').innerHTML = ok.length === ids.length
        ? `${CHECK}<span class="text-green-700">¡Todo listo! Ya puedes enviar tu pedido.</span>`
        : `<span>Campos completos: ${ok.length} de ${ids.length}</span>`;
    }
    // Si ya tiene cuenta, rellena nombre, apellido y correo
    function precargar(u) {
      [['nombre', u.nombre], ['apellido', u.apellido], ['email', u.email]].forEach(([n, v]) => {
        if (v && !campos[n].value) { campos[n].value = v; validar(n); }
      });
    }

    document.addEventListener('elive:change', pintarPedido);
    progreso();
    pintarPedido();

})().catch(showFailure);
