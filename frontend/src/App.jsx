import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import LostItems from "./pages/LostItems.jsx";
import FoundItems from "./pages/FoundItems.jsx";
import ReportLostItem from "./pages/ReportLostItem.jsx";
import ReportFoundItem from "./pages/ReportFoundItem.jsx";
import ItemDetails from "./pages/ItemDetails.jsx";
import EditItem from "./pages/EditItem.jsx";
import MyReports from "./pages/MyReports.jsx";
import Inbox from "./pages/Inbox";
import Admin from "./pages/Admin.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/lost-items" element={<LostItems />} />
        <Route path="/found-items" element={<FoundItems />} />
        <Route path="/report-lost" element={<ReportLostItem />} />
        <Route path="/report-found" element={<ReportFoundItem />} />
        <Route path="/item/:id" element={<ItemDetails />} />
        <Route path="/edit-item/:id" element={<EditItem />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/messages" element={<Inbox />} />
        <Route path="/admin" element={<Admin />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
