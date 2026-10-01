import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import LostItems from "./pages/LostItems.jsx";
import FoundItems from "./pages/FoundItems.jsx";
import ReportLostItem from "./pages/ReportLostItem.jsx";
import ReportFoundItem from "./pages/ReportFoundItem.jsx";
import ItemDetails from "./pages/ItemDetails.jsx";
import Inbox from "./pages/Inbox";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lost-items" element={<LostItems />} />
        <Route path="/found-items" element={<FoundItems />} />
        <Route path="/report-lost" element={<ReportLostItem />} />
        <Route path="/report-found" element={<ReportFoundItem />} />
        <Route path="/item/:id" element={<ItemDetails />} />
        <Route path="/messages" element={<Inbox />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;