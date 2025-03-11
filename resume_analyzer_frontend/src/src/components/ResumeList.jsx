import React, { useEffect, useState } from "react";
import axios from "axios";

const ResumeList = () => {
  const [resumes, setResumes] = useState([]);
  const [filterThreshold, setFilterThreshold] = useState(0);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/resumes/");
      setResumes(response.data);
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Analyzed Resumes</h2>

      <label>Filter by ATS Score:</label>
      <input
        type="number"
        value={filterThreshold}
        onChange={(e) => setFilterThreshold(e.target.value)}
        placeholder="Min ATS Score"
      />

      <table border="1" style={{ margin: "auto", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Resume ID</th>
            <th>Email</th>
            <th>Phone</th>
            <th>ATS Score</th>
          </tr>
        </thead>
        <tbody>
          {resumes
            .filter((resume) => resume.ats_score >= filterThreshold)
            .map((resume) => (
              <tr key={resume.id}>
                <td>{resume.id}</td>
                <td>{resume.email || "Not Found"}</td>
                <td>{resume.phone_number || "Not Found"}</td>
                <td>{resume.ats_score.toFixed(2)}%</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResumeList;
