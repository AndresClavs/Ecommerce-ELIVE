const {test}=require('node:test');const assert=require('node:assert/strict');
const {validate,emailValido,quantity}=require('../src/validation');
const {passwordHash,passwordMatches}=require('../src/models/session');
test('Restricciones de nombres, correo, teléfono, dirección y contraseña',()=>{
 const valid={nombre:'María-José',apellido:"O’Connor",email:'maria@example.com',direccion:'Av. Central 123, Quito',telefono:'+593991234567',claveIdempotencia:'intento-valido-0001'};
 assert.equal(validate(valid,'order').nombre,'María-José');
 for(const [key,value] of [['nombre','A'],['apellido','123'],['email','123@example.com'],['telefono','999999999'],['direccion','123456789 Quito']])assert.throws(()=>validate({...valid,[key]:value},'order'),e=>!!e.fields[key]);
 assert.throws(()=>validate({...valid,tarjeta:'4242424242424242'},'order'));
 assert.throws(()=>quantity(11));assert.throws(()=>quantity(0));assert.throws(()=>quantity(1.5));
 assert.equal(emailValido('ana..perez@example.com'),false);
});
test('Hash sin truncamiento de contraseñas largas',async()=>{const password='á'.repeat(100),hash=await passwordHash(password);assert(!hash.includes(password));assert(await passwordMatches(password,hash));assert(!await passwordMatches(password+'x',hash));});
