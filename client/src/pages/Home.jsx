import "../App.css";
import React, { useState, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useSignIn from "react-auth-kit/hooks/useSignIn";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import BookingForm from "../components/BookingForm";
import BookingList from "../components/BookingList";
import axios from "axios";
import Cookies from "js-cookie";

const Home = () => {
  const [bookingData, setBookingData] = useState([]);
  const [username, setUsername] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const authHeader = useAuthHeader();
  const authToken = authHeader.split(" ")[1];
  const authUser = useAuthUser();

  useEffect(() => {
    fetchBookingData();
    if (authUser) {
      setUsername(authUser.name);
    } else {
      navigate("/login");
    }
  }, []);

  // Refresh Token with interval
  useEffect(() => {
    const refreshInterval = 1; // in minutes to trigger token refresh
    const interval = setInterval(() => {
      callRefreshAPI();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const callRefreshAPI = async () => {
    console.log("Calling Refresh Token API...");
    const response = await axios.post(`${API_URL}/refresh`, { token: Cookies.get("_auth_refresh") });
    signIn({
      auth: {
        token: response.data.accessToken,
      },
      refresh: response.data.refreshToken,
      userState: { uid: authUser.uid, name: authUser.name },
    });
  };

  const fetchBookingData = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${authUser.uid}/bookings`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });
      setBookingData(response.data);
    } catch (error) {
      if (error.response.status === 404) {
        // When no bookings found for user ID- Set empty array to booking data array.
        setBookingData([]);
        console.error(error.response.data.Error);
      } else {
        console.error("Error fetching booking data:", error);
      }
    }
  };

  const handleLogout = async () => {
    signOut();
    navigate("/login");
  };

  return (
    <>
      <Container>
        <h1>Qwikbook</h1>
        <h2>Welcome, {username}</h2>
        <BookingList onSuccess={fetchBookingData} bookingData={bookingData} />
        <BookingForm onSuccess={fetchBookingData} mode={"create"} />
        <Button className="me-3 p-3" variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Container>
    </>
  );
};

export default Home;
