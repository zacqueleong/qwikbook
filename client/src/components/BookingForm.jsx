import { useState, useEffect } from "react";
import { Button, Container, Form } from "react-bootstrap";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import DatePicker from "react-datepicker";
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import axios from "axios";

const BookingForm = ({ onSuccess, mode, handleCloseModal, bookingData }) => {
  const [bookingDescription, setBookingDescription] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedTime, setBookedTime] = useState([]);
  const [bookingId, setBookingId] = useState(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const authHeader = useAuthHeader();
  const authToken = authHeader.split(" ")[1];
  const authUser = useAuthUser();

  useEffect(() => {
    // Populate booking data when in update mode
    if (mode === "update") {
      setBookingId(bookingData.id);
      setBookingDescription(bookingData.description);
      setBookingEmail(bookingData.booking_email);
      setBookingPhone(bookingData.booking_phone);
      setSelectedDate(new Date(bookingData.booking_timestamp));
      setSelectedTime(new Date(bookingData.booking_timestamp));
    }
  }, []);

  useEffect(() => {
    // Fetch booking data when selectedDate changes
    if (selectedDate) {
      fetchBookingByDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchBookingByDate = async (selectDate) => {
    try {
      const bookingDate = moment(selectDate).format("YYYYMMDD");
      const response = await axios.get(`${API_URL}/bookings?bookingDate=${bookingDate}`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      // When bookings found - Store all booked timing in array
      const bookedTiming = response.data.map((time) => {
        const [hours, minutes, seconds] = time.booking_time.split(":");
        return setHours(setMinutes(new Date(time.booking_date), minutes), hours);
      });
      // Set booked timing state
      setBookedTime(bookedTiming);
    } catch (error) {
      if (error.response.status === 404) {
        // When no bookings found - Set empty array to booked timing state
        setBookedTime([]);
        console.error(error.response.data.Error);
      } else {
        console.error("Error fetching booking data:", error);
      }
    }
  };

  const filterDate = (date) => {
    // Disable date on weekends
    const weekendDays = [0, 6]; // Sunday and Saturday
    if (weekendDays.includes(date.getDay())) {
      return false;
    }

    // Disable date too if already past the excluded hours
    const isPastTime = new Date().getTime() > date.getTime();
    return !isPastTime;
  };

  const handleDateChange = (selectDate) => {
    setSelectedDate(selectDate);
    setSelectedTime(null);
  };

  const handleTimeChange = (selectTime) => {
    setSelectedTime(selectTime);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const bookingDate = moment(selectedDate).format("YYYY-MM-DD");
    const bookingTime = new Date(selectedTime).toLocaleTimeString();
    const bookingTimestamp = new Date(`${bookingDate}T${bookingTime}`).toISOString();

    try {
      const response = await axios.post(
        `${API_URL}/bookings`,
        {
          booking_description: bookingDescription,
          booking_email: bookingEmail,
          booking_phone: bookingPhone,
          booking_date: bookingDate,
          booking_time: bookingTime,
          booking_timestamp: bookingTimestamp,
          is_emailed: false,
          uid: authUser.uid,
        },
        {
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Reset form state
      setBookingDescription("");
      setBookingEmail("");
      setBookingPhone("");
      setSelectedDate(null);
      setSelectedTime(null);

      // Callback function
      onSuccess();
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const handleEditBooking = async (e) => {
    e.preventDefault();
    const bookingDate = moment(selectedDate).format("YYYY-MM-DD");
    const bookingTime = new Date(selectedTime).toLocaleTimeString();
    const bookingTimestamp = new Date(`${bookingDate}T${bookingTime}`).toISOString();

    try {
      const response = await axios.put(
        `${API_URL}/bookings/${bookingId}`,
        {
          description: bookingDescription,
          booking_email: bookingEmail,
          booking_phone: bookingPhone,
          booking_date: bookingDate,
          booking_time: bookingTime,
          booking_timestamp: bookingTimestamp,
        },
        {
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Callback function
      handleCloseModal();
      onSuccess();
    } catch (error) {
      console.error("Error editing booking:", error);
    }
  };

  return (
    <Container className="border border-1 rounded-5 p-3 mb-3">
      <h2>{mode === "create" ? "Create" : "Update"} Booking</h2>
      <Form className="text-start" onSubmit={mode === "create" ? handleCreateBooking : handleEditBooking}>
        <Form.Group className="mb-3" controlId="formDesc">
          <Form.Label>Description</Form.Label>
          <Form.Control type="text" placeholder="Enter Description" value={bookingDescription} onChange={(e) => setBookingDescription(e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" placeholder="Enter Email" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPhone">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control type="tel" placeholder="Enter Phone" value={bookingPhone} onChange={(e) => setBookingPhone(e.target.value)} maxLength="10" required />
        </Form.Group>

        <Form.Group className="mb-3 d-flex flex-column" controlId="formDate">
          <Form.Label>Date</Form.Label>
          <DatePicker id="formDate" className="form-control" placeholderText="Select a date" selected={selectedDate} minDate={new Date()} filterDate={filterDate} dateFormat="MMMM d, yyyy" closeOnScroll={true} shouldCloseOnSelect={true} onChange={handleDateChange} autoComplete="off" required />
        </Form.Group>

        <Form.Group className="mb-3 d-flex flex-column" controlId="formTime">
          <Form.Label>Time</Form.Label>
          <DatePicker id="formTime" className="form-control" disabled={!selectedDate} placeholderText="Select available time" showTimeSelect showTimeSelectOnly selected={selectedTime} minTime={setHours(setMinutes(new Date(), 0), 10)} maxTime={setHours(setMinutes(new Date(), 30), 17)} excludeTimes={bookedTime} dateFormat="h:mm aa" onChange={handleTimeChange} autoComplete="off" required />
        </Form.Group>

        <Button type="submit">{mode === "create" ? "Create" : "Update"} Booking</Button>
      </Form>
    </Container>
  );
};

export default BookingForm;
