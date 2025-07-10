import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { server } from "../main";
import toast from "react-hot-toast";

const CourseContext = createContext();

// Mock data to use when running against local backend that doesn't have course endpoints
const mockCourses = [
  {
    _id: "mock-course-1",
    title: "Sample Course 1",
    description: "This is a sample course for local development",
    createdBy: "Local Admin",
    price: 0,
    thumbnail: {
      url: "https://via.placeholder.com/300x200?text=Sample+Course+1"
    }
  },
  {
    _id: "mock-course-2",
    title: "Sample Course 2",
    description: "Another sample course for testing",
    createdBy: "Local Admin",
    price: 0,
    thumbnail: {
      url: "https://via.placeholder.com/300x200?text=Sample+Course+2"
    }
  }
];

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState([]);
  const [mycourse, setMyCourse] = useState([]);
  const [isLocalMode, setIsLocalMode] = useState(false);

  async function fetchCourses() {
    try {
      const { data } = await axios.get(`${server}/api/course/all`);
      setCourses(data.courses);
    } catch (error) {
      console.log(error);
      // If we're using local backend, use mock data
      if (error.response && error.response.status === 404) {
        console.log("Using mock course data for local development");
        setIsLocalMode(true);
        setCourses(mockCourses);
      }
    }
  }

  async function fetchCourse(id) {
    try {
      // If we're in local mode, return a mock course
      if (isLocalMode) {
        const mockCourse = mockCourses.find(c => c._id === id) || mockCourses[0];
        setCourse(mockCourse);
        return;
      }

      const { data } = await axios.get(`${server}/api/course/${id}`);
      setCourse(data.course);
    } catch (error) {
      console.log(error);
      // If course doesn't exist, show a toast and use mock data
      if (error.response && error.response.status === 404) {
        console.log("Using mock course data for local development");
        const mockCourse = mockCourses.find(c => c._id === id) || mockCourses[0];
        setCourse(mockCourse);
      }
    }
  }

  async function fetchMyCourse() {
    try {
      // If we're in local mode, return mock courses
      if (isLocalMode) {
        setMyCourse(mockCourses);
        return;
      }

      const { data } = await axios.get(`${server}/api/mycourse`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      setMyCourse(data.courses);
    } catch (error) {
      console.log(error);
      // If endpoint doesn't exist, use mock data
      if (error.response && error.response.status === 404) {
        console.log("Using mock enrolled courses for local development");
        setMyCourse(mockCourses);
      }
    }
  }

  useEffect(() => {
    fetchCourses();
    fetchMyCourse();
  }, []);
  
  return (
    <CourseContext.Provider
      value={{
        courses,
        fetchCourses,
        fetchCourse,
        course,
        mycourse,
        fetchMyCourse,
        isLocalMode
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);