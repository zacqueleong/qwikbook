import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, FloatingLabel, Spinner } from "react-bootstrap";
import useSignIn from "react-auth-kit/hooks/useSignIn";
import axios from "axios";
import Cookies from "js-cookie";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const signIn = useSignIn();

  useEffect(() => {
    deleteRefreshCookie();
  }, []);

  // Delete refresh token cookie if it exists
  const deleteRefreshCookie = () => {
    if (Cookies.get("_auth_refresh")) {
      Cookies.remove("_auth_refresh");
    }
  };

  const handleRegisterBtn = () => {
    navigate("/register");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/login`,
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

      signIn({
        auth: {
          token: response.data.token,
        },
        refresh: response.data.refreshToken,
        userState: { uid: response.data.uid, name: response.data.username },
      });

      navigate("/");
    } catch (error) {
      console.error(error);
      alert(`${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container>
        <h1>Qwikbook</h1>
        <div>Login</div>
        <Form onSubmit={handleLoginSubmit}>
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
            <Button className="me-3" variant="outline-secondary" onClick={handleRegisterBtn}>
              Register
            </Button>
            <Button className="me-3" variant="secondary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" role="status" className="me-2" /> : "Login"}
            </Button>
          </Container>
        </Form>
      </Container>
    </>
  );
};

export default Login;
