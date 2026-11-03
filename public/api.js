// Memoria de la vista; los datos y la sesión autoritativos viven en el servidor.
const State={products:[],usuario:null,fav:[],cart:{items:[],subtotal:0,envio:0,total:0,config:{costo_envio:4.99}}};
async function api(path,method='GET',body){
 const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Elive-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json();if(!response.ok){const error=new Error(data.error?.message||'No pudimos completar la operación.');error.fields=data.error?.fields||{};throw error;}return data;
}
function accept(data){Object.assign(State,data);if(typeof PRODUCTOS!=='undefined'&&data.products)PRODUCTOS.splice(0,PRODUCTOS.length,...data.products);if(typeof ENVIO!=='undefined')ENVIO=Number(State.cart.config.costo_envio);document.dispatchEvent(new Event('elive:change'));}
async function refresh(){accept(await api('/state'));}
function showFailure(error){let box=document.getElementById('error-conexion');if(!box){box=document.createElement('div');box.id='error-conexion';box.setAttribute('role','alert');box.className='m-4 border border-red-600 bg-white p-4';document.querySelector('main').prepend(box);}box.replaceChildren(document.createTextNode(error.message+' '));const button=document.createElement('button');button.textContent='Reintentar';button.className='underline';button.onclick=()=>location.reload();box.append(button);box.tabIndex=-1;box.focus();}
// Inicio se ejecuta después de que se hayan definido los componentes compartidos.
const Ready=new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})).then(async()=>{accept(await api('/bootstrap'));});
Ready.catch(showFailure);
