const { bactchId } = require("./helper");

  
  const groupedArray = finalArray.reduce((acc, item) => {
    try{
    if (typeof item.batchId === "number") {
      const existingItem = acc.find(
        (groupedItem) => groupedItem.batchId === item.batchId
      );

      if (!existingItem) {
        acc.push({
          batchId: item.batchId,
          items: [
            { singleCompSKU: item.singleCompSKU, finalQty: item.finalQty },
          ],
        });
      } else {
        const existingSKU = existingItem.items.find(
          (skuItem) => skuItem.singleCompSKU === item.singleCompSKU
        );

        if (existingSKU) {
          // If SKU already exists, add the finalQty
          existingSKU.finalQty += item.finalQty;
        } else {
          // If SKU doesn't exist, add a new entry
          existingItem.items.push({
            singleCompSKU: item.singleCompSKU,
            finalQty: item.finalQty,
          });
        }
      }
    }
  }catch(err){
    console.log(err);
    throw  err;
  }
    return acc;
  }, []);
  // console.log(groupedArray.length);
  // await test.create(groupedArray).then(() => {
  //   console.log("Data added");
  // });

  // unique sku

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

  async function processInvoiceData() {
    console.log("processInvoice");
    try {
      const invoiceStatus = await orderDetails.find({
        invoice_status: false,
        location_key: "ne14939928441",
        order_status: "Shipped",
      });
  
      const resultArray = await Promise.all(
        invoiceStatus.map(async (data) => {
          try {
            const itemmas = await itemMaster.findOne({
              childSKU: data.sku,
              singleCompSKU: { $regex: "KP" },
            });
  
            if (itemmas) {
              return {
                childSKU: itemmas.childSKU,
                singleCompSKU: itemmas.singleCompSKU,
                qty: itemmas.qty,
                subOrderQty: data.suborder_quantity,
                subOrderNumber: data.suborder_num,
                batchId: data.batch_id,
              };
            }
          } catch (error) {
            console.error("Error fetching data:", error);
          }
          return null; // Handle the case when itemmas is not found
        })
      );
  
      let finalArray = resultArray.map((items) => {
        if (items && items.qty) {
          return {
            ...items,
            finalQty: items.qty * parseInt(items.subOrderQty, 10),
          };
        } else {
          // Handle the case where items is null or undefined
          return null; // or any default value you prefer
        }
      });
  
      // Remove any null entries from finalArray
      finalArray = finalArray.filter((item) => item !== null);
  
      // Sorting the finalArray based on batchId (if it's a number)
      finalArray.sort((a, b) =>
        typeof a.batchId === "number" && typeof b.batchId === "number"
          ? a.batchId - b.batchId
          : 0
      );
  
      // Rest of your code for creating groupedArray and writing to a file
      const groupedArray = finalArray.reduce((acc, item) => {
        if (typeof item.batchId === "number") {
          const existingItem = acc.find(
            (groupedItem) => groupedItem.batchId === item.batchId
          );
  
          if (!existingItem) {
            acc.push({
              batchId: item.batchId,
              items: [
                { singleCompSKU: item.singleCompSKU, finalQty: item.finalQty },
              ],
            });
          } else {
            const existingSKU = existingItem.items.find(
              (skuItem) => skuItem.singleCompSKU === item.singleCompSKU
            );
  
            if (existingSKU) {
              // If SKU already exists, add the finalQty
              existingSKU.finalQty += item.finalQty;
            } else {
              // If SKU doesn't exist, add a new entry
              existingItem.items.push({
                singleCompSKU: item.singleCompSKU,
                finalQty: item.finalQty,
              });
            }
          }
        }
  
        return acc;
      }, []);

      // console.log(groupedArray);

      
  
      // Writing groupedArray to a JSON file
  
      // Rest of your code for creating result array and logging
  
      // Rest of your code for creating singleSkulist
    } catch (error) {
      console.error("An error occurred:", error);
      throw error; // Propagate the error
    }
  }
  
  // Call the main function
  
  // api fetch
  async function getOrderDetailsFromEasyCom() {
    var myHeaders = new Headers();
    myHeaders.append("x-api-key", "<x-api-key>");
    myHeaders.append(
      "Authorization",
      "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvbG9hZGJhbGFuY2VyLW0uZWFzeWVjb20uaW9cL2FjY2Vzc1wvdG9rZW4iLCJpYXQiOjE3MDQ0NjU5NDQsImV4cCI6MTcxMjM0OTk0NCwibmJmIjoxNzA0NDY1OTQ0LCJqdGkiOiJxNERTWGtmOU5HaWswOEluIiwic3ViIjoxNzU0ODQsInBydiI6ImE4NGRlZjY0YWQwMTE1ZDVlY2NjMWY4ODQ1YmNkMGU3ZmU2YzRiNjAiLCJ1c2VyX2lkIjoxNzU0ODQsImNvbXBhbnlfaWQiOjEwODYxNSwicm9sZV90eXBlX2lkIjoyLCJwaWlfYWNjZXNzIjoxLCJyb2xlcyI6bnVsbCwiY19pZCI6MTIyMjI5LCJ1X2lkIjoxNzU0ODQsImxvY2F0aW9uX3JlcXVlc3RlZF9mb3IiOjEyMjIyOX0.YsRlSP3kcAwS-Y5U5gVJy0mtf8S2DLrvtKS6bAKx2Nc"
    );
    myHeaders.append(
      "Cookie",
      "PHPSESSID=f8uv612a76tko52hvf68btgppp; XSRF-TOKEN=eyJpdiI6ImlKeUluSVpjTHAvVWVrZ3luTDhtN1E9PSIsInZhbHVlIjoiU0dQMjd4MVh2UXlvN0xZSWdHRmYvQlhIdjZLQTNENlFRN1VNTmgvaGJEUjVzb090RGtwNExBUzh4eXRMTGcvTDlkeVBvRU8ybnlFNlR2cnRsTEp0YjFpVFVMT3NxRXNJMDlwc3NUQ0oyMHI0bnExRmN2ZmpPY2pkWlc2ZDAxZ3IiLCJtYWMiOiI5YjViZTk1YTc4MDczYjY3YzY5NTgzOTNmNGI3ODAzN2NlNDFjYzA3ZjA4NGNmZTMyYWU5YmRmYWRiY2NkM2MwIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6InNOMWFNeDNlZ3haVC9OdmQybFhVSlE9PSIsInZhbHVlIjoiUzdSMHFHTlZINjhGWlAwQ2JUYm4xcjViUU5vUlR4NFBQQnE5aFcxVHVTWmphTmhQUHdQQU94Y3FKT2pzYlRqT2NGVExMb1ZLS09WQytjSHdJM0txZE9iblRuZUpuR3F0ZXdmKzllTE1GZ0QrdVYwY2Mzc0JBTTEzRlRuNzVzMWgiLCJtYWMiOiJiMjgwMmVmNWI0ODY0OTQ0OTZjNzRiNTgxYmZlOTAxMTIwM2NiNjA0ZDI5ZDBkNjI1Zjk0M2FhYzRlZmQwNmM3IiwidGFnIjoiIn0%3D"
    );
  
    var requestOptions = {
      method: "GET",
      headers: myHeaders,
    };
  
    let data = await fetch(
      "https://api.easyecom.io/orders/V2/getAllOrders?end_date=2024-01-06 00:00:00&start_date=2024-01-05 00:00:00",
      requestOptions
    );
    let res = await data.json();
  
    // addd data to db
    let orderArr = res.data.orders;
    orderArr.map((order, i) => {
      let subOrderArr = order["suborders"];
      if (subOrderArr.length > 0) {
        subOrderArr.map((subOrder) => {
          let subOrderNum = subOrder["suborder_num"];
          orderDetails.findOne({ suborder_num: subOrderNum }).then((val) => {
            if (!val) {
              orderDetails
                .create({
                  manifest_date: order["manifest_date"],
                  order_status: order["order_status"],
                  batch_id: order["batch_id"],
                  order_id: order["order_id"],
                  order_status: order["order_status"],
                  location_key: order["location_key"],
                  reference_code: order["reference_code"],
                  suborder_quantity: subOrder["suborder_quantity"],
                  sku: subOrder["sku"],
                  invoice_status: false,
                  suborder_num: subOrderNum,
                })
                .catch((err) => console.log(err));
            }
          });
        });
      }
    });
  }
  
  function countSku(myArray) {
    const countMap = {};
  
    // Loop through the array
    myArray.forEach((item) => {
      // If the item is not present in the countMap, initialize it with a count of 1
      if (item !== undefined) {
        if (!countMap[item.sku]) {
          countMap[item.sku] = 1;
        } else {
          countMap[item.sku]++;
        }
      }
    });
    return countMap;}  

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
    

    async function bactchId()
{

  try{

    const invoiceStatus = await orderDetails.find({
      invoice_status: false,
      location_key: location,
      order_status: "Shipped",
    });
  
    const resultArray = await Promise.all(
      invoiceStatus.map(async (data) => {
        let finalItem = {};
  
        try {
          const kpItems = await itemMaster.find({
            childSKU: data.sku,
            singleCompSKU: { $regex: "KP" },
          });
          console.log(kpItems);
          kpItems.map((itemmas)=>{
          if (itemmas) {
            finalItem["childSKU"] = itemmas.childSKU;
            finalItem["singleCompSKU"] = itemmas.singleCompSKU;
            finalItem["qty"] = itemmas.qty;
            finalItem["subOrderQty"] = data.suborder_quantity;
            finalItem["subOrderNumber"] = data.suborderNum;
            finalItem["batchId"] = data.batch_id;
          }
        })
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



  
}catch(err){
  console.log(err);
}

}