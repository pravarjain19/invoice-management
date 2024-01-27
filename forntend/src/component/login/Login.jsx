// Login.js
import React, { useState } from 'react';
import instance from '../../config/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
    const navigate = useNavigate()
  const handleLogin = async() => {
    // Basic validation
    if (!email || !password) {
      setError('Both fields are required');
      return;
    }

    // Email validation using a regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email address');
      return;
    }

   const res= await instance.post('/login' , {
        username : email,
        password : password
    })

    if(res.status == 200){
        navigate('/home')
        toast.success("Login Success" , {position:'bottom-center'})
    }
    else{
        setError('Incorrect credentials');
        toast.error("Login Failed" , {position:'bottom-center'})
    }
 // Reset error message and display success message

    // Clear form and error on successful login
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Kyari Invoice System</h1>
        <div className="bg-white rounded p-6 shadow-md w-96">
          <label className="block mb-2">Email:</label>
          <input
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block mb-2">Password:</label>
          <div className="relative">
            <input
              className="w-full p-2 mb-4 border border-gray-300 rounded"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="absolute right-2 top-2 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button
            className="w-full bg-green-500 text-white py-2 rounded"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
