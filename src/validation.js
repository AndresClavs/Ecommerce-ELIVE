const {passwordError,phoneError}=require('../public/reglas');
class AppError extends Error {constructor(status,message,fields={}){super(message);this.status=status;this.fields=fields;}}
function emailValido(valor){const email=valor.trim(),partes=email.split('@');if(partes.length!==2)return false;const [local,dominio]=partes,etiquetas=dominio.split('.');return email.length<=254&&local.length<=64&&/[A-Za-z]/.test(local)&&/^[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*$/.test(local)&&etiquetas.length>=2&&etiquetas.every(e=>e.length>=1&&e.length<=63&&/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(e))&&/^[A-Za-z]{2,63}$/.test(etiquetas.at(-1));}
function validate(body,kind){
 const keys=kind==='register'?['nombre','email','clave']:kind==='login'?['email','clave']:['nombre','apellido','email','direccion','telefono','claveIdempotencia'];
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!keys.includes(k) && !(kind==='order' && k==='pagoSimulado' && body[k]==='tarjeta')))throw new AppError(400,'La solicitud contiene campos no permitidos.');
 const result={},fields={};for(const k of keys){if(typeof body[k]!=='string'){fields[k]='Completa este campo.';result[k]='';}else result[k]=k==='clave'?body[k]:body[k].trim();}
 for(const k of ['nombre','apellido'].filter(k=>keys.includes(k)))if(result[k].length<2||result[k].length>60||!/^\p{L}[\p{L}\s'’-]*$/u.test(result[k]))fields[k]='Usa entre 2 y 60 caracteres: letras, espacios, apóstrofes o guiones.';
 if(!emailValido(result.email))fields.email='Escribe un correo válido, por ejemplo nombre@correo.com.';
 result.email=result.email.toLowerCase();
 if(kind==='register'&&passwordError(result.clave))fields.clave=passwordError(result.clave);
 if(kind==='login'&&(!result.clave||result.clave.length>128))fields.clave='Escribe tu contraseña.';
 if(kind==='order'){
  result.pagoSimulado=body.pagoSimulado==='tarjeta';
  const d=result.direccion,t=result.telefono,n=t.replace(/\D/g,'');
  if(d.length<8||d.length>120||(d.match(/\p{L}/gu)||[]).length<3||!/^[\p{L}\p{N}\s.,#'’/-]+$/u.test(d)||/\d{7,}/.test(d)||(d.match(/\d/g)||[]).length>12)fields.direccion='Incluye calle, número y ciudad; entre 8 y 120 caracteres válidos.';
  if(!t.startsWith('+593')||phoneError(t.slice(4)))fields.telefono=phoneError(t.slice(4))||'El celular debe comenzar con +593.';
  if(!/^[A-Za-z0-9-]{16,64}$/.test(result.claveIdempotencia))fields.claveIdempotencia='Identificador de compra inválido. Recarga la página.';
 }
 if(Object.keys(fields).length)throw new AppError(422,'Revisa los campos marcados.',fields);return result;
}
function id(v){const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw new AppError(400,'Identificador inválido.');return n;}
function quantity(v){if(!Number.isInteger(v)||v<1||v>10)throw new AppError(422,'La cantidad debe estar entre 1 y 10.');return v;}
module.exports={AppError,validate,emailValido,id,quantity};
