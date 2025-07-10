import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "../../images/clg_logo.png";
import "./header.css";

const Header = ({ isAuth, user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Redirect to home page
    navigate('/');
    // Reload the page to reset all states
    window.location.reload();
  };

  return (
    <header>
      <Link to="/" className="logo">
        <img src={logoImage} alt="EshwarEdge Logo" className="logo-image" />
        EshwarEdge
      </Link>
      <div className="link">
        <Link to={"/"}>Home</Link>
        <Link to={"/courses"}>Courses</Link>
        {isAuth ? (
          <>
            <Link to={"/account"}>Account</Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <Link to={"/login"}>Login</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
