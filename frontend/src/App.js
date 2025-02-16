import logo from "./logo.svg";
import React, { useEffect, useState } from "react";
import "./App.css";
import app from "./firebaseConfig";
import { getDatabase, ref, onValue } from "firebase/database";
import ProtectedRoute from "./ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import ProjectsDashboard from "./ProjectsDashboard";
import ChatInterface from "./ChatInterface";

function App() {
  const [data, setData] = useState({});

  const [selectedProject, setSelectedProject] = useState(null);

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
  };

  const handleBack = () => {
    setSelectedProject(null);
  };

  useEffect(() => {
    const database = getDatabase(app);
    const collectionRef = ref(database);

    const fetchData = () => {
      onValue(collectionRef, (snapshot) => {
        const dataItem = snapshot.val();
        if (dataItem) {
          setData(dataItem);
        }
      });
    };

    fetchData();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      {selectedProject ? (
        <ChatInterface onBack={handleBack} projectId={selectedProject} />
      ) : (
        <ProjectsDashboard onProjectSelect={handleProjectSelect} />
      )}
    </div>
  );
}

export default App;
