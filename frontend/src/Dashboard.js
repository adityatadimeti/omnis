// Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const classes = [
    { id: '1', name: 'CS 194W', description: 'CS 194W final project.' },
    // Add more classes as needed
  ];

  const handleClassClick = (classId) => {
    navigate(`/class/${classId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#334155",
      color: "white",
      padding: "2rem",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
    },
    title: {
      fontSize: "24px",
      fontWeight: "600",
    },
    logoutButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#1E293B",
      border: "none",
      borderRadius: "6px",
      color: "white",
      cursor: "pointer",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "1rem",
    },
    card: {
      padding: "1.5rem",
      backgroundColor: "#1E293B",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "transform 0.2s",
      '&:hover': {
        transform: "translateY(-2px)",
      },
    },
    className: {
      fontSize: "18px",
      fontWeight: "500",
      marginBottom: "0.5rem",
    },
    description: {
      color: "#94A3B8",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Classes</h1>
        <button style={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div style={styles.grid}>
        {classes.map((cls) => (
          <div
            key={cls.id}
            style={styles.card}
            onClick={() => handleClassClick(cls.id)}
          >
            <div style={styles.className}>{cls.name}</div>
            <div style={styles.description}>{cls.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;