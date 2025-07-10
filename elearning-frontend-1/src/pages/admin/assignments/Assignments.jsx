import React, { useState, useEffect } from 'react';
import { MdAdd, MdAssignment, MdDelete, MdDownload, MdGrade, MdPerson, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';
import './assignments.css';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [students, setStudents] = useState({});
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
        // Fetch submissions for each assignment
        data.forEach(assignment => {
          fetchSubmissions(assignment._id);
        });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Error loading assignments');
    }
  };

  const fetchStudentDetails = async (studentId) => {
    if (students[studentId]) return; // Don't fetch if we already have the details

    try {
      const response = await fetch(`http://localhost:5001/api/users/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(prev => ({
          ...prev,
          [studentId]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/assignments/${assignmentId}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(prev => ({
          ...prev,
          [assignmentId]: data
        }));
        // Fetch student details for each submission
        data.forEach(submission => {
          fetchStudentDetails(submission.studentId);
        });
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !dueDate || !selectedFile) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('dueDate', dueDate);
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:5001/api/assignments', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Assignment uploaded successfully');
        setTitle('');
        setDueDate('');
        setSelectedFile(null);
        fetchAssignments();
      } else {
        toast.error('Failed to upload assignment');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, marks, feedback) => {
    try {
      if (!window.confirm(`Are you sure you want to ${marks ? 'update' : 'assign'} the grade?`)) {
        return;
      }

      const response = await fetch(`http://localhost:5001/api/assignments/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marks, feedback }),
      });

      if (response.ok) {
        toast.success(`Grade ${marks ? 'updated' : 'assigned'} successfully`);
        // Refresh submissions for this assignment
        assignments.forEach(assignment => {
          fetchSubmissions(assignment._id);
        });
      } else {
        toast.error('Failed to grade submission');
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Error grading submission');
    }
  };

  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <h2>Manage Assignments</h2>
      </div>

      <div className="upload-section">
        <h3>Upload New Assignment</h3>
        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="text"
            placeholder="Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Assignment'}
            <MdAdd />
          </button>
        </form>
      </div>

      <div className="assignments-list">
        <h3>Uploaded Assignments</h3>
        {assignments.map((assignment) => (
          <div key={assignment._id} className="assignment-item">
            <div className="assignment-header">
              <h4>{assignment.title}</h4>
              <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
            </div>
            
            <div className="assignment-actions">
              <a
                href={`http://localhost:5001/uploads/${assignment.fileName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-button"
              >
                View Assignment <MdDownload />
              </a>
            </div>

            <div className="submissions-section">
              <h5>Student Submissions ({submissions[assignment._id]?.length || 0})</h5>
              {submissions[assignment._id]?.length > 0 ? (
                <div className="submissions-list">
                  {submissions[assignment._id].map((submission) => {
                    const student = students[submission.studentId];
                    
                    return (
                      <div key={submission._id} className="submission-item">
                        <div className="submission-info">
                          <div className="student-details">
                            <MdPerson className="student-icon" />
                            <div>
                              <h6>{student ? `${student.name}` : 'Loading...'}</h6>
                              <p>Student ID: {submission.studentId}</p>
                              <p>Email: {student?.email}</p>
                            </div>
                          </div>
                          <div className="submission-status">
                            <p className="submission-date">
                              Submitted: {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                            {submission.marks !== null && (
                              <p className="grade-status">
                                <MdCheck className="grade-icon" />
                                Current Grade: {submission.marks}/100
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="submission-actions">
                          <div className="pdf-actions">
                            <a
                              href={`http://localhost:5001/uploads/${submission.fileName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-button"
                            >
                              View Submission <MdDownload />
                            </a>
                          </div>
                          <div className="grading-form">
                            <div className="grade-input-group">
                              <label>Marks (out of 100):</label>
                              <input
                                type="number"
                                placeholder="Enter marks"
                                min="0"
                                max="100"
                                onChange={(e) => {
                                  const marks = parseInt(e.target.value);
                                  if (!isNaN(marks) && marks >= 0 && marks <= 100) {
                                    handleGradeSubmission(submission._id, marks, submission.feedback || '');
                                  }
                                }}
                                defaultValue={submission.marks}
                              />
                            </div>
                            <div className="feedback-input-group">
                              <label>Feedback for Student:</label>
                              <textarea
                                placeholder="Add your feedback here..."
                                onChange={(e) => {
                                  handleGradeSubmission(
                                    submission._id,
                                    submission.marks || 0,
                                    e.target.value
                                  );
                                }}
                                defaultValue={submission.feedback}
                              />
                            </div>
                            <button
                              onClick={() => handleGradeSubmission(
                                submission._id,
                                submission.marks || 0,
                                submission.feedback || ''
                              )}
                              className="grade-button"
                            >
                              {submission.marks !== null ? 'Update Grade' : 'Assign Grade'} <MdGrade />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-submissions">No submissions yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assignments; 