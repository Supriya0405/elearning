import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Testimonials from "../../components/testimonials/Testimonials";
import "./home.css";
import "@fontsource/roboto";
import "@fontsource/roboto/700.css";
import "@fontsource/lato";
import "@fontsource/open-sans";

import image1 from "../../images/e-learning.jpg";
import image2 from "../../images/img.jpg";
import image3 from "../../images/post-thumb.webp";



const Home = ({ user }) => {
  const navigate = useNavigate();


  const images = [image1, image2, image3];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

 
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); 
    return () => clearTimeout(timer); 
  }, [currentImageIndex]);

  return (
    <div>
      <div className="home">
        <div className="home-content">
          <h1>Welcome to EshwarEdge – Knowledge Empowered</h1>
          <p>Empower Your Journey with EshwarEdge!</p>
          <button onClick={() => navigate("/courses")} className="common-btn">
            Get Started
          </button>
        </div>
        {user && (
          <div className="welcome-message">
            <h2>Hi, {user.name}!</h2>
          </div>
        )}
      </div>

      
      <div className="image-slider">
        <img
          src={images[currentImageIndex]}
          alt={`Slide ${currentImageIndex + 1}`}
          className="slider-image"
        />
      </div>

      
      <div className="features">
        <br/>
        <br/>
        <br/>
        <h2>Why Choose EshwarEdge?</h2>
        <br/>
        <div className="about-section">
          <p>
            EshwarEdge is an innovative e-learning platform designed to empower
            individuals with the knowledge and skills they need to excel in their
            chosen fields. Our platform offers meticulously crafted courses led by
            industry experts, ensuring a blend of quality, practicality, and
            inspiration.
          </p>
          <ul className="features-list">
            <li>📚 A wide range of courses covering diverse domains.</li>
            <li>💡 Interactive learning experience with quizzes and assignments.</li>
            <li>🏆 Certification programs to showcase your achievements.</li>
            <li>⏱ Flexible learning schedules tailored to your needs.</li>
            <li>🌐 Access to global instructors and peer networks.</li>
            <li>📈 Advanced analytics to track your learning progress.</li>
          </ul>
        </div>
        <div className="feature-cards">
          <div
            className="feature-card"
            style={{ backgroundImage: 'url("/src/images/earth.jpg")' }}
          >
            <div className="feature-card-text">
              <h3>Global Community</h3>
              <p>Connect with learners and instructors from around the globe.</p>
            </div>
          </div>
          <div
            className="feature-card"
            style={{ backgroundImage: 'url("/src/images/education.png")' }}
          >
            <div className="feature-card-text">
              <h3>Live Sessions</h3>
              <p>Attend real-time sessions with industry experts.</p>
            </div>
          </div>
          <div
            className="feature-card"
            style={{ backgroundImage: 'url("/src/images/certificate.jpg")' }}
          >
            <div className="feature-card-text">
              <h3>Earn Rewards</h3>
              <p>Gain badges and certificates as you complete milestones.</p>
            </div>
          </div>
        </div>
      </div>

      
      <Testimonials />

      
      <div className="cta">
  <div className="cta-content">
    <h2>Join EshwarEdge Today</h2>
    <p>
      Start your journey towards personal and professional growth. Discover
      endless possibilities with EshwarEdge!
    </p>
    <br/>
    <button onClick={() => navigate("/Login")} className="cta-btn">
      Join Now
    </button>
  </div>
 
  <img src="/src/images/thumbnail-removebg.png" alt="Join Now" className="cta-image" />
</div>


    </div>
  );
};

export default Home;
