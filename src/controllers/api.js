const Session=require('../models/session');const Shop=require('../models/shop');const Order=require('../models/order');
const {validate,id,quantity,AppError}=require('../validation');
const cookie=(res,token)=>res.cookie('elive_session',token,{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',maxAge:30*86400000,path:'/'});
async function identity(req,res,next){try{const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('elive_session='))?.slice(14);req.session=await Session.lookup(token);if(!req.session){if(req.method!=='GET')throw new AppError(401,'Tu sesión venció. Recarga la página.');const created=await Session.create();req.session=created.session;cookie(res,created.token);}next();}catch(e){next(e);}}
module.exports={identity,
 bootstrap:async(req,res)=>res.json({products:await Shop.catalog(),...await Shop.state(req.session),paymentMode:process.env.PAYMENT_MODE}),
 state:async(req,res)=>res.json(await Shop.state(req.session)),
 register:async(req,res)=>{cookie(res,await Session.authenticate(req.session,validate(req.body,'register'),true));res.json({ok:true});},
 login:async(req,res)=>{cookie(res,await Session.authenticate(req.session,validate(req.body,'login'),false));res.json({ok:true});},
 logout:async(req,res)=>{await Session.logout(req.session);const created=await Session.create();cookie(res,created.token);res.json({ok:true});},
 cart:async(req,res)=>{const allowed=req.method==='DELETE'?[]:['cantidad'];if(Object.keys(req.body||{}).some(k=>!allowed.includes(k)))throw new AppError(400,'Campos no permitidos.');await Shop.mutateCart(req.session,id(req.params.id),req.method==='DELETE'?0:quantity(req.body.cantidad),req.method==='POST'?'add':req.method==='DELETE'?'delete':'set');res.json(await Shop.state(req.session));},
 favorite:async(req,res)=>{await Shop.favorite(req.session,id(req.params.id),req.method==='PUT');res.json(await Shop.state(req.session));},
 order:async(req,res)=>res.status(201).json({numero:await Order.create(req.session,validate(req.body,'order'))}),
 orders:async(req,res)=>res.json(await Order.list(req.session)),
 detail:async(req,res)=>res.json(await Order.get(req.session,req.params.numero))
};
