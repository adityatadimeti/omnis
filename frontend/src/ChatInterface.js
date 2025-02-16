import React, { useState } from "react";
import { Send, Upload, ChevronLeft, MoreVertical, Share } from "lucide-react";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const ChatInterface = ({ onBack, projectId }) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [documents, setDocuments] = useState([]); // Changed to empty array
  const [uploadStatus, setUploadStatus] = useState("");

  const processFileChunks = async (file, originalFileUrl, isTextOrNot) => {
    let text = "";
    if (isTextOrNot) {
      text = file;
    } else {
      text = await file.text();
    }

    const chunkSize = 1000;
    const chunks = [];

    // Split text into chunks
    const words = text.split(/\s+/);

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    const storage = getStorage();

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      setUploadStatus(`Processing chunk ${i + 1} of ${chunks.length}`);

      // Create and upload chunk to Firebase
      const chunkId = uuidv4();
      const chunkRef = storageRef(storage, `chunks/${chunkId}.txt`);
      const chunkBlob = new Blob([chunks[i]], { type: "text/plain" });
      await uploadBytes(chunkRef, chunkBlob);
      const chunkUrl = await getDownloadURL(chunkRef);
      console.log("chunk url");
      console.log(chunkUrl);

      // Store in IRIS with embedding
      await fetch("http://localhost:5010/add_embedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chunk_url: chunkUrl,
          chunk_text: chunks[i],
          original_file_url: originalFileUrl,
        }),
      });
    }
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    //check file ends in mp3
    if (file["name"].split(".").pop() === "mp4") {
      // 1. Upload original video file to Firebase
      const storage = getStorage();
      const fileId = uuidv4();
      const fileExtension = file.name.split(".").pop();
      const originalFileRef = storageRef(
        storage,
        `documents/${fileId}.${fileExtension}`
      );

      await uploadBytes(originalFileRef, file);
      const originalVideoFileUrl = await getDownloadURL(originalFileRef);
      console.log("original video file url");
      console.log(originalVideoFileUrl);

      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("http://localhost:5010/process_video", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      const video_transcript_id = uuidv4();
      const originalVideoTranscriptFile = storageRef(
        storage,
        `documents/${video_transcript_id}.txt`
      );

      const chunkBlob = new Blob([data["transcript_content"][1]], {
        type: "text/plain",
      });

      await uploadBytes(originalVideoTranscriptFile, chunkBlob);
      const videoTranscript = await getDownloadURL(originalVideoTranscriptFile);
      console.log("original full transcript");
      console.log(videoTranscript);

      await processFileChunks(
        data["transcript_content"][1],
        videoTranscript,
        true
      );

      const video_transcript_with_timestamps_id = uuidv4();
      const originalVideoTranscriptTranscriptFile = storageRef(
        storage,
        `documents/${video_transcript_with_timestamps_id}.txt`
      );

      const chunkBlob2 = new Blob([data["transcript_content"][0]], {
        type: "text/plain",
      });

      await uploadBytes(originalVideoTranscriptTranscriptFile, chunkBlob2);
      const videoTranscriptTimestamp = await getDownloadURL(
        originalVideoTranscriptTranscriptFile
      );
      console.log("original full transcript with timestamp");
      console.log(videoTranscriptTimestamp);

      await processFileChunks(
        data["transcript_content"][0],
        videoTranscriptTimestamp,
        true
      );

      // 3. Update UI with new document
      setDocuments((prev) => [
        ...prev,
        {
          id: video_transcript_id,
          name: file.name,
          type: "mp4".toUpperCase(),
          date: "Just now",
          size: `${(file.size / 1024).toFixed(1)} KB`,
          url: videoTranscript,
        },
      ]);

      setUploadStatus("Upload complete!");
      setIsLoading(false);
      setTimeout(() => setUploadStatus(""), 3000);

      return;
    } else {
      try {
        setIsLoading(true);
        setUploadStatus("Starting upload...");

        // 1. Upload original file to Firebase
        const storage = getStorage();
        const fileId = uuidv4();
        const fileExtension = file.name.split(".").pop();
        const originalFileRef = storageRef(
          storage,
          `documents/${fileId}.${fileExtension}`
        );

        await uploadBytes(originalFileRef, file);
        const originalFileUrl = await getDownloadURL(originalFileRef);

        // 2. Process chunks and store embeddings
        await processFileChunks(file, originalFileUrl);

        // 3. Update UI with new document
        setDocuments((prev) => [
          ...prev,
          {
            id: fileId,
            name: file.name,
            type: fileExtension.toUpperCase(),
            date: "Just now",
            size: `${(file.size / 1024).toFixed(1)} KB`,
            url: originalFileUrl,
          },
        ]);

        setUploadStatus("Upload complete!");
      } catch (error) {
        console.error("Error processing file:", error);
        setUploadStatus("Error uploading file");
      } finally {
        setIsLoading(false);
        setTimeout(() => setUploadStatus(""), 3000); // Clear status after 3 seconds
      }
    }
  };

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
            <label style={styles.iconButton}>
              <input
                type="file"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                disabled={isLoading}
              />
              <Upload size={20} />
            </label>
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
