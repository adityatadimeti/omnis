import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import FirebaseVideoPlayer from "./FirebaseVideoPlayer";

const VideoPage = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const videoUrl = queryParams.get("src");
  const timestamp = queryParams.get("t");

  return <FirebaseVideoPlayer videoUrl={videoUrl} timestamp={timestamp} />;
};

const Home = () => {
  const navigate = useNavigate();

  const firebaseVideoUrl =
    "https://firebasestorage.googleapis.com/.../video.mp4"; // Replace with actual URL
  const timestamp = 30;

  const goToVideoPage = () => {
    navigate(
      `/video?src=${encodeURIComponent(firebaseVideoUrl)}&t=${timestamp}`
    );
  };

  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={goToVideoPage}>Watch Video at {timestamp}s</button>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video" element={<VideoPage />} />
      </Routes>
    </Router>
  );
};

export default App;
