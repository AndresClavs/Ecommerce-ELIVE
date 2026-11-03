const mysql = require('mysql2/promise');
const pool = mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'elive_ecommerce_mvc',ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:true}:undefined,connectionLimit:8,charset:'utf8mb4',timezone:'Z',dateStrings:true});
async function tx(fn) {
 for(let attempt=0;attempt<3;attempt++) {
  const c=await pool.getConnection();
  try {await c.query("SET SESSION sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");await c.beginTransaction();const value=await fn(c);await c.commit();return value;}
  catch(e){await c.rollback();if(!['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT','ER_CHECKREAD'].includes(e.code)||attempt===2)throw e;}
  finally{c.release();}
 }
}
const rows=async(c,sql,args=[]) => (await c.execute(sql,args))[0];
module.exports={pool,tx,rows};
