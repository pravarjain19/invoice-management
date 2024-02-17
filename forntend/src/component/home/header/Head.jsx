import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import instance from "../../../config/axiosConfig";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';



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
  const[open , setOpen] =  useState(false) ;
   const createInvoice = async ()=>{
   setOpen(true)
  const res =  await instance.get('/create/ne14939928441')
   try{
   if(res.data.invoiceId !== "" ){
    toast.success("Invoice Created !", {
      position: "bottom-center"
    })
      navigate('/invoiceDetail/'+res.data?.invoiceId)

   }
   else{
    toast.error("Failed" , {position:"bottom-center"})

   }
  }catch(err){
    console.log(err);
    setOpen(false)
  }
 finally{
  setOpen(false)
 }
  }
 
  return (
    <>
      <div className=" md:flex justify-between mt-2">
        <div className="cont1">
          <h1 className=" font-semibold text-2xl">Kyari Fulfillment <br/> invoices</h1>
        </div>
        <div className="cont2  p-6 ">

          <Alert variant="outlined" severity="info" >
            There are <b> {pending}</b> shipments ready to be invoice. <br/> Click{" "}
            <b>Create Invoice </b>button to create an invoice
          </Alert>
          
        </div>
        <div className="cont3 flex flex-col pt-6">
          {/* <Button className=" bg-green-600 text-white px-2 py-1 rounded-md cursor-not-allowed mb-2" disabled >Download invoices </Button> */}
        
          {pending>0 ? <><Button className="px-2 py-1 border-solid border-2 border-grey rounded-md shadow-sm "  onClick={createInvoice} >Create invoice</Button>
          <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
        
      >
        <CircularProgress color="inherit" />
      </Backdrop>
          </> : <></>}
        </div>
        
      </div>
      <hr  className="mb-5"/>

      
    </>
  );
};

export default Head;
