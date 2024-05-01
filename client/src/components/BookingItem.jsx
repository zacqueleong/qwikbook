import { useState } from "react";
import { Button, Container, Modal } from "react-bootstrap";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import BookingForm from "./BookingForm";
import axios from "axios";
import moment from "moment";

const BookingItem = ({ onSuccess, booking }) => {
  const [showModal, setShowModal] = useState(false);
  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const authHeader = useAuthHeader();
  const authToken = authHeader.split(" ")[1];

  const handleEditBooking = (id) => {
    handleShowModal();
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      const response = await axios.delete(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });
      onSuccess();
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  return (
    <>
      <li className="list-group-item list-group-item-action d-flex">
        <Container>
          <Container>{`Date: ${moment(booking.booking_date).format("DD/MM/YYYY")}`}</Container>
          <Container>{`Time: ${moment(booking.booking_time, "HH:mm:ss").format("h:mm A")}`}</Container>
          <Container>{booking.description} </Container>
        </Container>

        <Button className="m-1" variant="warning" onClick={() => handleEditBooking(booking.id)}>
          Edit
        </Button>

        <Button className="m-1" variant="danger" onClick={() => handleDeleteBooking(booking.id)}>
          Delete
        </Button>
      </li>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton />
        <Modal.Body>
          <BookingForm onSuccess={onSuccess} handleCloseModal={handleCloseModal} mode={"update"} bookingData={booking} />
        </Modal.Body>
        <Modal.Footer />
      </Modal>
    </>
  );
};

export default BookingItem;
