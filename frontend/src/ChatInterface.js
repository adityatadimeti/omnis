// // ChatInterface.js

// // This component provides a chat-style interface for uploading files,
// // chunking them, embedding them, and then searching across them.

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Send, Upload, ChevronLeft, MoreVertical, Share } from "lucide-react";
// import {
//   getStorage,
//   ref as storageRef,
//   uploadBytes,
//   getDownloadURL,
// } from "firebase/storage";
// import { v4 as uuidv4 } from "uuid";

// // Import useAuth so we can access the current user
// import { useAuth } from "./AuthContext";

// // Base styling object for major layout parts
// const baseStyles = {
//   container: {
//     display: "flex",
//     width: "100%",
//     height: "100vh",
//     backgroundColor: "#334155",
//     position: "relative",
//   },
//   mainArea: {
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//   },
//   header: {
//     borderBottom: "1px solid gray",
//     backgroundColor: "#334155",
//     padding: "16px",
//   },
//   headerNav: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   navGroup: {
//     display: "flex",
//     alignItems: "center",
//     gap: "16px",
//   },
//   iconButton: {
//     padding: "8px",
//     border: "none",
//     background: "none",
//     cursor: "pointer",
//     color: "white",
//   },
//   backText: {
//     fontSize: "14px",
//     color: "white",
//   },
//   projectInfo: {
//     marginTop: "16px",
//   },
//   projectTitle: {
//     color: "white",
//     display: "flex",
//     alignItems: "center",
//   },
//   projectName: {
//     fontSize: "20px",
//     fontWeight: 600,
//     marginRight: "8px",
//   },
//   projectDescription: {
//     fontSize: "14px",
//     color: "#64748B",
//     marginTop: "4px",
//   },
//   chatArea: {
//     flex: 1,
//     overflowY: "auto",
//     padding: "16px",
//     color: "white",
//   },
//   searchResult: {
//     padding: "12px",
//     margin: "8px 0",
//     backgroundColor: "#1E293B",
//     borderRadius: "8px",
//   },
//   inputSection: {
//     borderTop: "1px solid gray",
//     backgroundColor: "#0F172A",
//     padding: "16px",
//   },
//   inputContainer: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//   },
//   input: {
//     flex: 1,
//     padding: "8px 16px",
//     borderRadius: "8px",
//     border: "1px solid #E5E7EB",
//     color: "white",
//     backgroundColor: "#1E293B",
//     outline: "none",
//   },
//   uploadStatus: {
//     color: "white",
//     textAlign: "center",
//     marginTop: "8px",
//     fontSize: "14px",
//   },
//   sidebar: {
//     width: "320px",
//     borderLeft: "1px solid gray",
//     backgroundColor: "#1E293B",
//   },
//   sidebarContent: {
//     padding: "16px",
//   },
//   sidebarHeader: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   sidebarTitle: {
//     fontSize: "14px",
//     fontWeight: 500,
//     color: "white",
//   },
//   usageSection: {
//     marginTop: "24px",
//     marginBottom: "24px",
//   },
//   usageHeader: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     fontSize: "14px",
//     color: "#6B7280",
//   },
//   usageBar: {
//     marginTop: "8px",
//     height: "4px",
//     backgroundColor: "#F3F4F6",
//     borderRadius: "9999px",
//   },
//   usageProgress: {
//     width: "3%",
//     height: "100%",
//     backgroundColor: "#2563EB",
//     borderRadius: "9999px",
//   },
//   documentList: {
//     marginTop: "24px",
//   },
//   documentItem: {
//     display: "flex",
//     alignItems: "flex-start",
//     gap: "12px",
//     padding: "12px",
//     borderRadius: "8px",
//     cursor: "pointer",
//     backgroundColor: "#0F172A",
//     marginBottom: "8px",
//   },
//   documentTypeIcon: {
//     width: "32px",
//     height: "32px",
//     backgroundColor: "#1E293B",
//     borderRadius: "8px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "12px",
//     color: "white",
//   },
//   documentInfo: {
//     flex: 1,
//   },
//   documentTitle: {
//     fontSize: "14px",
//     fontWeight: 500,
//     color: "white",
//     margin: 0,
//   },
//   documentMeta: {
//     fontSize: "12px",
//     color: "#64748B",
//     marginTop: "4px",
//   },
// };

// const ChatInterface = ({ projectId }) => {
//   // Use React Router's navigation
//   const navigate = useNavigate();

//   // Get the currently logged-in user from AuthContext
//   const { user } = useAuth();

//   // Local state variables
//   const [message, setMessage] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchResults, setSearchResults] = useState([]);
//   const [documents, setDocuments] = useState([]);
//   const [uploadStatus, setUploadStatus] = useState("");
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragCounter, setDragCounter] = useState(0);

//   // Merge base styles with any additional overlays
//   const styles = {
//     ...baseStyles,
//     dropZoneOverlay: {
//       position: "fixed",
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundColor: "rgba(15, 23, 42, 0.9)",
//       display: isDragging ? "flex" : "none",
//       justifyContent: "center",
//       alignItems: "center",
//       zIndex: 1000,
//       pointerEvents: "none",
//       transition: "opacity 0.2s ease",
//       opacity: isDragging ? 1 : 0,
//     },
//     dropZoneContent: {
//       padding: "40px 60px",
//       borderRadius: "12px",
//       border: "2px dashed #4F46E5",
//       backgroundColor: "#1E293B",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       gap: "12px",
//     },
//     dropZoneText: {
//       color: "white",
//       fontSize: "18px",
//       fontWeight: 500,
//     },
//     dropZoneSubtext: {
//       color: "#94A3B8",
//       fontSize: "14px",
//     },
//   };

//   // Navigates back to the dashboard
//   const handleBack = () => {
//     navigate("/dashboard");
//   };

//   // Drag-and-drop event handlers
//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDragIn = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragCounter((prev) => prev + 1);
//     if (dragCounter === 0) {
//       setIsDragging(true);
//     }
//   };

//   const handleDragOut = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragCounter((prev) => prev - 1);
//     if (dragCounter === 1) {
//       setIsDragging(false);
//     }
//   };

//   const handleDrop = async (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragCounter(0);
//     setIsDragging(false);

//     const files = e.dataTransfer.files;
//     if (files && files.length > 0) {
//       // Upload the first file dropped
//       await handleFileUpload({ target: { files: [files[0]] } });
//     }
//   };

//   /**
//    * processFileChunks
//    * Splits the text file into chunks, uploads each chunk to Firebase Storage,
//    * and sends each chunk for embedding to the backend.
//    */
//   const processFileChunks = async (file, originalFileUrl, isTextOrNot, fileType, originalFileName) => {
//     let text = "";
//     if (isTextOrNot) {
//       text = file;
//     } else {
//       text = await file.text();
//     }

//     const chunkSize = 1000;
//     const chunks = [];

//     // Split text into chunks
//     const words = text.split(/\s+/);

//     // Break text into 1000-word chunks
//     for (let i = 0; i < words.length; i += chunkSize) {
//       chunks.push(words.slice(i, i + chunkSize).join(" "));
//     }

//     const storage = getStorage();

//     // Upload each chunk and request embeddings
//     for (let i = 0; i < chunks.length; i++) {
//       setUploadStatus(`Processing chunk ${i + 1} of ${chunks.length}`);

//       // Create and upload chunk to Firebase
//       const chunkId = uuidv4();
//       const chunkRef = storageRef(storage, `chunks/${chunkId}.txt`);
//       const chunkBlob = new Blob([chunks[i]], { type: "text/plain" });
//       await uploadBytes(chunkRef, chunkBlob);
//       const chunkUrl = await getDownloadURL(chunkRef);
//       console.log("chunk url");
//       console.log(chunkUrl);

//       // Send chunk to our backend for embedding
//       try {
//         // Remove all spaces from user.displayName
//         const safeUserName = user?.displayName
//           ? user.displayName.replace(/\s+/g, "")
//           : "UnknownUser";

//         const response = await fetch("http://localhost:5010/add_embedding", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             chunk_url: chunkUrl,
//             chunk_text: chunks[i],
//             original_file_url: originalFileUrl,
//             user_name: safeUserName, // use the space-stripped username
//             file_type: fileType,
//             file_name: originalFileName,
//           }),
//         });

//         // Check response status
//         if (!response.ok) {
//           const errorText = await response.text();
//           console.error(
//             `Server responded with an error. Status: ${response.status} - ${errorText}`
//           );
//         } else {
//           const data = await response.json();
//           console.log("Successfully embedded chunk:", data);
//         }
//       } catch (err) {
//         console.error("Error sending chunk to backend:", err);
//       }
//     }
//   };

//   /**
//    * handleFileUpload
//    * Called when a file is selected (or dropped).
//    * Uploads the entire file to Firebase, then calls processFileChunks.
//    */
//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     //check file ends in mp3
//     if (file["name"].split(".").pop() === "mp4") {
//       // 1. Upload original video file to Firebase
//       const storage = getStorage();
//       const fileId = uuidv4();
//       const fileExtension = file.name.split(".").pop();
//       const originalFileRef = storageRef(
//         storage,
//         `documents/${fileId}.${fileExtension}`
//       );
//       await uploadBytes(originalFileRef, file);
//       const originalVideoFileUrl = await getDownloadURL(originalFileRef);
//       console.log("original video file url");
//       console.log(originalVideoFileUrl);

//       const formData = new FormData();
//       formData.append("video", file);

//       const response = await fetch("http://localhost:5010/process_video", {
//         method: "POST",
//         body: formData,
//       });
//       const data = await response.json();

//       // const video_transcript_id = uuidv4();
//       // const originalVideoTranscriptFile = storageRef(
//       //   storage,
//       //   `documents/${video_transcript_id}.txt`
//       // );

//       // const chunkBlob = new Blob([data["transcript_content"][1]], {
//       //   type: "text/plain",
//       // });

//       // await uploadBytes(originalVideoTranscriptFile, chunkBlob);
//       // const videoTranscript = await getDownloadURL(originalVideoTranscriptFile);
//       // console.log("original full transcript");
//       // console.log(videoTranscript);

//       // await processFileChunks(
//       //   data["transcript_content"][1],
//       //   originalVideoFileUrl,
//       //   true,
//       //   "video",
//       //   file["name"].split(".")[0]

//       // );

//       const video_transcript_with_timestamps_id = uuidv4();
//       const originalVideoTranscriptTranscriptFile = storageRef(
//         storage,
//         `documents/${video_transcript_with_timestamps_id}.txt`
//       );

//       const chunkBlob2 = new Blob([data["transcript_content"][0]], {
//         type: "text/plain",
//       });

//       await uploadBytes(originalVideoTranscriptTranscriptFile, chunkBlob2);
//       const videoTranscriptTimestamp = await getDownloadURL(
//         originalVideoTranscriptTranscriptFile
//       );
//       console.log("original full transcript with timestamp");
//       console.log(videoTranscriptTimestamp);

//       await processFileChunks(
//         data["transcript_content"][0],
//         originalVideoFileUrl,
//         true,
//         "video",
//         file["name"].split(".")[0]
//       );

//       // 3. Update UI with new document
//       setDocuments((prev) => [
//         ...prev,
//         {
//           id: video_transcript_with_timestamps_id,
//           name: file.name,
//           type: "mp4".toUpperCase(),
//           date: "Just now",
//           size: `${(file.size / 1024).toFixed(1)} KB`,
//           url: videoTranscriptTimestamp,
//         },
//       ]);

//       setUploadStatus("Upload complete!");
//       setIsLoading(false);
//       setTimeout(() => setUploadStatus(""), 3000);

//       return;
//     } else {
//       try {
//         setIsLoading(true);
//         setUploadStatus("Starting upload...");

//         // 1. Upload original file to Firebase
//         const storage = getStorage();
//         const fileId = uuidv4();
//         const fileExtension = file.name.split(".").pop();
//         const originalFileRef = storageRef(
//           storage,
//           `documents/${fileId}.${fileExtension}`
//         );

//         await uploadBytes(originalFileRef, file);
//         const originalFileUrl = await getDownloadURL(originalFileRef);

//         // 2. Process chunks and store embeddings
//         await processFileChunks(file, originalFileUrl, false, "text",  file["name"].split(".")[0]);

//         // 3. Update UI with new document
//         setDocuments((prev) => [
//           ...prev,
//           {
//             id: fileId,
//             name: file.name,
//             type: fileExtension.toUpperCase(),
//             date: "Just now",
//             size: `${(file.size / 1024).toFixed(1)} KB`,
//             url: originalFileUrl,
//           },
//         ]);

//         setUploadStatus("Upload complete!");
//       } catch (error) {
//         console.error("Error processing file:", error);
//         setUploadStatus("Error uploading file");
//       } finally {
//         setIsLoading(false);
//         setTimeout(() => setUploadStatus(""), 3000); // Clear status after 3 seconds
//       }
//     }
//   };

//   /**
//    * handleSearch
//    * Sends the user's query to the backend search endpoint
//    * and displays the topK results from that user's table.
//    */
//   const handleSearch = async () => {
//     if (!message.trim()) return;

//     setIsLoading(true);
//     try {
//       const response = await fetch("http://localhost:5010/search", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           query: message,
//           num_results: 3,
//           user_name: user?.displayName || "UnknownUser",
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(
//           `Server responded with an error. Status: ${response.status} - ${errorText}`
//         );
//       } else {
//         const search_data = await response.json();
//         // 1) Log the entire server response
//         console.log("Search data from server:", search_data);
        
//         if (search_data.status === "success") {
//           // 2) Also log just the results for clarity
//           console.log("Search results:", search_data.results);

//           //feed sanjay code
//           const response = await fetch("http://localhost:5010/run_identification", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               question: message,
//               top_k_queries: search_data.results.map(obj => obj.chunk_text),
//               top_k_types: search_data.results.map(obj => obj.file_type)
//             }),
//           });
//           const data = await response.json();

//           const response2 = await fetch("http://localhost:5010/run_generation", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               question: message,
//               top_k_ids: data['top_k_ids']
//             }),
//           });
//           const data2 = await response2.json();


//           const response3 = await fetch("http://localhost:5010/postprocess_generation", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               generated_content: data2['answer'],
//               top_k_urls: search_data.results.map(obj => obj.original_file_url),
//               top_k_names: search_data.results.map(obj => obj.file_name),
//             }),
//           });
//           const data3 = await response3.json();



//           // Update local state with the returned results
//           setSearchResults(data3['answer']);
//         } else {
//           console.error("Search error:", search_data.message);
//         }
//       }
//     } catch (error) {
//       console.error("Error searching:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Render the main component
//   return (
//     <div
//       style={styles.container}
//       onDragEnter={handleDragIn}
//       onDragLeave={handleDragOut}
//       onDragOver={handleDrag}
//       onDrop={handleDrop}
//     >
//       {/* Overlay for drag-and-drop */}
//       <div style={styles.dropZoneOverlay}>
//         <div style={styles.dropZoneContent}>
//           <Upload size={40} color="#4F46E5" />
//           <div style={styles.dropZoneText}>
//             Drop files here to add to knowledge base
//           </div>
//           <div style={styles.dropZoneSubtext}>Upload PDF, TXT, DOC files</div>
//         </div>
//       </div>

//       {/* Main area with chat and search */}
//       <div style={styles.mainArea}>
//         <header style={styles.header}>
//           <div style={styles.headerNav}>
//             <div style={styles.navGroup}>
//               <button style={styles.iconButton} onClick={handleBack}>
//                 <ChevronLeft size={20} />
//               </button>
//               <span style={styles.backText}>All projects</span>
//             </div>
//             <div style={styles.navGroup}>
//               <button style={styles.iconButton}>
//                 <Share size={20} />
//               </button>
//               <button style={styles.iconButton}>
//                 <MoreVertical size={20} />
//               </button>
//             </div>
//           </div>

//           <div style={styles.projectInfo}>
//             <h1 style={styles.projectTitle}>
//               <span style={styles.projectName}>CS 194W</span>
//             </h1>
//             <p style={styles.projectDescription}>CS 194W final project.</p>
//           </div>
//         </header>

//       {/* Search results section */}
//       <div style={styles.chatArea}>
//         {console.log("searchResults:", searchResults)}

//         {/* If searchResults is a string, just display it.
//             Otherwise, assume it's an array of results. */}
//         {typeof searchResults === "string" ? (
//           <div style={styles.searchResult}>{searchResults}</div>
//         ) : (
//           searchResults.map((result, index) => (
//             <div key={index} style={styles.searchResult}>
//               <div>{result.chunk_text}</div>
//               <div style={styles.documentMeta}>
//                 Score: {result.score.toFixed(2)} | Source: {result.original_file_url}
//               </div>
//             </div>
//           ))
//         )}
//       </div>


//         {/* User input for search and file upload */}
//         <div style={styles.inputSection}>
//           <div style={styles.inputContainer}>
//             {/* Search bar */}
//             <input
//               type="text"
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               onKeyPress={(e) => {
//                 if (e.key === "Enter") {
//                   handleSearch();
//                 }
//               }}
//               placeholder="Ask your knowledge base..."
//               style={styles.input}
//               disabled={isLoading}
//             />
//             {/* File upload button */}
//             <label style={styles.iconButton}>
//               <input
//                 type="file"
//                 onChange={handleFileUpload}
//                 style={{ display: "none" }}
//                 disabled={isLoading}
//               />
//               <Upload size={20} />
//             </label>
//             {/* Send/search button */}
//             <button
//               style={styles.iconButton}
//               onClick={handleSearch}
//               disabled={isLoading}
//             >
//               <Send size={20} />
//             </button>
//           </div>
//           {/* Upload status or error messages */}
//           {uploadStatus && (
//             <div style={styles.uploadStatus}>{uploadStatus}</div>
//           )}
//         </div>
//       </div>

//       {/* Sidebar showing uploaded documents and usage */}
//       <div style={styles.sidebar}>
//         <div style={styles.sidebarContent}>
//           <div style={styles.sidebarHeader}>
//             <h2 style={styles.sidebarTitle}>Project knowledge</h2>
//           </div>

//           <div style={styles.usageSection}>
//             <div style={styles.usageHeader}>
//               <span>0% of knowledge capacity used</span>
//               <button style={{ ...styles.iconButton, padding: "0" }}>ⓘ</button>
//             </div>
//             <div style={styles.usageBar}>
//               <div style={styles.usageProgress} />
//             </div>
//           </div>

//           {/* List of uploaded documents */}
//           <div style={styles.documentList}>
//             {documents.map((doc) => (
//               <div key={doc.id} style={styles.documentItem}>
//                 <div style={styles.documentTypeIcon}>{doc.type}</div>
//                 <div style={styles.documentInfo}>
//                   <h3 style={styles.documentTitle}>{doc.name}</h3>
//                   <p style={styles.documentMeta}>
//                     {doc.date} · {doc.size}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatInterface;


// ChatInterface.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Upload, ChevronLeft, MoreVertical, Share } from "lucide-react";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./AuthContext";

// Base styling object for major layout parts
const baseStyles = {
  container: {
    display: "flex",
    width: "100%",
    height: "100vh",
    backgroundColor: "#334155",
    position: "relative",
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
  projectDescription: {
    fontSize: "14px",
    color: "#64748B",
    marginTop: "4px",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#2563EB",
    padding: "12px",
    borderRadius: "8px",
    maxWidth: "70%",
    wordWrap: "break-word",
  },
  chatBubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#1E293B",
    padding: "12px",
    borderRadius: "8px",
    maxWidth: "70%",
    wordWrap: "break-word",
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
  uploadStatus: {
    color: "white",
    textAlign: "center",
    marginTop: "8px",
    fontSize: "14px",
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
  usageSection: {
    marginTop: "24px",
    marginBottom: "24px",
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
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#0F172A",
    marginBottom: "8px",
  },
  documentTypeIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "#1E293B",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    color: "white",
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "white",
    margin: 0,
  },
  documentMeta: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "4px",
  },
};

const ChatInterface = ({ projectId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // We maintain a chat history of messages (user or assistant)
  const [chatHistory, setChatHistory] = useState([]);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const styles = {
    ...baseStyles,
    dropZoneOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      display: isDragging ? "flex" : "none",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      pointerEvents: "none",
      transition: "opacity 0.2s ease",
      opacity: isDragging ? 1 : 0,
    },
    dropZoneContent: {
      padding: "40px 60px",
      borderRadius: "12px",
      border: "2px dashed #4F46E5",
      backgroundColor: "#1E293B",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    },
    dropZoneText: {
      color: "white",
      fontSize: "18px",
      fontWeight: 500,
    },
    dropZoneSubtext: {
      color: "#94A3B8",
      fontSize: "14px",
    },
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (dragCounter === 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev - 1);
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload({ target: { files: [files[0]] } });
    }
  };

  // Splits a text file into 1000-word chunks, uploads to Firebase, calls the backend for embedding
  const processFileChunks = async (
    file,
    originalFileUrl,
    isTextOrNot,
    fileType,
    originalFileName
  ) => {
    let text = "";
    if (isTextOrNot) {
      text = file;
    } else {
      text = await file.text();
    }

    const chunkSize = 1000;
    const chunks = [];
    const words = text.split(/\s+/);

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    const storage = getStorage();

    for (let i = 0; i < chunks.length; i++) {
      setUploadStatus(`Processing chunk ${i + 1} of ${chunks.length}`);

      const chunkId = uuidv4();
      const chunkRef = storageRef(storage, `chunks/${chunkId}.txt`);
      const chunkBlob = new Blob([chunks[i]], { type: "text/plain" });
      await uploadBytes(chunkRef, chunkBlob);
      const chunkUrl = await getDownloadURL(chunkRef);

      const safeUserName = user?.displayName
        ? user.displayName.replace(/\s+/g, "")
        : "UnknownUser";

      try {
        const response = await fetch("http://localhost:5010/add_embedding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chunk_url: chunkUrl,
            chunk_text: chunks[i],
            original_file_url: originalFileUrl,
            user_name: safeUserName,
            file_type: fileType,
            file_name: originalFileName,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Server responded with an error. Status: ${response.status} - ${errorText}`
          );
        } else {
          const data = await response.json();
          console.log("Successfully embedded chunk:", data);
        }
      } catch (err) {
        console.error("Error sending chunk to backend:", err);
      }
    }
  };

  // Uploads a file to Firebase, then processes it for embeddings
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Partial example if the file is an MP4 (video):
    // (You could handle transcripts, etc.)
    if (file["name"].split(".").pop() === "mp4") {
      // Additional logic for video...
      return;
    } else {
      try {
        setIsLoading(true);
        setUploadStatus("Starting upload...");

        const storage = getStorage();
        const fileId = uuidv4();
        const fileExtension = file.name.split(".").pop();
        const originalFileRef = storageRef(
          storage,
          `documents/${fileId}.${fileExtension}`
        );

        await uploadBytes(originalFileRef, file);
        const originalFileUrl = await getDownloadURL(originalFileRef);

        await processFileChunks(
          file,
          originalFileUrl,
          false,
          "text",
          file["name"].split(".")[0]
        );

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
        setTimeout(() => setUploadStatus(""), 3000);
      }
    }
  };

  // Handles user queries, calls /search, then calls additional endpoints, and updates chat
  const handleSearch = async () => {
    if (!message.trim()) return;

    // Add user's question to the chat history
    setChatHistory((prev) => [...prev, { role: "user", message: message }]);

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5010/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message,
          num_results: 3,
          user_name: user?.displayName || "UnknownUser",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Server responded with an error. Status: ${response.status} - ${errorText}`
        );
      } else {
        const search_data = await response.json();
        console.log("Search data from server:", search_data);

        if (search_data.status === "success") {
          // Example logic if you have identification/generation endpoints
          const response1 = await fetch("http://localhost:5010/run_identification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: message,
              top_k_queries: search_data.results.map((obj) => obj.chunk_text),
              top_k_types: search_data.results.map((obj) => obj.file_type),
            }),
          });
          const data1 = await response1.json();

          const response2 = await fetch("http://localhost:5010/run_generation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: message,
              top_k_ids: data1["top_k_ids"],
            }),
          });
          const data2 = await response2.json();

          const response3 = await fetch("http://localhost:5010/postprocess_generation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              generated_content: data2["answer"],
              top_k_urls: search_data.results.map((obj) => obj.original_file_url),
              top_k_names: search_data.results.map((obj) => obj.file_name),
            }),
          });
          const data3 = await response3.json();

          // Add assistant's final answer to the chat
          setChatHistory((prev) => [
            ...prev,
            { role: "assistant", message: data3["answer"] },
          ]);
        } else {
          console.error("Search error:", search_data.message);
          setChatHistory((prev) => [
            ...prev,
            {
              role: "assistant",
              message: "Sorry, I couldn’t find anything relevant.",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error searching:", error);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", message: "An error occurred while searching." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={styles.container}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div style={styles.dropZoneOverlay}>
        <div style={styles.dropZoneContent}>
          <Upload size={40} color="#4F46E5" />
          <div style={styles.dropZoneText}>Drop files here to add to knowledge base</div>
          <div style={styles.dropZoneSubtext}>Upload PDF, TXT, DOC files</div>
        </div>
      </div>

      <div style={styles.mainArea}>
        <header style={styles.header}>
          <div style={styles.headerNav}>
            <div style={styles.navGroup}>
              <button style={styles.iconButton} onClick={handleBack}>
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

        {/* Chat area that displays user & assistant messages */}
        <div style={styles.chatArea}>
          {chatHistory.map((msg, index) =>
            msg.role === "user" ? (
              <div key={index} style={styles.chatBubbleUser}>
                {msg.message}
              </div>
            ) : (
              <div key={index} style={styles.chatBubbleAssistant}>
                {msg.message}
              </div>
            )
          )}
        </div>

        {/* Input section: search box, file upload, etc. */}
        <div style={styles.inputSection}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Ask your knowledge base..."
              style={styles.input}
              disabled={isLoading}
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
            <button
              style={styles.iconButton}
              onClick={handleSearch}
              disabled={isLoading}
            >
              <Send size={20} />
            </button>
          </div>
          {uploadStatus && <div style={styles.uploadStatus}>{uploadStatus}</div>}
        </div>
      </div>

      {/* Sidebar showing uploaded documents and usage */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>Project knowledge</h2>
          </div>

          <div style={styles.usageSection}>
            <div style={styles.usageHeader}>
              <span>0% of knowledge capacity used</span>
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
