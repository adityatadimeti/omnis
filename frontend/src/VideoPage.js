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

export default VideoPage;