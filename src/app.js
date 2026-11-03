const express=require('express');const path=require('node:path');const {pool}=require('./config/database');
const app=express();app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('X-Frame-Options','DENY');res.set('Referrer-Policy','same-origin');if(req.path.startsWith('/api'))res.set('Cache-Control','no-store');next();});
app.use('/api',(req,res,next)=>{if(!['GET','HEAD'].includes(req.method)){
 if(req.headers['x-elive-request']!=='1'||(req.headers.origin&&req.headers.origin!==process.env.APP_ORIGIN))return res.status(403).json({error:{message:'Solicitud no autorizada. Abre la tienda desde su dirección local.'}});
 if(!req.is('application/json'))return res.status(415).json({error:{message:'Se requiere JSON.'}});
}next();});
app.use(express.json({limit:'12kb'}));
app.get('/api/health',async(req,res)=>{try{await pool.query('SELECT id FROM configuracion_tienda WHERE id=1');res.json({database:'connected'});}catch{res.status(503).json({error:{message:'No se pudo conectar con la base. Revisa la configuración local.'}});}});
app.use('/api',require('./routes/api'));
app.use('/api',(req,res)=>res.status(404).json({error:{message:'Ruta no encontrada.'}}));
app.use(express.static(path.join(__dirname,'../public')));
app.use((error,req,res,next)=>{const status=error.status||503;res.status(status).json({error:{message:error.status?error.message:'No pudimos completar la operación. Inténtalo de nuevo.',fields:error.fields||{}}});if(!error.status)console.error('Error del servicio:',error.code||error.name);});
module.exports=app;
