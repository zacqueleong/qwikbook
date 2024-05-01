import { Container } from "react-bootstrap";
import BookingItem from "./BookingItem";

const BookingList = ({ onSuccess, bookingData, authToken }) => {
  return (
    <>
      <Container className="border border-1 rounded-5 p-3 mb-3">
        <h2>Your Bookings</h2>
        <ul className="list-group list-group-flush">
          {bookingData && bookingData.length > 0 ? (
            bookingData.map((booking) => (
              <BookingItem key={booking.id} onSuccess={onSuccess} booking={booking} authToken={authToken} />
            ))
          ) : (
            <li className="list-group-item text-secondary">No bookings created yet!</li>
          )}  
        </ul>
      </Container>
    </>
  );
};

export default BookingList;
