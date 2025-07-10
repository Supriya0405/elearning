import React from "react";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/coursecard/CourseCard";
import "./admincourses.css";
import { useNavigate } from "react-router-dom";

const AvailableCourses = () => {
  const { courses } = CourseData();
  const navigate = useNavigate();

  const handleCourseClick = (courseId) => {
    navigate(`/admin/course/${courseId}`);
  };

  return (
    <div className="available-courses">
      <h1>Available Courses</h1>
      <div className="dashboard-content">
        {courses && courses.length > 0 ? (
          courses.map((course) => (
            <div key={course._id} onClick={() => handleCourseClick(course._id)}>
              <CourseCard course={course} />
            </div>
          ))
        ) : (
          <p>No Courses Yet</p>
        )}
      </div>
    </div>
  );
};

export default AvailableCourses;
