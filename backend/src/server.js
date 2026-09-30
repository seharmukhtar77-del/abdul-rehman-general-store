import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();
const app=express();
app.use(cors({origin:true,credentials:true}));
app.use(express.json());

const productSchema=new mongoose.Schema({name:{type:String,required:true},category:String,purchasePrice:{type:Number,default:0},sellingPrice:{type:Number,default:0},stockQuantity:{type:Number,default:0},reorderLevel:{type:Number,default:5},preferredReorderQty:{type:Number,default:10},unit:{type:String,default:'Piece'}},{timestamps:true});
const customerSchema=new mongoose.Schema({name:{type:String,required:true},phone:String,address:String,creditLimit:{type:Number,default:0}},{timestamps:true});
const supplierSchema=new mongoose.Schema({name:{type:String,required:true},phone:String,address:String},{timestamps:true});
const saleSchema=new mongoose.Schema({invoiceNo:{type:String,unique:true},customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer',default:null},items:[{productId:{type:mongoose.Schema.Types.ObjectId,ref:'Product'},quantity:Number,unitPrice:Number,total:Number}],total:Number,amountPaid:{type:Number,default:0},paymentMethod:{type:String,default:'Cash'}},{timestamps:true});
const purchaseSchema=new mongoose.Schema({invoiceNo:{type:String,unique:true},supplierId:{type:mongoose.Schema.Types.ObjectId,ref:'Supplier',default:null},items:[{productId:{type:mongoose.Schema.Types.ObjectId,ref:'Product'},quantity:Number,unitCost:Number,total:Number}],total:Number,amountPaid:{type:Number,default:0}},{timestamps:true});
const paymentSchema=new mongoose.Schema({customerId:{type:mongoose.Schema.Types.ObjectId,ref:'Customer'},amount:Number,note:String},{timestamps:true});
const expenseSchema=new mongoose.Schema({title:{type:String,required:true},category:String,amount:Number,note:String},{timestamps:true});
const userSchema=new mongoose.Schema({email:{type:String,unique:true},passwordHash:String,name:String});
const Product=mongoose.model('Product',productSchema); const Customer=mongoose.model('Customer',customerSchema); const Supplier=mongoose.model('Supplier',supplierSchema); const Sale=mongoose.model('Sale',saleSchema); const Purchase=mongoose.model('Purchase',purchaseSchema); const CreditPayment=mongoose.model('CreditPayment',paymentSchema); const Expense=mongoose.model('Expense',expenseSchema); const User=mongoose.model('User',userSchema);

const auth=(req,res,next)=>{const token=(req.headers.authorization||'').replace('Bearer ',''); if(!token)return res.status(401).json({message:'Login required'}); try{req.user=jwt.verify(token,process.env.JWT_SECRET||'dev-secret');next()}catch{res.status(401).json({message:'Invalid session'})}};
const ok=(res,data)=>res.json(data);
const err=(res,e)=>{console.error(e);res.status(400).json({message:e?.message||'Request failed'})};
app.get('/api/health',(req,res)=>res.json({ok:true,service:'Abdul Rehman General Store',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
app.post('/api/auth/login',async(req,res)=>{try{const {email,password}=req.body;let u=await User.findOne({email});if(!u){const hash=await bcrypt.hash('admin123',10);u=await User.create({email:'admin@abdulrehmanstore.local',passwordHash:hash,name:'Store Owner'});}if(email!==u.email||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({message:'Invalid email or password'});const token=jwt.sign({id:u._id,email:u.email,name:u.name},process.env.JWT_SECRET||'dev-secret',{expiresIn:'7d'});ok(res,{token,user:{email:u.email,name:u.name}})}catch(e){err(res,e)}});
app.use('/api',auth);

app.get('/api/products',async(req,res)=>ok(res,await Product.find().sort({name:1}))); app.post('/api/products',async(req,res)=>{try{ok(res,await Product.create(req.body))}catch(e){err(res,e)}}); app.put('/api/products/:id',async(req,res)=>{try{ok(res,await Product.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}))}catch(e){err(res,e)}}); app.delete('/api/products/:id',async(req,res)=>{try{await Product.findByIdAndDelete(req.params.id);ok(res,{ok:true})}catch(e){err(res,e)}});
app.get('/api/customers',async(req,res)=>{const cs=await Customer.find().sort({name:1});const sales=await Sale.find();const pays=await CreditPayment.find();ok(res,cs.map(c=>{const s=sales.filter(x=>String(x.customerId)===String(c._id));const p=pays.filter(x=>String(x.customerId)===String(c._id));return {...c.toObject(),totalPurchases:s.reduce((a,x)=>a+x.total,0),outstanding:Math.max(0,s.reduce((a,x)=>a+x.total-x.amountPaid,0)-p.reduce((a,x)=>a+x.amount,0))}}))}); app.post('/api/customers',async(req,res)=>{try{ok(res,await Customer.create(req.body))}catch(e){err(res,e)}}); app.put('/api/customers/:id',async(req,res)=>{try{ok(res,await Customer.findByIdAndUpdate(req.params.id,req.body,{new:true}))}catch(e){err(res,e)}}); app.delete('/api/customers/:id',async(req,res)=>{try{await Customer.findByIdAndDelete(req.params.id);ok(res,{ok:true})}catch(e){err(res,e)}});
app.get('/api/suppliers',async(req,res)=>ok(res,await Supplier.find().sort({name:1}))); app.post('/api/suppliers',async(req,res)=>{try{ok(res,await Supplier.create(req.body))}catch(e){err(res,e)}}); app.put('/api/suppliers/:id',async(req,res)=>{try{ok(res,await Supplier.findByIdAndUpdate(req.params.id,req.body,{new:true}))}catch(e){err(res,e)}}); app.delete('/api/suppliers/:id',async(req,res)=>{try{await Supplier.findByIdAndDelete(req.params.id);ok(res,{ok:true})}catch(e){err(res,e)}});
app.get('/api/sales',async(req,res)=>ok(res,await Sale.find().populate('customerId','name').populate('items.productId','name').sort({createdAt:-1}))); app.post('/api/sales',async(req,res)=>{const session=await mongoose.startSession();try{let created;await session.withTransaction(async()=>{const items=req.body.items||[];let total=0;for(const i of items){const p=await Product.findById(i.productId).session(session);if(!p)throw Error('Product not found: '+i.productId);if(p.stockQuantity<i.quantity)throw Error(`${p.name} has only ${p.stockQuantity} in stock`);total+=Number(i.quantity)*Number(i.unitPrice??p.sellingPrice);await Product.updateOne({_id:p._id},{$inc:{stockQuantity:-Number(i.quantity)}},{session});}created=await Sale.create([{invoiceNo:'INV-'+Date.now(),customerId:req.body.customerId||null,items:items.map(i=>({...i,total:Number(i.quantity)*Number(i.unitPrice)})),total,amountPaid:Number(req.body.amountPaid||0),paymentMethod:Number(req.body.amountPaid||0)>=total?'Cash':'Credit'}],{session});});ok(res,created[0])}catch(e){err(res,e)}finally{session.endSession()}});
app.get('/api/purchases',async(req,res)=>ok(res,await Purchase.find().populate('supplierId','name').populate('items.productId','name').sort({createdAt:-1}))); app.post('/api/purchases',async(req,res)=>{const session=await mongoose.startSession();try{let created;await session.withTransaction(async()=>{const items=req.body.items||[];let total=0;for(const i of items){const p=await Product.findById(i.productId).session(session);if(!p)throw Error('Product not found');total+=Number(i.quantity)*Number(i.unitCost);await Product.updateOne({_id:p._id},{$inc:{stockQuantity:Number(i.quantity)},$set:{purchasePrice:Number(i.unitCost)}},{session});}created=await Purchase.create([{invoiceNo:'PUR-'+Date.now(),supplierId:req.body.supplierId||null,items:items.map(i=>({...i,total:Number(i.quantity)*Number(i.unitCost)})),total,amountPaid:Number(req.body.amountPaid||0)}],{session});});ok(res,created[0])}catch(e){err(res,e)}finally{session.endSession()}});
app.get('/api/payments',async(req,res)=>ok(res,await CreditPayment.find().populate('customerId','name').sort({createdAt:-1}))); app.post('/api/payments',async(req,res)=>{try{ok(res,await CreditPayment.create({customerId:req.body.customerId,amount:Number(req.body.amount),note:req.body.note||''}))}catch(e){err(res,e)}});
app.get('/api/expenses',async(req,res)=>ok(res,await Expense.find().sort({createdAt:-1}))); app.post('/api/expenses',async(req,res)=>{try{ok(res,await Expense.create({title:req.body.title,category:req.body.category,amount:Number(req.body.amount),note:req.body.note}))}catch(e){err(res,e)}}); app.delete('/api/expenses/:id',async(req,res)=>{try{await Expense.findByIdAndDelete(req.params.id);ok(res,{ok:true})}catch(e){err(res,e)}});
app.get('/api/dashboard',async(req,res)=>{const [products,sales,customers,expenses,purchases]=await Promise.all([Product.find(),Sale.find().sort({createdAt:-1}).limit(8).populate('customerId','name'),Customer.find(),Expense.find(),Purchase.find()]);const credit=sales.reduce((a,s)=>a+Math.max(0,s.total-s.amountPaid),0);const low=products.filter(p=>p.stockQuantity<=p.reorderLevel);const salesTotal=sales.reduce((a,s)=>a+s.total,0);ok(res,{productsCount:products.length,customerCount:customers.length,salesTotal, cashReceived:sales.reduce((a,s)=>a+s.amountPaid,0),credit,lowStock:low,outOfStock:products.filter(p=>p.stockQuantity<=0),recentSales:sales,expensesTotal:expenses.reduce((a,e)=>a+e.amount,0),purchasesTotal:purchases.reduce((a,p)=>a+p.total,0)})});
app.get('/api/reports',async(req,res)=>{const [sales,purchases,expenses,products]=await Promise.all([Sale.find(),Purchase.find(),Expense.find(),Product.find()]);const revenue=sales.reduce((a,s)=>a+s.total,0);const cost=purchases.reduce((a,p)=>a+p.total,0);const exp=expenses.reduce((a,e)=>a+e.amount,0);ok(res,{revenue,purchases:cost,expenses:exp,estimatedProfit:revenue-cost-exp,receivable:sales.reduce((a,s)=>a+Math.max(0,s.total-s.amountPaid),0),inventoryValue:products.reduce((a,p)=>a+p.purchasePrice*p.stockQuantity,0)})});
app.get('/api/demand',async(req,res)=>{const [products,sales]=await Promise.all([Product.find(),Sale.find()]);const map=new Map();sales.forEach(s=>s.items.forEach(i=>map.set(String(i.productId),(map.get(String(i.productId))||0)+Number(i.quantity))));const rows=products.map(p=>({...p.toObject(),soldUnits:map.get(String(p._id))||0,suggestedQty:p.stockQuantity<=p.reorderLevel?p.preferredReorderQty:0,demand:(map.get(String(p._id))||0)>=10?'High':(map.get(String(p._id))||0)>=5?'Medium':'Low'})).sort((a,b)=>b.soldUnits-a.soldUnits);ok(res,rows)});
app.post('/api/chat',async(req,res)=>{try{const q=String(req.body.message||'').toLowerCase();const [products,sales,customers,purchases,expenses]=await Promise.all([Product.find(),Sale.find(),Customer.find(),Purchase.find(),Expense.find()]);let reply='I can answer about products, stock, sales, purchases, customers, udhaar and expenses. Try asking: “which products are low stock?”';if(q.includes('low stock')||q.includes('low-stock')||q.includes('kam stock')){const low=products.filter(p=>p.stockQuantity<=p.reorderLevel);reply=low.length?`Low-stock products: ${low.map(p=>`${p.name} (${p.stockQuantity} ${p.unit})`).join(', ')}.`:'Good news: no product is currently below its reorder level.'}else if(q.includes('product'))reply=`There are ${products.length} products. ${products.filter(p=>p.stockQuantity<=p.reorderLevel).length} need stock attention.`;else if(q.includes('sale'))reply=`Recorded sales: ${sales.length}. Total sales value: Rs. ${sales.reduce((a,s)=>a+s.total,0).toLocaleString('en-PK')}.`;else if(q.includes('udhaar')||q.includes('credit')||q.includes('outstanding')){const pays=await CreditPayment.find();const out=Math.max(0,sales.reduce((a,s)=>a+Math.max(0,s.total-s.amountPaid),0)-pays.reduce((a,p)=>a+p.amount,0));reply=`Current recorded outstanding udhaar is approximately Rs. ${out.toLocaleString('en-PK')}.`; }else if(q.includes('customer'))reply=`There are ${customers.length} customers in the store records.`;else if(q.includes('purchase'))reply=`Recorded purchases: ${purchases.length}, worth Rs. ${purchases.reduce((a,p)=>a+p.total,0).toLocaleString('en-PK')}.`;else if(q.includes('expense'))reply=`Recorded expenses total Rs. ${expenses.reduce((a,e)=>a+e.amount,0).toLocaleString('en-PK')}.`;ok(res,{reply})}catch(e){err(res,e)}});

const port = Number(process.env.PORT || 5000);

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

if (!process.env.MONGODB_URI) {
  console.warn(
    'MONGODB_URI is missing. Database requests will fail until it is configured.'
  );
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((e) =>
      console.error('MongoDB connection failed:', e.message)
    );
}

export default app;
