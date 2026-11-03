const {test}=require('node:test');const assert=require('node:assert/strict');
const {passwordError,phoneError}=require('../public/reglas');const {validate}=require('../src/validation');
test('Celular Ecuador: nueve dígitos locales y +593 en API',()=>{
 assert.equal(phoneError('991234567'),'');
 for(const phone of ['0991234567','99123456','9912345678','891234567','999999999','abc123456'])assert.notEqual(phoneError(phone),'');
 const data={nombre:'Ana',apellido:'Pérez',email:'ana@example.com',direccion:'Av. Central 123 Quito',telefono:'+593991234567',claveIdempotencia:'intento-valido-0002'};
 assert.equal(validate(data,'order').telefono,'+593991234567');
 for(const phone of ['+51991234567','0991234567','+5930991234567','+593999999999'])assert.throws(()=>validate({...data,telefono:phone},'order'),e=>!!e.fields.telefono);
});
test('Contraseña con requisitos iguales en registro y servidor; acceso legado conservado',()=>{
 assert.equal(passwordError('Elive123!'),'');
 for(const password of ['Eliv1!','elive123!','ELIVE123!','Eliveabc!','Elive1234'])assert.notEqual(passwordError(password),'');
 assert.throws(()=>validate({nombre:'Ana',email:'ana@example.com',clave:'password'},'register'));
 assert.equal(validate({email:'ana@example.com',clave:'antigua'},'login').clave,'antigua');
});
