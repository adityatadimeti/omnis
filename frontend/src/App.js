import logo from "./logo.svg";
import React, { useEffect, useState } from "react";
import "./App.css";
import app from "./firebaseConfig";
import { getDatabase, ref, onValue } from "firebase/database";
import ProtectedRoute from "./ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";

function App() {
  const [data, setData] = useState({});

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
        backgroundColor: "#292929",
      }}
    >
      {/* Debug section */}
      <div
        style={{
          backgroundColor: "#1f2937",
          color: "white",
          padding: "1rem",
          marginBottom: "1rem",
          borderRadius: "0.5rem",
        }}
      >
        <p style={{ marginBottom: "0.5rem" }}>
          Firebase Database Connection Status:
        </p>
        <pre
          style={{
            fontSize: "0.75rem",
            overflowX: "auto",
            maxHeight: "160px",
            backgroundColor: "#111827",
            padding: "0.5rem",
            borderRadius: "0.25rem",
          }}
        >
          {JSON.stringify(data, null, 4)}
        </pre>
      </div>

      {/* Chat interface */}
      {/* <ChatInterface /> */}
      {/* <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateAccount />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider> */}
    </div>
  );
}

export default App;
