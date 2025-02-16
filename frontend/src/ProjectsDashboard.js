import React, { useState } from "react";
import { Search, Plus, Lock } from "lucide-react";
const ProjectsDashboard = ({ onProjectSelect }) => {
  const [projects] = useState([
    {
      id: 1,
      title: "Omnis treehacks",
      description: "",
      createdBy: "Aditya Tadimeti",
      updatedAt: "1 hour ago",
      isPrivate: true,
    },
    {
      id: 2,
      title: "OIT367: Business Intelligence from Big Data",
      description:
        "I am taking course in large-scale data analysis, data-driven decision-making, artificial intelligence, and their applications.",
      createdBy: "Mudit Gupta",
      updatedAt: "5 days ago",
      isPrivate: false,
    },
    {
      id: 3,
      title: "CS 194W",
      description: "CS 194W final project.",
      createdBy: "Aditya Tadimeti",
      updatedAt: "13 days ago",
      isPrivate: true,
    },
  ]);

  const styles = {
    container: {
      minHeight: "100vh",
      width: "100%",
      backgroundColor: "#334155",
    },
    header: {
      backgroundColor: "white",
      borderBottom: "1px solid gray",
    },
    headerContent: {
      margin: "0 auto",
      padding: "16px 24px",
      backgroundColor: "#0F172A",
    },
    headerFlex: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    titleGroup: {
      display: "flex",
      alignItems: "center",
    },
    title: {
      fontSize: "20px",
      color: "white",
      fontWeight: 600,
    },
    subtitle: {
      marginLeft: "16px",
      color: "#6B7280",
    },
    createButton: {
      padding: "8px 16px",
      backgroundColor: "#0047AB	",
      color: "white",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "none",
      cursor: "pointer",
    },
    main: {
      margin: "0 auto",
      padding: "32px 24px",
    },
    searchSection: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "32px",
    },
    searchContainer: {
      position: "relative",
      flex: 1,
      maxWidth: "512px",
    },
    searchInput: {
      width: "100%",
      paddingLeft: "40px",
      paddingRight: "16px",
      paddingTop: "8px",
      paddingBottom: "8px",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      outline: "none",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9CA3AF",
    },
    filterGroup: {
      display: "flex",
      gap: "16px",
    },
    filterButton: {
      padding: "8px 16px",
      backgroundColor: "white",
      border: "1px solid #E5E7EB",
      borderRadius: "9999px",
      fontSize: "14px",
      cursor: "pointer",
    },
    activeFilterButton: {
      backgroundColor: "#F3F4F6",
      fontWeight: 500,
    },
    projectsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
      gap: "24px",
    },
    projectCard: {
      backgroundColor: "#1E293B",
      borderRadius: "8px",
      border: "1px solid #E5E7EB",
      padding: "24px",
      cursor: "pointer",
    },
    projectHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    projectTitle: {
      fontSize: "18px",
      fontWeight: 500,
      display: "flex",
      color: "white",
      alignItems: "center",
      gap: "8px",
    },
    projectDescription: {
      marginTop: "4px",
      color: "#94A3B8",
      fontSize: "14px",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    },
    projectMeta: {
      marginTop: "16px",
      display: "flex",
      alignItems: "center",
      fontSize: "14px",
      color: "#64748B",
    },
    metaDivider: {
      margin: "0 8px",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerFlex}>
            <div style={styles.titleGroup}>
              <h1 style={styles.title}>Omnis</h1>
            </div>
            <button
              style={styles.createButton}
              onClick={() => onProjectSelect("new")}
            >
              <Plus size={16} />
              <span>Create New Knowledge Base</span>
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.searchSection}>
          {/* <div style={styles.searchContainer}>
            <Search style={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              style={styles.searchInput}
            />
          </div> */}
          <div style={styles.filterGroup}>
            <button style={styles.filterButton}>All projects</button>
            {/* <button
              style={{ ...styles.filterButton, ...styles.activeFilterButton }}
            >
              All projects
            </button> */}
          </div>
        </div>

        <div style={styles.projectsGrid}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              style={styles.projectCard}
            >
              <div style={styles.projectHeader}>
                <div>
                  <h3 style={styles.projectTitle}>
                    {project.title}
                    {/* {project.isPrivate && (
                      <Lock size={16} style={{ color: "#9CA3AF" }} />
                    )} */}
                  </h3>
                  {project.description && (
                    <p style={styles.projectDescription}>
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              <div style={styles.projectMeta}>
                <span>Created by {project.createdBy}</span>
                <span style={styles.metaDivider}>·</span>
                <span>Updated {project.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ProjectsDashboard;
