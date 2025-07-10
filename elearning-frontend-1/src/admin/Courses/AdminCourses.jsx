import React, { useState } from "react";
import Layout from "../Utils/Layout";
import { useNavigate } from "react-router-dom";
import AvailableCourses from "./AvailableCourses";
import AddCourse from "./AddCourse";
import "./admincourses.css";

const AdminCourses = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available");

  if (user && user.role !== "admin") return navigate("/");

  return (
    <Layout>
      <div className="admin-courses">
        <div className="course-tabs">
          <button
            className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available Courses
          </button>
          <button
            className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Course
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'available' && <AvailableCourses />}
          {activeTab === 'add' && <AddCourse />}
        </div>
      </div>
    </Layout>
  );
};

export default AdminCourses;