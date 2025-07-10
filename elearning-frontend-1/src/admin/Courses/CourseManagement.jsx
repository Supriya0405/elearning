import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseData } from '../../context/CourseContext';
import { UserData } from '../../context/UserContext';
import { server } from '../../main';
import axios from 'axios';
import toast from 'react-hot-toast';
import './coursemanagement.css';

const CourseManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { courses, fetchCourses } = CourseData();
  const { user } = UserData();
  const course = courses.find((c) => c._id === courseId);

  const [activeTab, setActiveTab] = useState('pdfs');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [marks, setMarks] = useState({
    studentId: user?._id || '',
    subject: '',
    marks: ''
  });
  const [isSubmittingMarks, setIsSubmittingMarks] = useState(false);
  const [certificationLink, setCertificationLink] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [pdfs, setPdfs] = useState([]);

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments();
    } else if (activeTab === 'pdfs') {
      fetchPDFs();
    }
  }, [activeTab]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${server}/api/assignments`);
      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Error loading assignments. Please try again.');
    }
  };

  const fetchPDFs = async () => {
    try {
      const response = await fetch(`${server}/api/course-pdfs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDFs: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setPdfs(data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast.error('Error loading PDFs. Please try again.');
    }
  };

  if (!course) {
    return <div>Course not found</div>;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
      toast.success('PDF file selected');
    }
  };

  const handleUploadPdf = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name.split('.')[0] || 'Course PDF');

      console.log('Attempting to upload file:', selectedFile.name);
      console.log('File size:', selectedFile.size);
      console.log('File type:', selectedFile.type);

      const response = await fetch(`${server}/api/course-pdfs`, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        throw new Error(
          errorData?.error || 
          `Upload failed with status ${response.status}: ${response.statusText}`
        );
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      toast.success('PDF uploaded successfully');
      setSelectedFile(null);
      fetchPDFs();
    } catch (error) {
      console.error('Detailed upload error:', error);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message.includes('413')) {
        toast.error('File is too large. Please select a smaller file.');
      } else {
        toast.error(`Error uploading PDF: ${error.message || 'Unknown error'}`);
      }
      
      toast.custom((t) => (
        <div className="retry-toast">
          <p>Upload failed. Would you like to try again?</p>
          <button onClick={() => {
            toast.dismiss(t.id);
            handleUploadPdf();
          }}>
            Retry
          </button>
        </div>
      ), { duration: 5000 });
    } finally {
      setUploading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!assignmentTitle || !assignmentDeadline || !selectedFile) {
      toast.error('Please fill all assignment details');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', assignmentTitle);
      formData.append('dueDate', new Date(assignmentDeadline).toISOString());

      console.log('Uploading file:', selectedFile.name);
      console.log('Title:', assignmentTitle);
      console.log('Due Date:', assignmentDeadline);

      const response = await fetch(`${server}/api/assignments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        throw new Error(
          errorData?.error || 
          `Assignment upload failed with status ${response.status}: ${response.statusText}`
        );
      }
      
      const data = await response.json();
      console.log('Server response:', data);
      
      toast.success('Assignment added successfully');
      setSelectedFile(null);
      setAssignmentTitle('');
      setAssignmentDeadline('');
      fetchAssignments();
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message.includes('413')) {
        toast.error('File is too large. Please select a smaller file.');
      } else {
        toast.error(`Error adding assignment: ${error.message || 'Unknown error'}`);
      }
      
      toast.custom((t) => (
        <div className="retry-toast">
          <p>Assignment upload failed. Would you like to try again?</p>
          <button onClick={() => {
            toast.dismiss(t.id);
            handleAddAssignment();
          }}>
            Retry
          </button>
        </div>
      ), { duration: 5000 });
    } finally {
      setUploading(false);
    }
  };

  const handleAddMarks = async () => {
    if (!marks.studentId || !marks.subject || !marks.marks) {
      toast.error('Please fill all marks details');
      return;
    }

    console.log('Submitting marks data:', marks);
    toast.loading('Adding marks...');
    setIsSubmittingMarks(true);

    try {
      console.log('Making API request to:', `${server}/api/marks`);
      const response = await fetch(`${server}/api/marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(marks)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        throw new Error(
          errorData?.error || 
          `Failed to add marks with status ${response.status}: ${response.statusText}`
        );
      }
      
      const data = await response.json();
      console.log('Server response for marks:', data);
      
      toast.dismiss();
      if (data.note && data.note.includes('file system only')) {
        toast.success('Marks added successfully (database connection issues, but data was saved)');
      } else {
        toast.success('Marks added successfully');
      }
      
      setMarks({ studentId: '', subject: '', marks: '' });
    } catch (error) {
      toast.dismiss();
      console.error('Error adding marks:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message.includes('timeout')) {
        toast.error('The operation timed out. The marks may still be saved.');
      } else {
        toast.error(`Error adding marks: ${error.message || 'Unknown error'}`);
      }
      
      toast.custom((t) => (
        <div className="retry-toast">
          <p>Failed to add marks. Would you like to try again?</p>
          <button onClick={() => {
            toast.dismiss(t.id);
            handleAddMarks();
          }}>
            Retry
          </button>
        </div>
      ), { duration: 5000 });
    } finally {
      setIsSubmittingMarks(false);
    }
  };

  const handleAddCertification = async () => {
    if (!certificationLink) {
      toast.error('Please enter certification link');
      return;
    }

    try {
      await axios.post(`${server}/api/course/${courseId}/certification`, {
        link: certificationLink,
      }, {
        headers: {
          token: localStorage.getItem('token'),
        },
      });

      toast.success('Certification link added successfully');
      setCertificationLink('');
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding certification');
    }
  };

  return (
    <div className="course-management">
      <div className="course-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
        <h1>{course.title}</h1>
      </div>

      <div className="management-tabs">
        <button
          className={`tab-btn ${activeTab === 'pdfs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdfs')}
        >
          Course PDFs
        </button>
        <button
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </button>
        <button
          className={`tab-btn ${activeTab === 'marks' ? 'active' : ''}`}
          onClick={() => setActiveTab('marks')}
        >
          Internal Marks
        </button>
        <button
          className={`tab-btn ${activeTab === 'certification' ? 'active' : ''}`}
          onClick={() => setActiveTab('certification')}
        >
          Certification
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'pdfs' && (
          <div className="pdfs-section">
            <h2>Upload Course PDFs</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUploadPdf();
            }} className="upload-form">
              <div className="form-group">
                <label htmlFor="pdf-file">Select PDF</label>
                <input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="file-input"
                  required
                />
                {selectedFile && (
                  <div className="selected-file">
                    Selected file: {selectedFile.name}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="common-btn"
                disabled={uploading || !selectedFile}
              >
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
            </form>
            
            <div className="uploaded-pdfs">
              <h3>Uploaded PDFs</h3>
              {pdfs.length > 0 ? (
                <ul>
                  {pdfs.map((pdf) => (
                    <li key={pdf._id}>
                      <a 
                        href={pdf.fileName && pdf.fileName.startsWith('sample') 
                          ? `https://via.placeholder.com/500x700?text=${encodeURIComponent(pdf.title || 'Sample PDF')}` 
                          : `${server}/uploads/${pdf.fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {pdf.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No PDFs uploaded yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-section">
            <h2>Add Assignment</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddAssignment();
            }} className="assignment-form">
              <div className="form-group">
                <label htmlFor="title">Assignment Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Enter assignment title"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Due Date</label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={assignmentDeadline}
                  onChange={(e) => setAssignmentDeadline(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pdf">PDF File</label>
                <input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="file-input"
                  required
                />
                {selectedFile && (
                  <div className="selected-file">
                    Selected file: {selectedFile.name}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="common-btn"
                disabled={uploading || !selectedFile || !assignmentTitle || !assignmentDeadline}
              >
                {uploading ? 'Uploading...' : 'Add Assignment'}
              </button>
            </form>

            <div className="assignments-list">
              <h3>Current Assignments</h3>
              {assignments.length > 0 ? (
                <ul>
                  {assignments.map((assignment) => (
                    <li key={assignment._id} className="assignment-item">
                      <div className="assignment-info">
                        <h4>{assignment.title}</h4>
                        <p>Due Date: {new Date(assignment.dueDate).toLocaleString()}</p>
                        <p>Uploaded: {new Date(assignment.uploadedAt).toLocaleString()}</p>
                      </div>
                      <div className="assignment-actions">
                        <a 
                          href={assignment.fileName && assignment.fileName.startsWith('sample') 
                            ? `https://via.placeholder.com/500x700?text=${encodeURIComponent(assignment.title || 'Sample Assignment')}` 
                            : `${server}/uploads/${assignment.fileName}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="view-button"
                        >
                          View PDF
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-assignments">No assignments added yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="marks-section">
            <h2>Add Internal Marks</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddMarks();
            }} className="marks-form">
              <div className="form-group">
                <label htmlFor="studentId">Student ID</label>
                <input
                  id="studentId"
                  type="text"
                  value={user?._id || marks.studentId}
                  onChange={(e) => setMarks({...marks, studentId: e.target.value})}
                  placeholder="Enter student ID"
                  className="text-input"
                  required
                  disabled={!!user || isSubmittingMarks}
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  type="text"
                  value={marks.subject}
                  onChange={(e) => setMarks({...marks, subject: e.target.value})}
                  placeholder="Enter subject"
                  className="text-input"
                  required
                  disabled={isSubmittingMarks}
                />
              </div>

              <div className="form-group">
                <label htmlFor="marks">Marks</label>
                <input
                  id="marks"
                  type="number"
                  value={marks.marks}
                  onChange={(e) => setMarks({...marks, marks: e.target.value})}
                  placeholder="Enter marks"
                  className="text-input"
                  min="0"
                  max="100"
                  required
                  disabled={isSubmittingMarks}
                />
              </div>

              <button 
                type="submit" 
                className="common-btn"
                disabled={isSubmittingMarks}
              >
                {isSubmittingMarks ? 'Adding Marks...' : 'Add Marks'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'certification' && (
          <div className="certification-section">
            <h2>Add Certification</h2>
            <input
              type="url"
              placeholder="Certification Link (e.g., Udemy)"
              value={certificationLink}
              onChange={(e) => setCertificationLink(e.target.value)}
              className="text-input"
            />
            <button className="common-btn" onClick={handleAddCertification}>
              Add Certification Link
            </button>

            <div className="certifications-list">
              <h3>Available Certifications</h3>
              {course.certifications && course.certifications.length > 0 ? (
                <ul>
                  {course.certifications.map((cert, index) => (
                    <li key={index}>
                      <a href={cert.link} target="_blank" rel="noopener noreferrer">
                        Certification {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No certifications added yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;
