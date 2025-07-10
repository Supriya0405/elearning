import React, { useState, useRef, useEffect } from "react";
import { MdDashboard, MdEdit, MdEmail, MdClose, MdSave, MdAddAPhoto } from "react-icons/md";
import { FaUser, FaBookReader, FaCertificate, FaHistory } from "react-icons/fa";
import "./account.css";
import { IoMdLogOut } from "react-icons/io";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { server } from "../../main";

const Account = ({ user }) => {
  const { setIsAuth, setUser } = UserData();
  const { courses, fetchCourses } = CourseData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || null
  });
  const [previewImage, setPreviewImage] = useState(user?.profileImage || null);
  const [certificates, setCertificates] = useState([]);
  const [newCertificate, setNewCertificate] = useState({
    title: '',
    file: null,
    issueDate: ''
  });
  const certificateInputRef = useRef(null);

  const logoutHandler = () => {
    localStorage.clear();
    setUser([]);
    setIsAuth(false);
    toast.success("Logged Out");
    navigate("/login");
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedUser({
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    });
  };

  const handleSaveClick = () => {
    // Here you would typically make an API call to update the user info
    const updatedUser = { ...user, ...editedUser };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser({
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    });
    setPreviewImage(user.profileImage);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setEditedUser(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!newCertificate.title || !newCertificate.file || !newCertificate.issueDate) {
      toast.error('Please fill all certificate details');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newCertificate.title);
      formData.append('file', newCertificate.file);
      formData.append('issueDate', newCertificate.issueDate);

      const response = await fetch(`${server}/api/certificates/upload`, {
        method: 'POST',
        headers: {
          token: localStorage.getItem('token'),
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Certificate uploaded successfully');
        setCertificates([...certificates, data.certificate]);
        setNewCertificate({ title: '', file: null, issueDate: '' });
      } else {
        throw new Error(data.message || 'Error uploading certificate');
      }
    } catch (error) {
      toast.error(error.message || 'Error uploading certificate');
    }
  };

  const handleCertificateFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'application/pdf') {
        toast.error('Please upload a valid certificate file (PDF, JPEG, or PNG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      setNewCertificate(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab, fetchCourses]);

  return (
    <div className="account-container">
      {user && (
        <div className="account-layout">
          {/* Sidebar */}
          <div className="account-sidebar">
            <div className="user-brief">
              <div 
                className={`user-avatar ${isEditing ? 'editable' : ''}`}
                onClick={handleImageClick}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="profile-image" />
                ) : (
                  editedUser.name.charAt(0).toUpperCase()
                )}
                {isEditing && (
                  <div className="image-overlay">
                    <MdAddAPhoto className="upload-icon" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <h3>{editedUser.name}</h3>
              <p>{editedUser.email}</p>
            </div>
            <div className="sidebar-menu">
              <button 
                className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <FaUser /> Profile
              </button>
              <button 
                className={`menu-item ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <FaBookReader /> My Courses
              </button>
              <button 
                className={`menu-item ${activeTab === 'certificates' ? 'active' : ''}`}
                onClick={() => setActiveTab('certificates')}
              >
                <FaCertificate /> Certificates
              </button>
              {user.role === "admin" && (
                <button
                  onClick={() => navigate(`/admin/dashboard`)}
                  className="menu-item"
                >
                  <MdDashboard /> Admin Dashboard
                </button>
              )}
              <button onClick={logoutHandler} className="menu-item logout">
                <IoMdLogOut /> Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="account-content">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <h2>My Profile</h2>
                <div className="profile-card">
                  <div className="profile-header">
                    <div className="profile-info">
                      <h3>Personal Information</h3>
                      {!isEditing ? (
                        <button className="edit-btn" onClick={handleEditClick}>
                          <MdEdit /> Edit Profile
                        </button>
                      ) : (
                        <div className="edit-actions">
                          <button className="save-btn" onClick={handleSaveClick}>
                            <MdSave /> Save
                          </button>
                          <button className="cancel-btn" onClick={handleCancelEdit}>
                            <MdClose /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="profile-image-section">
                        <div 
                          className={`profile-image-container ${isEditing ? 'editable' : ''}`}
                          onClick={handleImageClick}
                        >
                          {previewImage ? (
                            <img src={previewImage} alt="Profile" className="large-profile-image" />
                          ) : (
                            <div className="image-placeholder">
                              <FaUser className="placeholder-icon" />
                            </div>
                          )}
                          {isEditing && (
                            <div className="image-overlay">
                              <MdAddAPhoto className="upload-icon" />
                              <span>Click to upload</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="info-item">
                      <FaUser className="info-icon" />
                      <div>
                        <label>Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={editedUser.name}
                            onChange={handleInputChange}
                            className="edit-input"
                          />
                        ) : (
                          <p>{editedUser.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="info-item">
                      <MdEmail className="info-icon" />
                      <div>
                        <label>Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={editedUser.email}
                            onChange={handleInputChange}
                            className="edit-input"
                          />
                        ) : (
                          <p>{editedUser.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="info-item">
                      <FaBookReader className="info-icon" />
                      <div>
                        <label>Role</label>
                        <p>{user.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="courses-section">
                <h2>My Courses</h2>
                {courses && courses.length > 0 ? (
                  <div className="courses-grid">
                    {courses.map(course => (
                      <div 
                        key={course._id} 
                        className="course-card"
                        onClick={() => navigate(`/course/study/${course._id}`)}
                      >
                        <div className="course-image-container">
                          <img 
                            src={`${server}/${course.image}`} 
                            alt={course.title} 
                            className="course-thumbnail"
                          />
                        </div>
                        <div className="course-content">
                          <h3>{course.title}</h3>
                          <p className="course-instructor">Instructor: {course.createdBy}</p>
                          <p className="course-description">
                            {course.description?.length > 80 
                              ? `${course.description.substring(0, 80)}...` 
                              : course.description}
                          </p>
                          <button 
                            className="continue-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/course/study/${course._id}`);
                            }}
                          >
                            View Course
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-courses">
                    <FaBookReader className="no-courses-icon" />
                    <h3>No courses available</h3>
                    <p>There are no courses available at the moment. Check back later!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="certificates-section">
                <h2>My Certificates</h2>
                
                <div className="upload-certificate-form">
                  <h3>Upload New Certificate</h3>
                  <form onSubmit={handleCertificateUpload}>
                    <div className="form-group">
                      <label htmlFor="cert-title">Certificate Title</label>
                      <input
                        id="cert-title"
                        type="text"
                        value={newCertificate.title}
                        onChange={(e) => setNewCertificate(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., React Developer Certificate"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cert-date">Issue Date</label>
                      <input
                        id="cert-date"
                        type="date"
                        value={newCertificate.issueDate}
                        onChange={(e) => setNewCertificate(prev => ({ ...prev, issueDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cert-file">Certificate File</label>
                      <input
                        id="cert-file"
                        type="file"
                        onChange={handleCertificateFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={certificateInputRef}
                        required
                      />
                    </div>

                    <button type="submit" className="upload-btn">
                      Upload Certificate
                    </button>
                  </form>
                </div>

                <div className="certificates-list">
                  <h3>Your Certificates</h3>
                  {certificates.length > 0 ? (
                    <div className="certificates-grid">
                      {certificates.map((cert, index) => (
                        <div key={cert._id || index} className="certificate-card">
                          <div className="certificate-info">
                            <h4>{cert.title}</h4>
                            <p>Issued on: {new Date(cert.issueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="certificate-actions">
                            <a 
                              href={`${server}/uploads/${cert.fileName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="download-btn"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No certificates uploaded yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
