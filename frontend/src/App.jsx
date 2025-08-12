import { useState, useEffect } from 'react';
import axios from "axios";
import './styles.css'
import api from "./api"

function App() {
  const [form, setForm] = useState({
    company: '',
    position: '',
    location: '',
    status: 'Applied',
    notes: '',
  });

  const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    color: '#1f2937',
  },
  heading: {
    color: '#111827',
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  form: {
    background: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  input: {
    padding: '0.5rem',
    marginBottom: '1rem',
    width: '100%',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  th: {
    backgroundColor: '#e5e7eb',
    padding: '0.75rem',
    textAlign: 'left',
  },
  td: {
    padding: '0.75rem',
    borderTop: '1px solid #e5e7eb',
  },
};


  const [applications, setApplications] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupForm, setSignupForm] = useState({ email: "", password: "" });
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const sortedApplications = [...applications].sort((a, b) => {
  if (!sortColumn) return 0;

  const aValue = a[sortColumn]?.toString().toLowerCase();
  const bValue = b[sortColumn]?.toString().toLowerCase();
  

  if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
  if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
  return 0;
});

const fetchDashboardData = async () => {
  try {
    const res = await api.get("/dashboard/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    setDashboardData(res.data);
  } catch (error) {
    console.error("Dashboard fetch error:", error);
  }
};

  const handleSort = (column) => {
  if (sortColumn === column) {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  } else { 
    setSortColumn(column);
    setSortDirection("asc");
  }
};


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await api.post('/applications/', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Application created!');
      setForm({
        company: '',
        position: '',
        location: '',
        status: 'Applied',
        notes: '',
      });
      fetchApplications();
      fetchDashboardData();
    } catch (err) {
      console.error('Error:', err);
      alert(err.response?.data?.detail || 'Something went wrong.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchApplications();
      fetchDashboardData();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete application.');
    }
  };

  const handleEditClick = (app) => {
    setEditingId(app.id);
    setEditForm({ ...app });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const { company, position, location, status, notes } = editForm;
      await api.put(`/applications/${editingId}`, {
        company, position, location, status, notes
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingId(null);
      fetchApplications();
      fetchDashboardData();
    } catch (err) {
      console.error('Edit error:', err);
      alert(err.response?.data?.detail || 'Failed to save changes.');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/applications/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(res.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLoggedIn(true);
      fetchApplications();
      fetchDashboardData();
    }
  }, []);

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log("Login form payload:", loginForm);
      const res = await api.post("/login", loginForm);
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      setLoggedIn(true);
      fetchApplications();
      fetchDashboardData();
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed.");
    }
  };

  const handleSignupChange = (e) => {
  setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
};

const handleSignup = async (e) => {
  e.preventDefault();
  try {
    console.log("Signup payload:", signupForm);
    const res = await api.post("/register", signupForm);
    alert("Signup successful! You can now log in.");
    setIsSigningUp(false);
  } catch (error) {
    console.error("Signup error:", error);
    alert("Signup failed. Email may already be in use.");
  }
};

  const getRowStyle = (status) => {
  switch (status.toLowerCase()) {
    case "rejected":
      return { backgroundColor: "#f8d7da" }; // light red
    case "interview":
      return { backgroundColor: "#d4edda" }; // light green
    case "offer":
      return { backgroundColor: "#fff3cd" }; // light gold
    default:
      return {};
  }
};

  const getColorForStatus = (status) => {
  switch (status.toLowerCase()) {
    case "rejected":
      return "#f8d7da"; // light red
    case "interview":
      return "#d4edda"; // light green
    case "offer":
      return "#fff3cd"; // light gold
    case "applied":
      return "#d1ecf1"; // light blue
    default:
      return "#e2e3e5"; // neutral gray
  }
};


  const handleResumeUpload = (e) => {
  setResumeFile(e.target.files[0]);
};

const handleResumeSubmit = async (e) => {
  e.preventDefault();
  if (!resumeFile || !jobDesc) {
    alert("Please provide both resume and job description.");
    return;
  }

  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("job_description", jobDesc);

  try {
    const token = localStorage.getItem("token");
    const res = await api.post("/analyze-resume/", formData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    setAnalysisResult(res.data);
  } catch (err) {
    console.error("Analysis error:", err);
    alert("Failed to analyze resume.");
  }
};






console.log(getColorForStatus("interview")); // should print "#28a745"






 return (
  <div className="container">
    {!loggedIn ? (
      <div className="centered">
      <div className="text-center">
        <h1 className="main-title">JobTracker</h1>
        <p className="description">
          Effortlessly manage your job applications in one place. Track, analyze, and stay organized.
        </p>
      </div>

      <h2 className="text-center">{isSigningUp ? "Sign Up" : "Login"}</h2>

      <form onSubmit={isSigningUp ? handleSignup : handleLogin} className="form">
        <input
          name="email"
          placeholder="Email"
          value={isSigningUp ? signupForm.email : loginForm.email}
          onChange={(e) =>
            isSigningUp
              ? setSignupForm({ ...signupForm, email: e.target.value })
              : setLoginForm({ ...loginForm, email: e.target.value })
          }
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={isSigningUp ? signupForm.password : loginForm.password}
          onChange={(e) =>
            isSigningUp
              ? setSignupForm({ ...signupForm, password: e.target.value })
              : setLoginForm({ ...loginForm, password: e.target.value })
          }
          required
        />
        <button type="submit">{isSigningUp ? "Sign Up" : "Login"}</button>
      </form>

      <div className="text-center mt-4">
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="link-button"
        >
          {isSigningUp
            ? "Already have an account? Log in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  ) : (
      <div className="container">
        <h1 className="text-center">Job Application Tracker</h1>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="form">
          <input name="company" placeholder="Company" value={form.company} onChange={handleChange} required />
          <input name="position" placeholder="Position" value={form.position} onChange={handleChange} required />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
          <select name="status" value={form.status} onChange={handleChange}>
            <option>Applied</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>
          <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
          <button type="submit">Add Application</button>
        </form>

        {/* Applications Table */}
        <div>
          <h2>All Applications</h2>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Position</th>
                <th>Location</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
  const statusClass =
    app.status === "Interview" ? "row-interview" :
    app.status === "Offer" ? "row-offer" :
    app.status === "Rejected" ? "row-rejected" :
    "row-applied";

  const isEditing = editingId === app.id;

  return (
    <tr key={app.id} className={statusClass}>
      <td>
        {isEditing ? (
          <input name="company" value={editForm.company} onChange={handleEditChange} />
        ) : (
          app.company
        )}
      </td>
      <td>
        {isEditing ? (
          <input name="position" value={editForm.position} onChange={handleEditChange} />
        ) : (
          app.position
        )}
      </td>
      <td>
        {isEditing ? (
          <input name="location" value={editForm.location} onChange={handleEditChange} />
        ) : (
          app.location
        )}
      </td>
      <td>
        {isEditing ? (
          <select name="status" value={editForm.status} onChange={handleEditChange}>
            <option>Applied</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>
        ) : (
          app.status
        )}
      </td>
      <td>
        {isEditing ? (
          <input name="notes" value={editForm.notes} onChange={handleEditChange} />
        ) : (
          app.notes
        )}
      </td>
      <td>{new Date(app.applied_date).toLocaleDateString()}</td>
      <td className="action-buttons">
        {isEditing ? (
          <>
            <button onClick={handleEditSave}>Save</button>
            <button onClick={handleEditCancel} className="alt-button">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => handleEditClick(app)}>Edit</button>
            <button onClick={() => handleDelete(app.id)} className="alt-button">Delete</button>
          </>
        )}
      </td>
    </tr>
  );
})}

            </tbody>
          </table>
        </div>

        {/* Resume Analyzer */}
        <div>
          <h2>Resume Analyzer</h2>
          <form onSubmit={handleResumeSubmit} className="form">
            <div>
              <label>Upload Resume (PDF):</label>
              <input type="file" accept=".pdf" onChange={handleResumeUpload} required />
            </div>
            <div>
              <label>Paste Job Description:</label>
              <textarea
                name="job_description"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={6}
                placeholder="Enter job description here"
                required
              />
            </div>
            <button type="submit">Analyze</button>
          </form>

          {analysisResult && (
            <div className="analysis-box">
              <h3>Analysis Result</h3>
              <p>Match Score: {analysisResult.match_score}%</p>
              <strong>Missing Keywords:</strong>
              <ul>
                {analysisResult.missing_keywords.map((kw, idx) => (
                  <li key={idx}>{kw}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              setLoggedIn(false);
            }}
            className="alt-button"
          >
            Logout
          </button>
        </div>
      </div>
    )}
  </div>
);
}

export default App;
