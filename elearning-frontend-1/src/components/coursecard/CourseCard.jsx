import React, { useState } from "react";
import "./courseCard.css";
import { server } from "../../main";
import { UserData } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { CourseData } from "../../context/CourseContext";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const { user, isAuth } = UserData();
  const { fetchCourses } = CourseData();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteHandler = async (id) => {
    if (window.confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      try {
        setIsDeleting(true);
        const { data } = await axios.delete(`${server}/api/course/${id}`, {
          headers: {
            token: localStorage.getItem("token"),
          },
        });

        toast.success(data.message || "Course deleted successfully");
        // Refresh the course list
        fetchCourses();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error.response?.data?.message || "Failed to delete course");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Calculate rating stars
  

  return (
    <div className="course-card">
      <img src={`${server}/${course.image}`} alt="" className="course-image" />
      <h3>{course.title}</h3>
      <p className="instructor">Instructor: {course.createdBy}</p>
      <div className="course-details">
        <p className="description">{course.description?.length > 100 
          ? `${course.description.substring(0, 100)}...` 
          : course.description}</p>
        <div className="course-meta">
          <p><i className="far fa-clock"></i> Duration: {course.duration} weeks</p>
          {course.topics && course.topics.length > 0 && (
            <p><i className="fas fa-book"></i> Topics: {course.topics.length}</p>
          )}
        </div>
      </div>
      
      {/* Rating Section */}
      

      {/* Tags or Badges */}
      <div className="tags">
        {course.tags && course.tags.map((tag, index) => (
          <span key={index} className="tag">{tag}</span>
        ))}
      </div>

      {/* Conditional rendering for authenticated users */}
      {isAuth ? (
        <>
          {user && user.role === "admin" ? (
            <div className="admin-actions">
              <button
                onClick={() => navigate(`/course/study/${course._id}`)}
                className="common-btn"
              >
                Edit
              </button>
              <button
                onClick={() => deleteHandler(course._id)}
                className="common-btn delete-btn"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate(`/course/study/${course._id}`)}
              className="common-btn"
            >
              View Course
            </button>
          )}
        </>
      ) : (
        <button onClick={() => navigate("/login")} className="common-btn">
          Login to View
        </button>
      )}
    </div>
  );
};

export default CourseCard;
