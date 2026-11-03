const {randomBytes,createHash,scrypt,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const {pool,rows,tx}=require('../config/database');
const {AppError}=require('../validation');
const derive=promisify(scrypt), tokenHash=t=>createHash('sha256').update(t).digest();
const token=()=>randomBytes(32).toString('hex');
async function passwordHash(password){const salt=randomBytes(16).toString('hex');return `scrypt$${salt}$${(await derive(password,salt,64)).toString('hex')}`;}
async function passwordMatches(password,stored){const [type,salt,hash]=stored.split('$');if(type!=='scrypt'||!salt||!hash)return false;const actual=await derive(password,salt,64),expected=Buffer.from(hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
async function lookup(t){if(!/^[a-f0-9]{64}$/.test(t||''))return null;return (await rows(pool,`SELECT s.id,s.cliente_id,c.nombre,c.apellido,c.email FROM sesiones s LEFT JOIN clientes c ON c.id=s.cliente_id WHERE s.token_hash=? AND s.revocado_en IS NULL AND s.expira_en>UTC_TIMESTAMP() AND (s.cliente_id IS NULL OR c.activo=1)`,[tokenHash(t)]))[0]||null;}
async function create(){const t=token();const session=await tx(async c=>{const r=await rows(c,'INSERT INTO sesiones(token_hash,expira_en) VALUES(?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 DAY))',[tokenHash(t)]);await rows(c,'INSERT INTO carritos(sesion_id) VALUES(?)',[r.insertId]);return {id:r.insertId,cliente_id:null};});return {session,token:t};}
async function lock(c,session){const s=(await rows(c,`SELECT s.*,c.activo AS cliente_activo FROM sesiones s LEFT JOIN clientes c ON c.id=s.cliente_id WHERE s.id=? AND s.revocado_en IS NULL AND s.expira_en>UTC_TIMESTAMP() FOR UPDATE`,[session.id]))[0];if(!s||(s.cliente_id&&!s.cliente_activo))throw new AppError(401,'Tu sesión venció. Recarga la página.');return s;}
async function authenticate(session,data,register){
 const hash=register?await passwordHash(data.clave):null;
 return tx(async c=>{await lock(c,session);let customer;
 if(register){try{const r=await rows(c,'INSERT INTO clientes(nombre,email,password_hash) VALUES(?,?,?)',[data.nombre,data.email,hash]);customer={id:r.insertId};}catch(e){if(e.code==='ER_DUP_ENTRY')throw new AppError(409,'Este correo ya tiene cuenta. Inicia sesión.',{email:'Este correo ya está registrado.'});throw e;}}
 else {customer=(await rows(c,'SELECT * FROM clientes WHERE email=? AND activo=1',[data.email]))[0];if(!customer||!await passwordMatches(data.clave,customer.password_hash))throw new AppError(401,'Correo o contraseña incorrectos.');}
 const t=token();await rows(c,'UPDATE sesiones SET cliente_id=?,token_hash=? WHERE id=?',[customer.id,tokenHash(t),session.id]);return t;
 });
}
async function logout(session){await tx(async c=>{await lock(c,session);await rows(c,'UPDATE sesiones SET revocado_en=UTC_TIMESTAMP() WHERE id=?',[session.id]);});}
module.exports={lookup,create,authenticate,logout,lock,passwordHash,passwordMatches};
