import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import instance from "../../config/axiosConfig";
import Items from "./Items";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
const Detail = () => {
  const { id } = useParams();

  const navigate = useNavigate();
  const [invoiceid, setInvoiceid] = useState("");
  const[invoice ,setInvoice] = React.useState([]);
  const[items ,setItems] = React.useState({});
  const[amount , setAmount] = React.useState(0)

  const invoiceHandler = (e) => {
    setInvoiceid(e.target.value);
  };
  async function updateHandler(){
    const res = await instance.post('/update/'+id , {
        updateInvoiceId : invoiceid
      })
      
      if(res.status === 200){
        toast.success("Updated Successfully", {
          position:'bottom-center'
        })
       navigate('/') 
      }
      else{
        toast.error('Error Occured', {
          position:'bottom-center'
        })
      }
  }
  async function excelDownload(){
  
  
try{
    // Generate a Blob from the Excel workbook
    instance.get('/getexcel/'+id, {
      method: 'GET',
      responseType: 'blob', // important
  }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
  });
  } catch (error) {
    console.error('Error downloading Excel sheet:', error);
  }

  }
  function formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${month}/${day}/${year}`;
  }
  useEffect(() => {
    async function fetchData() {
      
        const res = await instance.get('/invoiceItem/'+id)
        .catch((err)=>console.error(err))
       
      
        setInvoice(res.data.data)
        setItems(res.data)
      
    }
    fetchData();
  }, []);

  useMemo(()=>{
    const amount = invoice.reduce((accumulator, item) => accumulator + (item?.invoiceAmount || 0), 0)
    setAmount(amount)
  }, [invoice])
  return (
    
    <div className="mx-16 mt-2 ">
      <div className="flex justify-between">
      <div className="con1">
        <h1 className="py-2 text-2xl font-semibold mb-1">New Invoice</h1>
        <div className="invoice flex gap-2">
          <label htmlFor="invoiceId">Invoice ID *</label>
          <input
            type="text"
            id="invoiceId"
            className=" border-2 border-solid shadow-sm rounded-md pl-1"
            placeholder={items.invoiceId}
            onChange={(e) => {
              invoiceHandler(e);
            }}
          />
        </div>
        <p className=" text-red-500 text-sm">
          As per Rule 46(b) of the Central and Services Tax Rules, 2017, invoice
          number should be a consecutive serial number ending <br/> with a digit
          (0-9), not exceeding sixteen characters, containing alphabets or
          numerals or special characters - hyphen <br/>or dash and slash symbolized
          as "-" and "/" respectively, and any combination thereof, unique for a
          financial year.
        </p>
      </div>
      <div className="con2 flex flex-col justify-center gap-2">
            
            <button id="" onClick={excelDownload}  className="  px-8 py-1 border-2 border-solid shadow-sm rounded-md">Download </button>
           
            {(invoiceid && (items.status === 'Non-submitted') ) ? <>
              <button onClick={updateHandler} className="  cursor-pointer bg-green-600 text-white px-3 py-1 border-2 border-solid shadow-sm rounded-md">Submit invoice</button>
            </> : <></> }
      </div>
      </div>
      <hr className="mt-7"/>
      <div className="flex  gap-3 my-2 ">
        <p className=" text-l">Invoice date : </p>
        
        <input type="text" value={formatDate(new Date())} disabled className=" shadow-sm " />
      </div>
    <Items invoice={invoice}></Items>

    <div className="amout flex justify-end mt-4">
            <p className=" text-xl font-semibold">Total Amount : {amount}</p>
    </div>
    </div>
  );
};

export default Detail;
