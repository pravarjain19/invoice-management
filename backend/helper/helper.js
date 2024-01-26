const { orderDetails, itemMaster, kyariCost, invoiceItems, invoiceDetail } = require("../db");

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
async function getAllSkus(location ,invoiceId) {
  
  const invoiceStatus = await orderDetails.find({
    invoice_status: false,
    location_key: location,
    order_status: "Shipped",
  });

  const resultArray = await Promise.all(
    invoiceStatus.map(async (data) => {
      let finalItem = {};

      try {
        const itemmas = await itemMaster.findOne({
          childSKU: data.sku,
          singleCompSKU: { $regex: "KP" },
        });

        if (itemmas) {
          finalItem["childSKU"] = itemmas.childSKU;
          finalItem["singleCompSKU"] = itemmas.singleCompSKU;
          finalItem["qty"] = itemmas.qty;
          finalItem["subOrderQty"] = data.suborder_quantity;
          finalItem["subOrderNumber"] = data.suborder_num;
          finalItem["batchId"] = data.batch_id;
        }
      } catch (error) {
        // Handle any errors that may occur during the database query
        console.error("Error fetching data:", error);
      }

      return finalItem;
    })
  );

  // multiply
  let finalArray = [];
  finalArray = resultArray.map((items) => ({
    ...items,
    quantity: items.qty * parseInt(items.subOrderQty, 10),
  }));

  finalArray.sort((a, b) => {
    if (typeof a.batchId === "number" && typeof b.batchId === "number") {
      return a.batchId - b.batchId;
    }
    return 0;
  });

  const result = finalArray.reduce((acc, currentItem) => {
    const existingItem = acc.find(
      (item) => item.singleCompSKU === currentItem.singleCompSKU
    );

    if (existingItem) {
      // If the item already exists, update finalQty
      existingItem.quantity += currentItem.quantity;
    } else {
      // If the item doesn't exist, add it to the result array
      acc.push({
        singleCompSKU: currentItem.singleCompSKU,
        quantity: currentItem.quantity,
        childSKU: currentItem.childSKU,
        batchId: currentItem.batchId,
      });
    }

    return acc;
  }, []);

  let finaldata = await Promise.all(
    result.map(async (item) => {
      let finalObj = {};

      try {
        const skuName = await kyariCost.findOne({
          childSKU: item.singleCompSKU,
        });
        if (skuName) {
          finalObj = {
            ...item,
            productName: skuName?.componentName,
            pricePerUnit: skuName?.selectCost,
            invoiceAmount: item.quantity * skuName?.selectCost,
            sku : skuName?.childSKU
          };
        }
      } catch (err) {
        console.log(err);
      }
      return finalObj;
    })
  );

    setTimeout(()=>{
      addAllInvoiceDetailsToDb(finaldata , location , invoiceId)
    } , 0)

  setTimeout(() => {
    invoiceStatus.map((data) => {
      console.log(data.order_id);
      orderDetails
        .updateMany({ order_id: data?.order_id }, { invoice_status: true })
        .then()
        .catch((err) => console.log(err));
    });
  }, 0);

  return finaldata;
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
    console.log(invoiceID);
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
    location:location_key,
    totalAmount: getTotalAmout(data),
    invoiceItems : invoiceData.map((item)=>item._id),
    invoiceStatus : "Non-submitted",
    quantity: getQuntity(data)
  })

    await invoice.save();
  console.log('Invoice saved successfully: '+ invoiceID );
  
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
      console.log('Invoice not found ' + id);
      return "Not found";
    }
   const invoiceItem = invoiceData.invoiceItems
    

   return invoiceItem

    
  }catch(err){
    console.log(err);
  }
}
module.exports = {
  
  getNumberOfPendingOfInvoice,
  createInvoice,
  generateInvoiceId,
  getAllInvoiceItem
  
};
