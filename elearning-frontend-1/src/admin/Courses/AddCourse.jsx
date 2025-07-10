import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { server } from "../../main";
import { CourseData } from "../../context/CourseContext";
import "./admincourses.css";

const AddCourse = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [image, setImage] = useState("");
  const [imagePrev, setImagePrev] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const { fetchCourses } = CourseData();

  const changeImageHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
      setImagePrev(reader.result);
      setImage(file);
    };
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    const myForm = new FormData();

    myForm.append("title", title);
    myForm.append("description", description);
    myForm.append("createdBy", createdBy);
    myForm.append("file", image);
    myForm.append("price", "0"); 
    myForm.append("duration", "4");
    myForm.append("category", "General");

    try {
      const { data } = await axios.post(`${server}/api/course/new`, myForm, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      toast.success(data.message);
      setBtnLoading(false);
      await fetchCourses();
      setImage("");
      setTitle("");
      setDescription("");
      setImagePrev("");
      setCreatedBy("");
    } catch (error) {
      toast.error(error.response.data.message);
      setBtnLoading(false);
    }
  };

  return (
    <div className="add-course">
      <div className="course-form">
        <h2>Add Course</h2>
        <form onSubmit={submitHandler}>
          <label>Faculty Name</label>
          <input
            type="text"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Enter faculty name"
            required
          />

          <label>Course Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter course title"
            required
          />

          <label>Course Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter course description"
            rows="4"
            required
          />

          <label>Course Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={changeImageHandler}
            required 
          />
          {imagePrev && <img src={imagePrev} alt="Course Preview" className="image-preview" />}

          <button type="submit" disabled={btnLoading} className="common-btn">
            {btnLoading ? "Creating Course..." : "Create Course"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;
