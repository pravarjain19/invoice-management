import React from 'react'
import Head from './header/Head'

import { toast, ToastContainer } from 'react-toastify';
import StickyHeadTable from './body/Body'

const Home = () => {
  return (
    <div className='mx-16'>
      <Head/>
      
      <StickyHeadTable/>
  
    </div>

  )
}

export default Home