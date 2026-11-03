(async()=>{await Ready;

    mountHeader();

    function render() {
      $('#acceso-favoritos').classList.toggle('hidden',!!State.usuario);
      const items = Fav.list().map(prod).filter(Boolean);
      $('#conteo').textContent = `(${items.length} ${items.length === 1 ? 'prenda' : 'prendas'})`;
      $('#favs').innerHTML = items.map(card).join('');
      $('#vacio').classList.toggle('hidden', items.length > 0 || !State.usuario);
      $('#tip').classList.toggle('hidden', !items.length);
      $('#seguir').classList.toggle('hidden', !items.length);
      // Si la prenda quitada tenía el foco, lo devolvemos al título
      if (document.activeElement === document.body) $('#h1').focus();
    }
    document.addEventListener('elive:change', render);
    render();

})().catch(showFailure);
