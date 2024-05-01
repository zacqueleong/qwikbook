import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, FloatingLabel } from "react-bootstrap";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/register`,
        {
          username: username,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      alert(`Registration successful! Please proceed to login.`);
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(`${error}`);
    }
  };

  const handleBackBtn = () => {
    navigate("/login");
  };

  return (
    <>
      <Container>
        <h1>Qwikbook</h1>
        <div>Register</div>
        <Form onSubmit={handleRegisterSubmit}>
          <Form.Group className="mb-3" controlId="formBasicUsername">
            <FloatingLabel controlId="floatingUsername" label="Username">
              <Form.Control type="text" placeholder="Enter Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </FloatingLabel>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <FloatingLabel controlId="floatingPassword" label="Password">
              <Form.Control type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FloatingLabel>
          </Form.Group>

          <Container className="d-flex justify-content-center">
            <Button className="me-3" variant="outline-secondary" onClick={handleBackBtn}>
              Back
            </Button>
            <Button className="me-3" variant="secondary" type="submit">
              Register
            </Button>
          </Container>
        </Form>
      </Container>
    </>
  );
};

export default Register;
