
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from './AuthContext';
// import { LogOut } from 'lucide-react';

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const { logout, user } = useAuth();

//   // Existing classes
//   const [classes, setClasses] = useState([
//     { id: '1', name: 'CS 194W', description: 'CS 194W final project.' },
//   ]);

//   // New: state for the new class name
//   const [newClassName, setNewClassName] = useState('');

//   const handleClassClick = (classId) => {
//     navigate(`/class/${classId}`);
//   };

//   const handleLogout = async () => {
//     try {
//       await logout();
//       navigate('/login');
//     } catch (error) {
//       console.error('Failed to log out:', error);
//     }
//   };

//   // 1) Create class on the backend; 2) add to local classes array
//   const handleCreateClass = async () => {
//     if (!newClassName.trim()) return;

//     try {
//       // Call backend to create the schema: user_name.class_name
//       const response = await fetch('http://localhost:5010/create_class', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           user_name: user?.displayName || 'UnknownUser',
//           class_name: newClassName,
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(
//           `Server responded with an error. Status: ${response.status} - ${errorText}`
//         );
//         return;
//       }

//       // Optionally read the result
//       const result = await response.json();
//       console.log('Class creation response:', result);

//       // 2) Add the new class to local state so UI updates
//       const newId = result.new_class_id || Date.now().toString();
//       const newClassObject = {
//         id: newId,
//         name: newClassName,
//         description: `Class: ${newClassName}`,
//       };
//       setClasses((prev) => [...prev, newClassObject]);

//       // Clear the input
//       setNewClassName('');
//     } catch (error) {
//       console.error('Error creating class:', error);
//     }
//   };

//   const styles = {
//     container: {
//       display: 'flex',
//       flexDirection: 'column',
//       minHeight: '100vh',
//       backgroundColor: '#334155',
//       color: 'white',
//       padding: '2rem',
//     },
//     header: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: '2rem',
//     },
//     leftSection: {
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'flex-start',
//     },
//     title: {
//       fontSize: '24px',
//       fontWeight: '600',
//       marginBottom: '0.5rem',
//     },
//     welcome: {
//       fontSize: '18px',
//       fontWeight: '500',
//       marginBottom: '0.5rem',
//     },
//     logoutButton: {
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       gap: '0.5rem',
//       padding: '0.5rem 1rem',
//       backgroundColor: '#1E293B',
//       border: 'none',
//       borderRadius: '6px',
//       color: 'white',
//       cursor: 'pointer',
//     },
//     grid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
//       gap: '1rem',
//     },
//     card: {
//       padding: '1.5rem',
//       backgroundColor: '#1E293B',
//       borderRadius: '8px',
//       cursor: 'pointer',
//       transition: 'transform 0.2s',
//     },
//     className: {
//       fontSize: '18px',
//       fontWeight: '500',
//       marginBottom: '0.5rem',
//     },
//     description: {
//       color: '#94A3B8',
//       fontSize: '14px',
//     },
//     newClassSection: {
//       display: 'flex',
//       gap: '1rem',
//       marginBottom: '2rem',
//     },
//     input: {
//       padding: '0.5rem',
//       borderRadius: '6px',
//       border: '1px solid #ccc',
//       fontSize: '16px',
//       outline: 'none',
//     },
//     createButton: {
//       padding: '0.5rem 1rem',
//       borderRadius: '6px',
//       border: 'none',
//       backgroundColor: '#1E293B',
//       color: 'white',
//       cursor: 'pointer',
//     },
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.header}>
//         <h1 style={styles.title}>My Classes</h1>
//         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
//           <h2 style={styles.welcome}>Welcome {user ? user.displayName : 'User'}</h2>
//           <button style={styles.logoutButton} onClick={handleLogout}>
//             <LogOut size={20} />
//             Logout
//           </button>
//         </div>
//       </div>

//       {/* New Class Section */}
//       <div style={styles.newClassSection}>
//         <input
//           type="text"
//           placeholder="New Class Name"
//           value={newClassName}
//           onChange={(e) => setNewClassName(e.target.value)}
//           style={styles.input}
//         />
//         <button style={styles.createButton} onClick={handleCreateClass}>
//           Create Class
//         </button>
//       </div>

//       <div style={styles.grid}>
//         {classes.map((cls) => (
//           <div
//             key={cls.id}
//             style={styles.card}
//             onClick={() => handleClassClick(cls.id)}
//           >
//             <div style={styles.className}>{cls.name}</div>
//             <div style={styles.description}>{cls.description}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Classes fetched from IRIS
  const [classes, setClasses] = useState([]);
  // For error handling
  const [errorMessage, setErrorMessage] = useState('');
  // For creating a new class
  const [newClassName, setNewClassName] = useState('');

  // Automatically fetch classes when user logs in / changes
  useEffect(() => {
    if (!user) return; // If not logged in, do nothing

    const fetchClasses = async () => {
      try {
        // IRIS may require spaces replaced with underscores
        const safeUserName = user.displayName ? user.displayName.replace(/\s+/g, '_') : 'UnknownUser';

        const response = await fetch(`http://localhost:5010/list_classes?user_name=${safeUserName}`);
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText);
        }
        const data = await response.json();
        if (data.status === 'success') {
          // data.classes might be an array of raw class names, e.g. ['CS194W', 'ML2025']
          const fetched = data.classes.map((className, index) => ({
            id: `${index}`,         // generate an ID
            name: className,
            description: `Class: ${className}`,
          }));
          setClasses(fetched);
        } else {
          setErrorMessage(data.message || 'Unknown error listing classes');
        }
      } catch (err) {
        console.error('Error listing classes:', err);
        setErrorMessage(err.message);
      }
    };

    fetchClasses();
  }, [user]);

  // Create a new class on the backend, then refresh our local classes
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;

    try {
      const safeUserName = user.displayName ? user.displayName.replace(/\s+/g, "") : 'UnknownUser';

      const response = await fetch('http://localhost:5010/create_class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: safeUserName,
          class_name: newClassName,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to create class');
      }

      console.log('Class creation:', result);
      // Optionally re-fetch or just add to local list
      setClasses((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: newClassName.replace(/\s+/g, ''), // Or however you want
          description: `Class: ${newClassName}`,
        },
      ]);

      setNewClassName('');
    } catch (error) {
      console.error('Error creating class:', error);
      setErrorMessage(error.message);
    }
  };

  // Clicking a class sends user to /class/<className>
  const handleClassClick = (className) => {
    navigate(`/class/${className}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#334155',
      color: 'white',
      padding: '2rem',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    leftSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
    },
    welcome: {
      fontSize: '20px',
      fontWeight: '500',
      marginBottom: '0.5rem',
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: '#1E293B',
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      cursor: 'pointer',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1rem',
    },
    card: {
      padding: '1.5rem',
      backgroundColor: '#1E293B',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    },
    className: {
      fontSize: '18px',
      fontWeight: '500',
      marginBottom: '0.5rem',
    },
    description: {
      color: '#94A3B8',
      fontSize: '14px',
    },
    newClassSection: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      alignItems: 'center',
    },
    input: {
      padding: '0.5rem',
      borderRadius: '6px',
      border: '1px solid #ccc',
      fontSize: '16px',
      outline: 'none',
    },
    createButton: {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#1E293B',
      color: 'white',
      cursor: 'pointer',
    },
    error: {
      color: 'red',
      marginBottom: '1rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.leftSection}>
          <h2 style={styles.welcome}>Welcome {user ? user.displayName : 'User'}</h2>
          <h1 style={styles.title}>My Classes</h1>
        </div>
        <button style={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {errorMessage && <div style={styles.error}>Error: {errorMessage}</div>}

      <div style={styles.newClassSection}>
        <input
          type="text"
          placeholder="New Class Name"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          style={styles.input}
        />
        <button style={styles.createButton} onClick={handleCreateClass}>
          Create Class
        </button>
      </div>

      <div style={styles.grid}>
        {classes.map((cls) => (
          <div
            key={cls.id}
            style={styles.card}
            onClick={() => handleClassClick(cls.name)}
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
