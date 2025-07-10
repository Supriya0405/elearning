import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  MdBook, 
  MdAssignment, 
  MdGrade, 
  MdSchool, 
  MdDownload,
  MdPlayCircle
} from 'react-icons/md';
import './courseDetails.css';

const CourseDetails = () => {
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = useState('notes');

  // Mock data - Replace with actual API calls
  const courseData = {
    title: "React Fundamentals",
    description: "Learn the fundamentals of React development",
    instructor: "John Doe",
    notes: [
      { id: 1, title: "Introduction to React", file: "intro.pdf", date: "2025-04-01" },
      { id: 2, title: "Components and Props", file: "components.pdf", date: "2025-04-02" },
      { id: 3, title: "State Management", file: "state.pdf", date: "2025-04-03" }
    ],
    assignments: [
      { id: 1, title: "Build a Counter App", deadline: "2025-04-15", status: "Pending" },
      { id: 2, title: "Todo List", deadline: "2025-04-20", status: "Submitted" },
      { id: 3, title: "API Integration", deadline: "2025-04-25", status: "Graded" }
    ],
    marks: [
      { id: 1, title: "Assignment 1", score: 90, totalMarks: 100, feedback: "Excellent work!" },
      { id: 2, title: "Assignment 2", score: 85, totalMarks: 100, feedback: "Good effort" }
    ],
    certifications: [
      {
        id: 1,
        platform: "Udemy",
        title: "Advanced React Patterns",
        duration: "12 hours",
        link: "https://udemy.com/course/react-patterns"
      },
      {
        id: 2,
        platform: "Coursera",
        title: "React Testing",
        duration: "8 hours",
        link: "https://coursera.org/react-testing"
      }
    ]
  };

  return (
    <div className="course-details-container">
      <div className="course-header">
        <h1>{courseData.title}</h1>
        <p className="instructor">Instructor: {courseData.instructor}</p>
        <p className="description">{courseData.description}</p>
      </div>

      <div className="course-navigation">
        <button 
          className={`nav-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <MdBook /> Notes
        </button>
        <button 
          className={`nav-button ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <MdAssignment /> Assignments
        </button>
        <button 
          className={`nav-button ${activeTab === 'marks' ? 'active' : ''}`}
          onClick={() => setActiveTab('marks')}
        >
          <MdGrade /> Marks
        </button>
        <button 
          className={`nav-button ${activeTab === 'certifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('certifications')}
        >
          <MdSchool /> Certifications
        </button>
      </div>

      <div className="content-section">
        {activeTab === 'notes' && (
          <div className="notes-grid">
            {courseData.notes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-content">
                  <MdBook className="note-icon" />
                  <div className="note-info">
                    <h3>{note.title}</h3>
                    <p>Uploaded: {note.date}</p>
                  </div>
                </div>
                <button className="download-button">
                  <MdDownload /> Download
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-grid">
            {courseData.assignments.map(assignment => (
              <div key={assignment.id} className="assignment-card">
                <h3>{assignment.title}</h3>
                <div className="assignment-info">
                  <p>Deadline: {assignment.deadline}</p>
                  <span className={`status ${assignment.status.toLowerCase()}`}>
                    {assignment.status}
                  </span>
                </div>
                <div className="assignment-actions">
                  <button className="view-button">View Details</button>
                  {assignment.status === 'Pending' && (
                    <button className="submit-button">Submit</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="marks-grid">
            {courseData.marks.map(mark => (
              <div key={mark.id} className="mark-card">
                <h3>{mark.title}</h3>
                <div className="score-section">
                  <div className="score-circle">
                    <span className="score">{mark.score}</span>
                    <span className="total">/{mark.totalMarks}</span>
                  </div>
                </div>
                <div className="feedback">
                  <h4>Feedback:</h4>
                  <p>{mark.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="certifications-grid">
            {courseData.certifications.map(cert => (
              <div key={cert.id} className="certification-card">
                <div className="cert-platform">{cert.platform}</div>
                <h3>{cert.title}</h3>
                <p className="duration">
                  <MdPlayCircle /> {cert.duration}
                </p>
                <a 
                  href={cert.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="enroll-button"
                >
                  Enroll Now
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
