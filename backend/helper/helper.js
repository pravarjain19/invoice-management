const { orderDetails, itemMaster, kyariCost, invoiceItems, invoiceDetail } = require("../db");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const streamBuffers = require('stream-buffers');

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

async function generateExcelSheetForInvoice( invoiceId){
   invoiceId = 1897057;
  let data = [];
  console.log("Generating excel for " + invoiceId);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  worksheet.columns = [
    { header: 'BatchId', key: 'batch', width: 20 },
    { header: 'Sku', key: 'sku', width: 10 },
    { header: 'Qty', key: 'qty', width: 15 },
  ];
  
  const invoicedetails = await invoiceDetail.findOne({
    invoice_no: invoiceId,
  });
  
  const invoiceIDs = invoicedetails.invoiceItems || [];
  
  // Use Promise.all to wait for all asynchronous operations to complete
  await Promise.all(
    invoiceIDs.map(async (items) => {
      const itemsdata = await invoiceItems.findOne({
        _id: items,
      });
  
      if (itemsdata) {
        let row = {
          batch: itemsdata.batchId ? itemsdata.batchId : "",
          sku: itemsdata.sku ? itemsdata.sku : "",
          qty: itemsdata.quantity ? itemsdata?.quantity : "",
        };
  
        data.push(row);
      }
    })
  );

  data.sort((a, b) => (a.batch > b.batch ? 1 : -1));
  
  data.forEach((row) => {
    worksheet.addRow(row);
  });
  
  return workbook
 
  
}

const getPdfForInvoiceItems = async (invoiceId, res) => {
  try {
    invoiceId = 1897057;
    const data = [];

    const invoicedetails = await invoiceDetail.findOne({
      invoice_no: invoiceId,
    });

    if (!invoicedetails) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceIDs = invoicedetails.invoiceItems || [];

    await Promise.all(
      invoiceIDs.map(async (id) => {
        const item = await invoiceItems.findOne({
          _id: id,
        });

        if (item) {
          data.push(item);
        }
      })
    );

    const pdfDoc = new PDFDocument();

    // Set the content type and disposition of the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoicedetails.invoice_no}.pdf`);

    // Pipe the PDF directly to the response stream
    pdfDoc.pipe(res);

    // Add content to the PDF
    pdfDoc.text(`Invoice Number: ${invoicedetails.invoice_no}`);
    pdfDoc.text(`Created Date: ${invoicedetails.createdDate}`);
    pdfDoc.text('Invoice Items:');

    // Table headers
    pdfDoc.font('Helvetica-Bold');
    pdfDoc.text('Product Name', 50);
    pdfDoc.text('SKU', 150);
    pdfDoc.text('Quantity', 250);
    pdfDoc.text('Price Per Unit', 350);
    pdfDoc.text('Invoice Amount', 450);
    pdfDoc.text('Child SKU', 550);
    pdfDoc.text('Batch ID', 650);
    pdfDoc.font('Helvetica');

    // Table rows
    data.forEach((item, index) => {
      pdfDoc.text(item.productName, 50);
      pdfDoc.text(item.sku, 150);
      pdfDoc.text(item?.quantity ? item.quantity.toString() : '-', 250);
      pdfDoc.text(item?.pricePerUnit ? item.pricePerUnit.toString() : '-', 350);
      pdfDoc.text(item?.invoiceAmount ? item.invoiceAmount.toString() : '-', 450);
      pdfDoc.text(item.childSKU, 550);
      pdfDoc.text(item.batchId, 650);
    });

    // Calculate total
    const totalAmount = invoicedetails?.totalAmount || 0;

    // Table footer
    pdfDoc.font('Helvetica-Bold');
    pdfDoc.text('Total', 50);
    pdfDoc.text(totalAmount.toString(), 250);
    pdfDoc.font('Helvetica');

    pdfDoc.end(); // Ensure the PDF generation is complete before returning
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



module.exports = {
  
  getNumberOfPendingOfInvoice,
  createInvoice,
  generateInvoiceId,
  getAllInvoiceItem,
  generateExcelSheetForInvoice,
  getPdfForInvoiceItems
  
};
