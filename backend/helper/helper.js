const { orderDetails, itemMaster, kyariCost, invoiceItems, invoiceDetail, Batches } = require("../db");
const ExcelJS = require('exceljs');


async function createInvoice(location , invoiceId) {
  return await getAllSkus(location , invoiceId);
}

// getting the number of suborder from the db
async function getNumberOfPendingOfInvoice(location) {
  const orders = await orderDetails.find({
    invoice_status: false,
    location_key: location,
    order_status: "Shipped",
  });

  return orders.length;
}

// get All the sku for invoice return list  , for the particular vendor
// imp point to change is location key it will based on logined in user
async function getAllSkus(location, invoiceId) {
  try {
    const invoiceStatus = await orderDetails.find({
      invoice_status: false,
      location_key: location,
      order_status: "Shipped",
    });

    let resultArray = [];
    for (const data of invoiceStatus) {
      const kpItems = await itemMaster.find({
        childSKU: data.sku,
        singleCompSKU: { $regex: "KP" },
      });

      kpItems.forEach((itemmas) => {
        let finalItem = {
          childSKU: itemmas.childSKU,
          singleCompSKU: itemmas.singleCompSKU,
          qty: itemmas.qty,
          subOrderQty: data.suborder_quantity,
          subOrderNumber: data.suborderNum,
          batchId: data.batch_id,
        };
        resultArray.push(finalItem);
      });
    }

    let finalArray = resultArray.map((items) => ({
      ...items,
      quantity: items.qty * parseInt(items.subOrderQty, 10),
    }));

    const map = {};
    finalArray.forEach((item) => {
      const key = `${item.batchId}_${item.singleCompSKU}`;
      if (!map[key]) {
        map[key] = {
          batchId: item.batchId,
          singleCompSKU: item.singleCompSKU,
          qty: item.quantity,
          invoice_no: invoiceId,
        };
      } else {
        map[key].qty += item.quantity;
      }
    });

    const batcharr = Object.values(map);

    const result = finalArray.reduce((acc, currentItem) => {
      const existingItem = acc.find(
        (item) => item.singleCompSKU === currentItem.singleCompSKU
      );

      if (existingItem) {
        existingItem.quantity += currentItem.quantity;
      } else {
        acc.push({
          singleCompSKU: currentItem.singleCompSKU,
          quantity: currentItem.quantity,
          childSKU: currentItem.childSKU,
          batchId: currentItem.batchId,
        });
      }

      return acc;
    }, []);

    const finaldata = await Promise.all(
      result.map(async (item) => {
        let finalObj = {};

        try {
          const skuName = await kyariCost.findOne({
            childSKU: item.singleCompSKU,
            location_key: location,
          });
          if (skuName) {
            finalObj = {
              ...item,
              productName: skuName?.componentName,
              pricePerUnit: skuName?.selectCost,
              invoiceAmount: item.quantity * skuName?.selectCost,
              sku: skuName?.childSKU,
            };
          }
        } catch (err) {
          console.log(err);
        }
        return finalObj;
      })
    );

    await addAllInvoiceDetailsToDb(finaldata, location, invoiceId);

    await Promise.all([
      ...invoiceStatus.map((data) =>
        orderDetails.updateMany(
          { order_id: data?.order_id },
          { invoice_status: true }
        )
      ),
      ...batcharr.map(async (items) => {
        if (items.singleCompSKU && items.batchId) {
          let sku = await kyariCost.findOne({ childSKU: items.singleCompSKU });
          if (sku) items["productSku"] = sku?.componentName;
          await Batches.create(items);
        }
      }),
    ]);

    return finaldata;
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error to be handled by the caller
  }
}


function generateInvoiceId() {
  // Get current timestamp (milliseconds since epoch)
  const timestamp = new Date().getTime();

  // Generate a random 3-digit number
  const randomPart = Math.floor(Math.random() * 1000);

  // Combine timestamp and random number to create a 7-digit ID
  const invoiceId =
    timestamp.toString() + randomPart.toString().padStart(3, "0");

  // Extract the last 7 digits to ensure the length is exactly 7
  return invoiceId.slice(-7);
}

async function addAllInvoiceDetailsToDb(data , location_key , invoiceID){
  
  try{
   
  const invoicenum = invoiceID
  const date = new Date()

 
 const invoiceObj =  data.map((item)=>{
      
    return new invoiceItems({...item})
     
  })
  
  const invoiceData = await invoiceItems.insertMany(invoiceObj)
  let quantityTotal = 0
  const invoice = new invoiceDetail({
    invoice_no : invoicenum , 
    createdDate : formatDate(date),
    modifiedDate: formatDate(date),
    location:location_key,
    totalAmount: getTotalAmout(data),
    invoiceItems : invoiceData.map((item)=>item._id),
    invoiceStatus : "Non-submitted",
    quantity: getQuntity(data)
  })

    await invoice.save();
  // console.log('Invoice saved successfully: '+ invoiceID );
  
}catch(err){
  console.log("Erro 175 " + err)
}
}
function getQuntity(data){
  return data.reduce((accumulator, item) => accumulator + (item?.quantity || 0), 0);
}

function getTotalAmout(data){
  return data.reduce((accumulator, item) => accumulator + (item?.invoiceAmount || 0), 0);
  
}


function formatDate(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

async function getAllInvoiceItem(id){
  id = ""+id
  try{
   const invoiceData = await invoiceDetail.findOne({
      invoice_no : id
    }).populate('invoiceItems')


    if (!invoiceData) {
      // console.log('Invoice not found ' + id);
      return "Not found";
    }
   const invoiceItem = invoiceData.invoiceItems
    

   return invoiceItem

    
  }catch(err){
    console.log(err);
  }
}

async function generateExcelSheetForInvoice( invoiceId){
  
  
  console.log("Generating excel for " + invoiceId);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  worksheet.columns = [
    { header: 'BatchId', key: 'batchId', width: 20 },
    { header: 'Sku', key: 'singleCompSKU', width: 10 },
    { header: 'Qty', key: 'qty', width: 15 },
    {header : 'Name' , key : 'productSku' , width:15},
    {header : 'invoice_no' , key: 'invoice_no' , width:15}
  ];
  
 let data = await Batches.find({
    invoice_no: invoiceId+"",
  })
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  if(data.length==0){
    worksheet.addRow("NO data found " + invoiceId)
  }
  
  return workbook
 
  
}



module.exports = {
  
  getNumberOfPendingOfInvoice,
  createInvoice,
  generateInvoiceId,
  getAllInvoiceItem,
  generateExcelSheetForInvoice,
  formatDate
};
