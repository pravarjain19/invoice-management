const mongoose = require("mongoose");


const mongoDBAtlasURI = 'mongodb+srv://pravarjain:root@cluster0.zbqwqff.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'selebdb';
mongoose.connect(mongoDBAtlasURI, { useNewUrlParser: true, useUnifiedTopology: true, dbName });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');

})
const kyariCostSchema = new mongoose.Schema({
    vendorCode : String,
    childSKU :String ,
    componentName : String , 
    type : String ,
    selectCost : Number ,
    newExisting : String,
    costConfirmedDate : String ,
    confirmedBy : String
})

const orderDetailsSchema= new mongoose.Schema({
    manifest_date : String , 
    order_status : String ,
    location_key :String,
    reference_code : String,
    suborderNum : String, 
    batch_id : Number,
    suborder_quantity : String,
    sku : String,
    invoice_status : Boolean,
    order_id : Number
})

const itemMasterSchema = new mongoose.Schema({

srNo :String ,
brand : String ,
category : String,
parentSKU: String ,
childSKU : String,
itemName : String,
type : String ,
singleCompSKU:String,
componentName:String,
qty:Number,
avilableToSaleOn: String
})
const invoiceSchema = new mongoose.Schema({
    invoice_no : String ,
    createdDate : String ,
    vendorCode : String,
    location: String,
    totalAmount : Number,
    invoiceStatus : String,
    modifiedDate : String,
    invoiceItems : [{type : mongoose.Schema.Types.ObjectId , ref: 'invoiceItems'}],
    quantity : Number

})


const invoiceItemSchema = new mongoose.Schema({
    productName : String ,
    sku : String ,
    quantity : Number,
    pricePerUnit : Number,
    invoiceAmount : Number,
    childSKU :String,
    batchId : String,
})
const sbSchema = new mongoose.Schema({
    batchId: Number,
    items: [
      {
        singleCompSKU: String,
        finalQty: Number,
      },
    ],
})
const userSchema = new mongoose.Schema({
    userName : String,
    password : String,
})

const batchSchema = new mongoose.Schema({
  batchId: String,
  singleCompSKU:String,
  qty:Number,
  invoice_no : String,
  productSku : String
})
const Batches = mongoose.model('Batches' , batchSchema)
const User = mongoose.model('User' , userSchema);
const invoiceDetail = mongoose.model('invoiceDetail' , invoiceSchema)
const invoiceItems = mongoose.model('invoiceItems' , invoiceItemSchema)
const kyariCost = mongoose.model('kyariCost', kyariCostSchema);
const orderDetails = mongoose.model('orderDetails' , orderDetailsSchema)
const itemMaster = mongoose.model('itemMaster' , itemMasterSchema)
const test = mongoose.model('test' ,sbSchema )



module.exports = {kyariCost , orderDetails , itemMaster , invoiceItems ,invoiceDetail , User , Batches}