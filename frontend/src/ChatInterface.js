import React, { useState } from "react";
import { Send, Upload, ChevronLeft, MoreVertical, Share } from "lucide-react";

const ChatInterface = ({ onBack, projectId }) => {
  const [message, setMessage] = useState("");
  const [documents] = useState([
    {
      id: 1,
      name: "Group 2 CS194 Product Requirements Document (PRD)",
      type: "pdf",
      date: "13 days ago",
      size: "Large file",
    },
  ]);

  const styles = {
    container: {
      display: "flex",
      width: "100%",
      height: "100vh",
      backgroundColor: "#334155",
    },
    mainArea: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    header: {
      borderBottom: "1px solid gray",
      backgroundColor: "#334155",
      padding: "16px",
    },
    headerNav: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    navGroup: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    iconButton: {
      padding: "8px",
      border: "none",
      background: "none",
      cursor: "pointer",
      color: "white",
    },
    backText: {
      fontSize: "14px",
      color: "white",
    },
    projectInfo: {
      marginTop: "16px",
    },
    projectTitle: {
      color: "white",
      display: "flex",
      alignItems: "center",
    },
    projectName: {
      fontSize: "20px",
      fontWeight: 600,
      marginRight: "8px",
    },
    privateLabel: {
      fontSize: "12px",
      padding: "4px 8px",
      backgroundColor: "#F3F4F6",
      borderRadius: "6px",
    },
    projectDescription: {
      fontSize: "14px",
      color: "#64748B",
      marginTop: "4px",
    },
    chatArea: {
      flex: 1,
      overflowY: "auto",
      padding: "16px",
    },
    inputSection: {
      borderTop: "1px solid gray",
      backgroundColor: "#0F172A",
      padding: "16px",
    },
    inputContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    input: {
      flex: 1,
      padding: "8px 16px",
      borderRadius: "8px",
      border: "1px solid #E5E7EB",
      color: "white",
      backgroundColor: "#1E293B",
      outline: "none",
    },
    sidebar: {
      width: "320px",
      borderLeft: "1px solid gray",
      backgroundColor: "#1E293B",
    },
    sidebarContent: {
      padding: "16px",
    },
    sidebarHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sidebarTitle: {
      fontSize: "14px",
      fontWeight: 500,
      color: "white",
    },
    addButton: {
      color: "#64748B",
      fontSize: "14px",
      border: "none",
      background: "none",
      cursor: "pointer",
    },
    usageSection: {
      marginTop: "24px",
    },
    usageHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: "14px",
      color: "#6B7280",
    },
    usageBar: {
      marginTop: "8px",
      height: "4px",
      backgroundColor: "#F3F4F6",
      borderRadius: "9999px",
    },
    usageProgress: {
      width: "3%",
      height: "100%",
      backgroundColor: "#2563EB",
      borderRadius: "9999px",
    },
    documentList: {
      marginTop: "24px",
    },
    documentItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      flexDirection: "row",
      padding: "12px",
      cursor: "pointer",
      borderRadius: "8px",
    },
    documentTypeIcon: {
      width: "32px",
      height: "32px",
      backgroundColor: "#F3F4F6",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      textTransform: "uppercase",
    },
    documentInfo: {
      flex: 1,
    },
    documentTitle: {
      fontSize: "14px",
      marginTop: "0px",
      fontWeight: 500,
      color: "white",
    },
    documentMeta: {
      fontSize: "12px",
      color: "#64748B",
      marginTop: "4px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainArea}>
        <header style={styles.header}>
          <div style={styles.headerNav}>
            <div style={styles.navGroup}>
              <button style={styles.iconButton} onClick={onBack}>
                <ChevronLeft size={20} />
              </button>
              <span style={styles.backText}>All projects</span>
            </div>
            <div style={styles.navGroup}>
              <button style={styles.iconButton}>
                <Share size={20} />
              </button>
              <button style={styles.iconButton}>
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          <div style={styles.projectInfo}>
            <h1 style={styles.projectTitle}>
              <span style={styles.projectName}>CS 194W</span>
            </h1>
            <p style={styles.projectDescription}>CS 194W final project.</p>
          </div>
        </header>

        <div style={styles.chatArea}>{/* Messages would go here */}</div>

        <div style={styles.inputSection}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can Claude help you today?"
              style={styles.input}
            />
            <button style={styles.iconButton}>
              <Upload size={20} />
            </button>
            <button style={styles.iconButton}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <div style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>Project knowledge</h2>
            <button style={styles.addButton}>Add Content</button>
          </div>

          <div style={styles.usageSection}>
            <div style={styles.usageHeader}>
              <span>3% of knowledge capacity used</span>
              <button style={{ ...styles.iconButton, padding: "0" }}>ⓘ</button>
            </div>
            <div style={styles.usageBar}>
              <div style={styles.usageProgress} />
            </div>
          </div>

          <div style={styles.documentList}>
            {documents.map((doc) => (
              <div key={doc.id} style={styles.documentItem}>
                <div style={styles.documentTypeIcon}>{doc.type}</div>
                <div style={styles.documentInfo}>
                  <h3 style={styles.documentTitle}>{doc.name}</h3>
                  <p style={styles.documentMeta}>
                    {doc.date} · {doc.size}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
