const app=require('./src/app');const {pool}=require('./src/config/database');
const server=app.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log(`ELIVE: ${process.env.APP_ORIGIN||'http://localhost:3000'}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await pool.end();process.exit(0);}));
