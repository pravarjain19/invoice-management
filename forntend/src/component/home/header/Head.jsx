import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import instance from "../../../config/axiosConfig";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";



const Head = () => {
  const navigate = useNavigate();
  useEffect(() => {
    async function pendingItem() {
      const res = await instance.get("/getCount/ne14939928441");
      setPending(res.data.pendingOrder);
      
    }

    
    pendingItem();
    
  }, []);
  const [pending, setPending] = useState("");

   const createInvoice = async ()=>{
   
  const res =  await instance.get('/create/ne14939928441')
   
   if(res.data.invoiceId !== "" ){
    toast.success("Invoice Created !", {
      position: "bottom-center"
    })
      navigate('/invoiceDetail/'+res.data?.invoiceId)

   }
   else{
    toast.error("Failed" , {position:"bottom-center"})

   }
  }
 
  return (
    <>
      <div className="flex justify-between mt-2">
        <div className="cont1">
          <h1 className=" font-semibold text-2xl">Kyari Fulfillment <br/> invoices</h1>
        </div>
        <div className="cont2 w-5/12 p-6">

          <Alert variant="outlined" severity="info" >
            There are <b> {pending}</b> shipments ready to be invoice. Click{" "}
            <b>Create Invoice </b>button to create an invoice
          </Alert>
          
        </div>
        <div className="cont3 flex flex-col pt-6">
          <button className=" bg-green-600 text-white px-2 py-1 rounded-md cursor-not-allowed mb-2" disabled >Download invoices</button>
        
          {pending>0 ? <><button className="px-2 py-1 border-solid border-2 border-grey rounded-md shadow-sm "  onClick={createInvoice} >Create invoice</button></> : <></>}
        </div>
        
      </div>
      <hr  className="mb-5"/>

      
    </>
  );
};

export default Head;
