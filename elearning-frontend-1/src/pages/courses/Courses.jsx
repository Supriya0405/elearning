import React, { useState } from "react";
import "./courses.css";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/coursecard/CourseCard";

const Courses = () => {
  const { courses } = CourseData();
  const [searchQuery, setSearchQuery] = useState(""); // State to hold the search query


  const categories = [...new Set(courses.map((course) => course.category))];


  const popularCourses = [...courses]
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 5);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="courses">
      <h2>Available Courses</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

 
      {searchQuery && filteredCourses.length > 0 && (
        <div className="filtered-courses">
          <h3>Search Results</h3>
          <div className="course-container">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      )}

      <div className="popular-courses">
        <h3>Popular Courses</h3>
        <div className="course-container">
          {popularCourses.length > 0 ? (
            popularCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))
          ) : (
            <p>No popular courses yet!</p>
          )}
        </div>
      </div>

      <div className="course-categories">
        {categories.map((category, index) => {
          const categoryCourses = filteredCourses.filter(
            (course) => course.category === category
          );

          return (
            <div key={index} className="category-section">
              <h3>{category}</h3>
              <div className="course-container">
                {categoryCourses.length > 0 ? (
                  categoryCourses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))
                ) : (
                  <p>No courses available in this category.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Courses;
