import React from "react";
import Sidebar from "./Sidebar";
import "./common.css";

const Layout = ({ children }) => {
  return (
    <div className="dashboard-admin">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content">{children}</div>
    </div>
  );
};

export default Layout;
