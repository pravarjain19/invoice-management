const express = require('express');
const { port } = require('./config/config');
const cors = require('cors');

const {  invoiceDetail, User, Batches } = require('./db');
const {  getNumberOfPendingOfInvoice, createInvoice, generateInvoiceId, getAllInvoiceItem, generateExcelSheetForInvoice, getPdfForInvoiceItems, formatDate } = require('./helper/helper');

const path = require('path')



const app  =  express();
app.use(cors());

app.use(express.json())

const _dirname= path.dirname("")
const buildPath = path.join(_dirname , "../forntend/dist")
app.use(express.static(buildPath))
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
//    console.log(data);
    getAllInvoiceItem(InvoiceID).then((val)=>{
        res.json({invoiceId : InvoiceID , data : val , status : data?.invoiceStatus , details : data})
    }).catch((err)=>{
        res.send(err)
    })
    
})

app.post('/v1/invoice/update/:invoiceId'  , async (req, res)=>{
    const invoiceID = req.params.invoiceId ;
    let updateData = req.body.updateInvoiceId ;
    const data =  invoiceDetail.updateOne({
        invoice_no : invoiceID
    } , {invoiceStatus : 'pending'  , modifiedDate: formatDate(new Date()), invoice_no : updateData}).then((val)=>{
        res.status(200).json({data : val})
      
    }).catch(()=> res.status(500).json({message : "Failed"}))
    await Batches.updateMany({invoice_no : invoiceID} , { $set: { invoice_no: updateData } }).catch(()=> res.status(500).json({message : "Failed"}))
    
})

app.get('/v1/invoice/getexcel/:invoiceId' , async(req,res)=>{
   let id= req.params.invoiceId
   const workbook= await generateExcelSheetForInvoice(id);
   const currentDate = new Date();
   const formattedDate = new Date().toISOString().replace(/:/g, '-');;
   res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=invoice_'+formattedDate+'.xlsx'
  );
   workbook.xlsx.write(res).then(()=>{
    // console.log("File has been downloaded")
   })
})

app.get('/v1/invoice/getpdf'  , async (req , res)=>{
   await getPdfForInvoiceItems(1897057 , res)
})

app.post('/v1/invoice/login' , async (req , res)=>{
   const username = req.body.username 
   const password = req.body.password
    // console.log(username , password);
   User.findOne({
    userName : username,
    password : password
   }).then((val)=>{
  
    if(val ){
        // console.log(val);
     return   res.status(200).json({msg : "login success" , jwt: val?.location})
    }
   return res.status(403).json({msg : "Invalid Credentials"})
   
   }).catch((err)=>{
    // console.log(err);
    res.status(403).json({msg : "Invalid Credentials"})
   })
})




app.post("/v1/invoice/updateStatus/:invoiceId" ,async (req, res)=>{
    let  invoiceId = req.params.invoiceId ;
     let inoviceData = await invoiceDetail.findOne({
        invoice_no : invoiceId
    })

    try{
    if(inoviceData){
   await invoiceDetail.updateOne({
        invoice_no:req.params.invoiceId
    } ,{invoiceStatus : req.body.status})
    res.json({msg:"Updated Successfully"});
}
else {
    res.status(411).json({msg : "Update Failed  Id ::" + invoiceId})
}
    }
    catch(err) {
        res.json(411).json({msg : "Failed to update " , err : err })
        console.log(err);
    }
})

app.listen(port , ()=>{
    console.log(`Listing to the port ${port}`);
})