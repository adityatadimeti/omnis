import React, { useEffect, useRef } from "react";

const FirebaseVideoPlayer = ({ videoUrl, timestamp }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && timestamp) {
      const videoElement = videoRef.current;

      const seekToTime = () => {
        videoElement.currentTime = parseFloat(timestamp);
      };

      if (videoElement.readyState >= 1) {
        // Metadata already loaded, seek immediately
        seekToTime();
      } else {
        // Wait for metadata to load before seeking
        videoElement.addEventListener("loadedmetadata", seekToTime, {
          once: true,
        });
      }
    }
  }, [timestamp]);

  return (
    <div>
      <video ref={videoRef} controls width="640">
        {videoUrl && <source src={videoUrl} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default FirebaseVideoPlayer;
