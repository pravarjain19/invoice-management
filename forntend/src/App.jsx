import { useState } from 'react'

import './App.css'
import Home from './component/home/Home'
import { BrowserRouter as Router, Route , Routes } from 'react-router-dom';
import Detail from './component/details/Detail';
import Login from './component/login/Login';
function App() {
 
  

  return (
    <Router>
  

    <Routes>
    {/* <Route path='/' Component={Login}></Route> */}
    <Route path='/' Component={Home}></Route>
    <Route path='/login' Component={Login} />
    <Route path="/invoiceDetail/:id" Component={Detail} />
    </Routes>
 
    </Router>
  )
}

export default App
