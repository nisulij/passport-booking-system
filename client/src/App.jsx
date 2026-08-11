import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import PassportServices from "./pages/PassportServices";
import IndividualBooking from "./pages/IndividualBooking";
import FamilyBooking from "./pages/FamilyBooking";

import BirthCertificateBooking from "./pages/BirthCertificateBooking";
import OtherServicesBooking from "./pages/OtherServicesBooking";

import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/passport" element={<PassportServices />} />
        <Route path="/individual" element={<IndividualBooking />} />
        <Route path="/family" element={<FamilyBooking />} />

        <Route
          path="/birth-certificate"
          element={<BirthCertificateBooking />}
        />

        <Route
          path="/other-services"
          element={<OtherServicesBooking />}
        />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;