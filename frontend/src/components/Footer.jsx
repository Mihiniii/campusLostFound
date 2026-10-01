import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

const YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <Logo light />

          <p>
            Helping the campus community return lost belongings
            to their owners.
          </p>
        </div>

        <div className="footer-column">
          <h4>Browse</h4>

          <Link to="/lost-items">Lost Items</Link>
          <Link to="/found-items">Found Items</Link>
          <Link to="/">Search</Link>
        </div>

        <div className="footer-column">
          <h4>Report</h4>

          <Link to="/report-lost">Report Lost Item</Link>
          <Link to="/report-found">Report Found Item</Link>
          <Link to="/my-reports">My Reports</Link>
        </div>

        <div className="footer-column">
          <h4>Account</h4>

          <Link to="/login">Login</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/messages">Messages</Link>
        </div>

      </div>

      <div className="footer-bottom">
        © {YEAR} Campus Lost & Found
      </div>
    </footer>
  );
}

export default Footer;
