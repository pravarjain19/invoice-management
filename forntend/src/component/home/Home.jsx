import React, { useEffect, useState } from "react";
import Head from "./header/Head";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import StickyHeadTable from "./body/Body";


const Home = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state
  const navigate = useNavigate();

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      setAuthenticated(true);
    } else {
      navigate('/login');
    }
    // Once authentication status is determined, set loading to false
    setLoading(false);
  }, [navigate]);

  // Render loading indicator if still checking authentication
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a loading spinner or any other indicator
  }

  // Render nothing if not authenticated (redirect happens in useEffect)
  if (!authenticated) {
    return null;
  }

  // Render content only after authentication status is fully determined
  return (
    <div className="mx-16">
      <Head />
      
      <StickyHeadTable />
      
    </div>
  );
};

export default Home;
