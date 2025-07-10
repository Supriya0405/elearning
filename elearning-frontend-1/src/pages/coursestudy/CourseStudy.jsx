import React, { useEffect, useState } from "react";
import "./coursestudy.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../main";
import { 
  MdBook, 
  MdAssignment, 
  MdGrade, 
  MdSchool,
  MdPlayCircle,
  MdPerson,
  MdAccessTime,
  MdCheck,
  MdUpload,
  MdOpenInNew
} from 'react-icons/md';
import toast from 'react-hot-toast';

const CourseStudy = ({ user }) => {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('notes');
  const { fetchCourse, course } = CourseData();
  const navigate = useNavigate();

  // State for PDFs, assignments, and marks
  const [pdfs, setPdfs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState({});

  useEffect(() => {
    fetchCourse(params.id);
  }, []);

  useEffect(() => {
    if (activeTab === 'notes') {
      fetchPDFs();
    } else if (activeTab === 'assignments') {
      Promise.all([
        fetchAssignments(),
        fetchMySubmissions(),
        fetchMarks()
      ]).catch(error => {
        console.error('Error loading assignment data:', error);
        toast.error('Failed to load some assignment data');
      });
    } else if (activeTab === 'marks') {
      fetchMarks();
    }
  }, [activeTab]);

  const fetchPDFs = async () => {
    try {
      const response = await fetch('https://elearning-wr32.onrender.com/api/course-pdfs');
      const data = await response.json();
      if (response.ok) {
        setPdfs(data);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast.error('Error loading PDFs');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch('https://elearning-wr32.onrender.com/api/assignments');
      const data = await response.json();
      if (response.ok) {
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Error loading assignments');
    }
  };

  const fetchMarks = async () => {
    try {
      const response = await fetch('https://elearning-wr32.onrender.com/api/marks');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        toast.error(`Error loading marks: ${errorData.message || 'Unknown error'}`);
        return;
      }
      const data = await response.json();
      console.log('Fetched marks:', data); // Debug log
      setMarks(data);
    } catch (error) {
      console.error('Error fetching marks:', error);
      toast.error('Failed to load marks. Please try again.');
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const response = await fetch(`https://elearning-wr32.onrender.com/api/assignments/submissions/${user._id}`);
      const data = await response.json();
      if (response.ok) {
        // Convert array to object with assignmentId as key
        const submissionsMap = {};
        data.forEach(submission => {
          submissionsMap[submission.assignmentId] = submission;
        });
        setMySubmissions(submissionsMap);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Error loading submissions');
    }
  };

  const handleFileChange = (e, assignmentId) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile({
        assignmentId,
        file
      });
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    if (!selectedFile || selectedFile.assignmentId !== assignmentId) {
      toast.error('Please select a file to submit');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', selectedFile.file);
    formData.append('studentId', user._id);

    try {
      const response = await fetch(`https://elearning-wr32.onrender.com/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Assignment submitted successfully');
        setSelectedFile(null);
      } else {
        toast.error('Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Error submitting assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {course && (
        <div className="course-study-page">
          <div className="course-header">
            <img src={`${server}/${course.image}`} alt="" className="course-image" />
            <div className="course-info">
              <h2>{course.title}</h2>
              <div className="course-meta">
                <div className="instructor-info">
                  <MdPerson className="meta-icon" />
                  <span>Instructor: {course.createdBy}</span>
                </div>
                <div className="duration-info">
                  <MdAccessTime className="meta-icon" />
                  <span>Duration: {course.duration} weeks</span>
                </div>
                {course.topics && course.topics.length > 0 && (
                  <div className="topics-info">
                    <MdBook className="meta-icon" />
                    <span>Topics: {course.topics.length}</span>
                  </div>
                )}
              </div>
              <div className="course-description">
                <h3>About this course</h3>
                <p>{course.description}</p>
                {course.objectives && (
                  <div className="course-objectives">
                    <h4>What you'll learn</h4>
                    <ul>
                      {course.objectives.map((objective, index) => (
                        <li key={index}><MdCheck className="check-icon" /> {objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="course-navigation">
            <button 
              className={`nav-button ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <MdBook /> Course PDFs
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
              <MdGrade /> Internal Marks
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
                {pdfs.length > 0 ? (
                  pdfs.map((pdf) => (
                    <div key={pdf._id} className="note-card">
                      <MdBook className="note-icon" />
                      <div className="note-info">
                        <h3>{pdf.title || 'Course PDF'}</h3>
                        <p>Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <a 
                        href={`https://elearning-wr32.onrender.com/uploads/${pdf.fileName}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-button"
                      >
                        View PDF
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <MdBook className="empty-icon" />
                    <h3>No PDFs Available</h3>
                    <p>Your faculty hasn't uploaded any PDFs for this course yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="assignments-grid">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const mySubmission = mySubmissions[assignment._id];
                    const assignmentMarks = marks.find(mark => 
                      mark.assignmentId === assignment._id && 
                      mark.studentId === user._id
                    );
                    
                    return (
                      <div key={assignment._id} className="assignment-card">
                        <div className="assignment-info">
                          <h3>{assignment.title}</h3>
                          <p>{assignment.description}</p>
                          <p>Due Date: {new Date(assignment.dueDate).toLocaleString()}</p>
                          <p>Uploaded: {new Date(assignment.uploadedAt).toLocaleString()}</p>
                        </div>
                        <div className="assignment-actions">
                          <a 
                            href={`https://elearning-wr32.onrender.com/uploads/${assignment.fileName}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="view-button"
                          >
                            View Assignment <MdOpenInNew />
                          </a>
                          {mySubmission && (
                            <div className="submission-info">
                              <p className="submission-status">
                                <MdCheck className="status-icon submitted" /> 
                                Submitted on {new Date(mySubmission.submittedAt).toLocaleString()}
                              </p>
                              <a 
                                href={`https://elearning-wr32.onrender.com/uploads/${mySubmission.fileName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-button"
                              >
                                View My Submission <MdOpenInNew />
                              </a>
                              {mySubmission.marks !== undefined ? (
                                <div className="marks-info">
                                  <h4>Marks and Feedback</h4>
                                  <p>Score: <span className="marks">{mySubmission.marks}</span></p>
                                  {mySubmission.feedback && (
                                    <div className="feedback">
                                      <p><strong>Feedback:</strong></p>
                                      <p>{mySubmission.feedback}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="pending-grade">Your submission is being reviewed</p>
                              )}
                            </div>
                          )}
                          {!mySubmission && (
                            <div className="submission-form">
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, assignment._id)}
                                className="file-input"
                              />
                              <button 
                                onClick={() => handleSubmitAssignment(assignment._id)}
                                disabled={!selectedFile || submitting}
                                className="view-button"
                              >
                                {submitting ? 'Submitting...' : 'Submit Assignment'} {!submitting && <MdUpload />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <MdAssignment className="empty-icon" />
                    <h3>No Assignments Available</h3>
                    <p>Your faculty hasn't uploaded any assignments for this course yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'marks' && (
              <div className="marks-grid">
                {marks.length > 0 ? (
                  marks.map((mark) => (
                    <div key={mark._id} className="mark-card">
                      <h3>Student ID: {mark.studentId}</h3>
                      <div className="mark-info">
                        <p>Subject: {mark.subject}</p>
                        <p>Marks: {mark.marks}</p>
                        <p>Date: {new Date(mark.uploadedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <MdGrade className="empty-icon" />
                    <h3>No Marks Available</h3>
                    <p>Your faculty hasn't uploaded any marks for this course yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certifications' && (
              <div className="certifications-grid">
                {course.certifications && course.certifications.length > 0 ? (
                  course.certifications.map((cert, index) => (
                    <div key={index} className="certification-card">
                      <MdSchool className="cert-icon" />
                      <div className="cert-info">
                        <h3>Certification {index + 1}</h3>
                        <p><MdPlayCircle /> External Certification</p>
                      </div>
                      <a 
                        href={cert.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view-button"
                      >
                        View Certificate
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <MdSchool className="empty-icon" />
                    <h3>No Certifications Available</h3>
                    <p>Your faculty hasn't added any certification courses yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CourseStudy;