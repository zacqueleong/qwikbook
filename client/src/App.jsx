import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AuthProvider from "react-auth-kit";
import createStore from "react-auth-kit/createStore";
import RequireAuth from "@auth-kit/react-router/RequireAuth";
import refresh from "./js/refresh";

const store = createStore({
  authType: "cookie",
  authName: "_auth",
  cookieDomain: window.location.hostname,
  cookieSecure: false,
  refresh: refresh
});

const App = () => {
  return (
    <AuthProvider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <RequireAuth fallbackPath="/login">
              <Home />
            </RequireAuth>}
          />
          <Route path="/" element={<Home />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/register" element={<Register />}></Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
