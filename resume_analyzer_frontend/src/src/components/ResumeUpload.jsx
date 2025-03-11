import React, { useState } from "react";
import axios from "axios";
import {
  Container, Card, CardContent, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress
} from "@mui/material";

const ResumeUpload = () => {
  const [files, setFiles] = useState([]);  // ✅ Ensure files are always an array
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);  // ✅ Ensure results is always an array

  const [jobTitle, setJobTitle] = useState("Junior Software Engineer"); 
const [jobDescription, setJobDescription] = useState(
  "Assist in designing, developing, and testing software applications. Learn and collaborate with senior developers to build scalable solutions."
);
const [requiredSkills, setRequiredSkills] = useState(
  "Python, JavaScript, HTML, CSS, SQL, Git"
);
const [preferredQualifications, setPreferredQualifications] = useState(
  "Bachelor's degree in Computer Science, Information Technology, or a related field. Open to candidates with coding bootcamp experience."
);
const [responsibilities, setResponsibilities] = useState(
  "Write and test code, debug simple issues, participate in team discussions, and learn best coding practices under senior guidance."
);
const [atsThreshold, setAtsThreshold] = useState(40); // ✅ Lowered for freshers



  // // ✅ HR Job Data Inputs
  // const [jobTitle, setJobTitle] = useState("Software Engineer");
  // const [jobDescription, setJobDescription] = useState("Responsible for developing applications.");
  // const [requiredSkills, setRequiredSkills] = useState("Python, Django, React");
  // const [preferredQualifications, setPreferredQualifications] = useState("Computer Science Degree");
  // const [responsibilities, setResponsibilities] = useState("Develop software, Fix bugs");
  // const [atsThreshold, setAtsThreshold] = useState(60); // ✅ Set threshold for shortlisting

  //✅ HR Job Data Inputs
// const [jobTitle, setJobTitle] = useState("Software Engineer");
// const [jobDescription, setJobDescription] = useState(
//   "Design, develop, and maintain software applications. Collaborate with teams to create scalable solutions."
// );
// const [requiredSkills, setRequiredSkills] = useState(
//   "Python, JavaScript, React, Django, SQL"
// );
// const [preferredQualifications, setPreferredQualifications] = useState(
//   "Bachelor's degree in Computer Science, Information Technology, or related field"
// );
// const [responsibilities, setResponsibilities] = useState(
//   "Develop applications, debug issues, implement APIs, optimize performance, and collaborate with cross-functional teams."
// );
// const [atsThreshold, setAtsThreshold] = useState(50); // ✅ Set a moderate threshold for shortlisting


  // ✅ Handle file selection (multiple files)
  const handleFileChange = (event) => {
    const selectedFiles = event.target.files ? [...event.target.files] : [];
    setFiles(selectedFiles);
  };

  // ✅ Upload resumes
  // ✅ Upload resumes
const handleUpload = async () => {
  if (!files.length) {
    setMessage("Please select at least one file.");
    return;
  }

  setUploading(true);
  setMessage("");
  setResults([]);

  // ✅ Prepare job data
  const jobData = {
    job_title: jobTitle,
    job_description: jobDescription,
    required_skills: requiredSkills.split(",").map(skill => skill.trim()),
    preferred_qualifications: preferredQualifications.split(",").map(q => q.trim()),
    responsibilities: responsibilities.split(",").map(r => r.trim()),
    ats_threshold: atsThreshold // ✅ Send threshold to backend
  };

  const formData = new FormData();
  for (let file of files) {
    formData.append("resume_file", file);
  }
  formData.append("job_data", JSON.stringify(jobData));

  try {
    const response = await axios.post("http://127.0.0.1:8000/api/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("📡 Server Response:", response.data);

    // ✅ Fix: Correct response key for multiple files
    if (response.data.resumes) {  
      setResults(response.data.resumes);  // ✅ Use "resumes" instead of "uploaded_resumes"
    } else {
      setResults([response.data]);  // ✅ Handle single file uploads
    }

    setMessage("Upload completed.");
  } catch (error) {
    console.error("❌ Error uploading files:", error);
    setMessage("Upload failed. Please try again.");
  } finally {
    setUploading(false);
  }
};


  return (
    <Container maxWidth="md" style={{ marginTop: "30px" }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            Upload Multiple Resumes
          </Typography>

          {/* ✅ HR Job Data Inputs */}
          <TextField
            label="Job Title"
            fullWidth
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Job Description"
            fullWidth
            multiline
            rows={2}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Required Skills (comma-separated)"
            fullWidth
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Preferred Qualifications (comma-separated)"
            fullWidth
            value={preferredQualifications}
            onChange={(e) => setPreferredQualifications(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Responsibilities (comma-separated)"
            fullWidth
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            margin="normal"
          />
          <TextField
            label="ATS Score Threshold (%)"
            type="number"
            fullWidth
            value={atsThreshold}
            onChange={(e) => setAtsThreshold(e.target.value)}
            margin="normal"
          />

          {/* ✅ File Input */}
          <input
            type="file"
            accept=".pdf,.docx"
            multiple
            onChange={handleFileChange}
            style={{ marginTop: "15px", display: "block" }}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleUpload}
            disabled={uploading}
            style={{ marginTop: "15px" }}
          >
            {uploading ? <CircularProgress size={24} /> : "Upload Resumes"}
          </Button>

          {message && <Typography variant="body1" color="textSecondary" align="center" style={{ marginTop: "15px" }}>{message}</Typography>}

          {/* ✅ Show Uploaded Resume Results */}
          {results && results.length > 0 && (
            <TableContainer component={Paper} style={{ marginTop: "20px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>Resume ID</b></TableCell>
                    <TableCell><b>File Name</b></TableCell>
                    <TableCell><b>ATS Score</b></TableCell>
                    <TableCell><b>Email</b></TableCell>
                    <TableCell><b>Phone</b></TableCell>
                    <TableCell><b>Shortlisted</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.resume_id}</TableCell>
                      <TableCell>{result.file_name}</TableCell>
                      <TableCell>{result.ats_score ? result.ats_score.toFixed(2) + "%" : "N/A"}</TableCell>
                      <TableCell>{result.email || "Not Found"}</TableCell>
                      <TableCell>{result.phone_number || "Not Found"}</TableCell>
                      <TableCell>
                        {result.shortlisted ? "✅ Yes" : "❌ No"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ResumeUpload;
