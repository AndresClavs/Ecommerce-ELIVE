// Reglas compartidas por las vistas y el servidor para mensajes consistentes.
(function(root){
 const passwordHelp='Usa al menos 8 caracteres, con una mayúscula, una minúscula, un número y un símbolo.';
 function passwordError(value){
  if(!value)return 'Crea una contraseña.';
  if(value.length>128)return 'Tu contraseña es demasiado larga. Usa hasta 128 caracteres.';
  return value.length>=8&&/[A-ZÁÉÍÓÚÑ]/.test(value)&&/[a-záéíóúñ]/.test(value)&&/\d/.test(value)&&/[^\p{L}\p{N}\s]/u.test(value)&&!/^\s|\s$/.test(value)?'':passwordHelp;
 }
 function phoneError(value){return /^9\d{8}$/.test(value)&&! /^(\d)\1{8}$/.test(value)?'':'Escribe 9 dígitos, empezando por 9. Ejemplo: 991234567. No incluyas el 0 inicial.';}
 const rules={passwordHelp,passwordError,phoneError};if(typeof module==='object')module.exports=rules;else root.Reglas=rules;
})(typeof window!=='undefined'?window:globalThis);
