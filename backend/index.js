const express = require('express');
const { port } = require('./config/config');
const cors = require('cors');

const {  invoiceDetail, User } = require('./db');
const {  getNumberOfPendingOfInvoice, createInvoice, processInvoiceData, generateInvoiceId, getAllInvoiceItem } = require('./helper/helper');



const app  =  express();
app.use(cors());

app.use(express.json())

app.get("/v1/invoice/getCount/:locationId" , async (req, res )=>{
try{
    let ordersNumber = await getNumberOfPendingOfInvoice(req.params.locationId)

    res.status(200).json({pendingOrder : ordersNumber , location : req.params.locationId})
}catch(e){
    console.log("Error in getting the number of pending order")
    res.status(500).json({err : "Error in getting the number of pending order" })
}  
})

app.get("/v1/invoice/create/:locationId" , (req , res)=>{
    const loction = req.params.locationId
    const invoiceId = generateInvoiceId()
    console.log(invoiceId);
     createInvoice(loction , invoiceId).then(val=> res.json({invoiceId : invoiceId , data : val}))
})

app.get("/v1/invoice/getAllInvoice/:locationId" , (req , res)=>{
    const id = req.params.locationId;
     invoiceDetail.find({
        location : id
    }).then((data)=>{
        if(!data || data.length == 0 ){
            return res.status(404).send(`No Data found for this Location ID ${id}`)
        }
        return res.json({data : data})
        
    
    })
})

app.get("/v1/invoice/invoiceItem/:invoiceId" , async(req , res)=>{
    const InvoiceID = req.params.invoiceId ;
  const data =  await invoiceDetail.findOne({
    invoice_no : InvoiceID
   })
    getAllInvoiceItem(InvoiceID).then((val)=>{
        res.json({invoiceId : InvoiceID , data : val , status : data?.invoiceStatus})
    }).catch((err)=>{
        res.send(err)
    })
    
})

app.post('/v1/invoice/update/:invoiceId'  , async (req, res)=>{
    const invoiceID = req.params.invoiceId ;
    let updateData = req.body.updateInvoiceId ;
    const data =  invoiceDetail.updateOne({
        invoice_no : invoiceID
    } , {invoiceStatus : 'pending'  , invoice_no : updateData}).then((val)=>{
        res.status(200).json({data : val})
    }).catch(()=> res.status(500).json({message : "Failed"}))
    
})


app.post('/v1/invoice/login' , async (req , res)=>{
   const username = req.body.username 
   const password = req.body.password
    console.log(username , password);
   User.find({
    userName : username,
    password : password
   }).then((val)=>{
    if(val){
        console.log(val);
        res.status(200).json({msg : "login success"})
    }
   }).catch((err)=>{
    console.log(err);
    res.status(403).json({msg : "Invalid Credentials"})
   })
})


app.listen(port , ()=>{
    console.log(`Listing to the port ${port}`);
})