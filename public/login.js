async function guardarFavoritoPendiente(){const id=sessionStorage.getItem('elive_favorito_pendiente');if(!id||!State.usuario)return;try{accept(await api('/favorites/'+Number(id),'PUT',{}));sessionStorage.removeItem('elive_favorito_pendiente');Aviso('Prenda guardada en tus favoritos.');}catch(e){Aviso(e.message);}}
const Login={abrir(message='Accede a tus favoritos y pedidos.'){
 const previous=document.activeElement;
 const modal=document.createElement('dialog');modal.className='w-full max-w-md bg-white p-8 backdrop:bg-black/60';
 modal.setAttribute('aria-labelledby','login-title');
 modal.innerHTML=`<button type="button" data-close class="float-right p-2" aria-label="Cerrar ventana">✕</button><h2 id="login-title" class="text-xl font-semibold">Iniciar sesión</h2><p class="mt-2 text-sm">${escapa(message)}</p><form class="mt-5 space-y-4" novalidate><p role="alert" class="text-red-600"></p><div><label for="login-email" class="block">Correo electrónico</label><input id="login-email" name="email" type="email" autocomplete="email" maxlength="254" required class="w-full border border-black px-4 py-3"></div><div><label for="login-clave" class="block">Contraseña</label><input id="login-clave" name="clave" type="password" autocomplete="current-password" maxlength="128" required class="w-full border border-black px-4 py-3"></div><label class="block"><input type="checkbox" data-show> Mostrar contraseña</label><button class="w-full bg-black p-3 text-white" type="submit">Entrar</button></form><p class="mt-4 text-sm">¿Aún no tienes cuenta? <button type="button" data-create class="underline">Crear cuenta</button></p>`;
 document.body.append(modal);document.body.classList.add('overflow-hidden');modal.showModal();$('#login-email').focus();
 modal.addEventListener('close',()=>{modal.remove();document.body.classList.remove('overflow-hidden');previous?.focus();});
 $('[data-close]',modal).onclick=()=>modal.close();
 $('[data-create]',modal).onclick=()=>{modal.close();Registro.abrir();};
 $('[data-show]',modal).onchange=e=>{$('#login-clave').type=e.target.checked?'text':'password';};
 modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
 $('form',modal).onsubmit=async e=>{e.preventDefault();const email=$('#login-email'),clave=$('#login-clave'),submit=$('button[type="submit"]',modal),alert=$('[role="alert"]',modal);if(submit.disabled)return;
  if(!emailValido(email.value)||!clave.value){alert.textContent='Revisa tu correo y contraseña.';(!emailValido(email.value)?email:clave).focus();return;}
  submit.disabled=true;
  try{await api('/auth/login','POST',{email:email.value,clave:clave.value});await refresh();await guardarFavoritoPendiente();modal.close();Aviso('Sesión iniciada.');}
  catch(error){alert.textContent=error.message;submit.disabled=false;email.focus();}
 };
}};
