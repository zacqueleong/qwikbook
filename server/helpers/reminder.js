const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const moment = require("moment");
require("dotenv").config();
const { SMTP_HOST, SMTP_PORT, SMTP_EMAIL_USER, SMTP_EMAIL_PASS, API_URL } =
  process.env;

// Function to check and send Reminder Email
async function checkBookingTime() {
  try {
    const checkTimestamp = moment();
    const reminderLeadDays = 1;
    
    // Advance timestamp with reminderLeadDays
    checkTimestamp.add(reminderLeadDays, 'days');
    
    // Format date and time accordingly
    const checkDate = checkTimestamp.format("YYYYMMDD");
    const checkTime = checkTimestamp.utcOffset('+08:00').format("HH:mm:ss");
   
    // Call API to query with checkDate and checkTime
    const response = await fetch(
      `${API_URL}/bookings?bookingDate=${checkDate}&bookingTime=${checkTime}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    const result = await response.json();

    // Check response
    if (response.status === 404) {
      console.log(result);
    } else if (response.ok) {
      result.forEach((item) => {
        // Declare and format variables
        const bookingdate = moment(item.booking_date).format("DD/MM/YYYY");
        const bookingtime = moment(item.booking_time, "HH:mm:ss").format("h:mm A");

        // Compare timestamp difference 
        const bookingTimestamp = moment(item.booking_timestamp);
        const timeDiffInHours = bookingTimestamp.diff(
          checkTimestamp,
          "hours",
        );

        // Send email if reminder not yet sent and timestamp difference is less than 24 hours (1 day)
        if (!item.is_emailed && timeDiffInHours >= 0 && timeDiffInHours < 24) {
          sendEmail(
            item.id,
            item.username,
            item.booking_email,
            bookingdate,
            bookingtime,
          );
        }
      });
    } else {
      console.error("Request failed with status:", response.status);
    }
  } catch (error) {
    console.error("Error fetching booking data:", error);
  }
}

// Function to send Email
function sendEmail(id, user, receiver, bookdate, booktime) {
  // Define Nodemailer transport object
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_EMAIL_USER,
      pass: SMTP_EMAIL_PASS,
    },
  });

  // Define Mailgen object
  const MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Qwikbook",
      link: "https://www.google.com",
    },
  });

  // Define email content and generate email in HTML and Plaintext.
  const email = {
    body: {
      name: `${user}`,
      intro: `You have made an appointment scheduled today at ${bookdate} ${booktime}.`,
      table: {
        data: [
          {
            date: `${bookdate}`,
            time: `${booktime}`,
          },
        ],
      },
      outro: "See you soon!",
    },
  };

  // Define email parameters
  const emailSender = "lessie.quitzon85@ethereal.email"; // Use lessie.quitzon85@ethereal.email for testing / proof of concept
  const emailReceiver = receiver;
  const emailSubject = "Qwikbook : Upcoming Appointment";
  const emailHTML = MailGenerator.generate(email);
  const emailText = MailGenerator.generatePlaintext(email);

  // Define mail options
  const mailOptions = {
    from: emailSender,
    to: emailReceiver,
    subject: emailSubject,
    html: emailHTML,
    text: emailText,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
      console.log("Email Preview URL: " + nodemailer.getTestMessageUrl(info));
      updateSentStatus(id);
    }
  });
}

async function updateSentStatus(id) {
  try {
    // Call API to Update Booking is_emailed status to True
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_emailed: true }),
    });

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error("Error updating booking", error);
  }
}

module.exports = {
  checkBookingTime,
};