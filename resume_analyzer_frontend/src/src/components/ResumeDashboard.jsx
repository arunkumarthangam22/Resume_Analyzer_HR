import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";


const COLORS = ["#0088FE", "#00C49F"];

const ResumeDashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterScore, setFilterScore] = useState(0);
  const [shortlistFilter, setShortlistFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); // New State for Search

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/resumes/");
      console.log("📡 Fetched Resumes:", response.data);
      setResumes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("❌ Error fetching resumes:", error);
      setError("Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/resumes/${id}/delete/`);
      setResumes(resumes.filter((resume) => resume.id !== id));
      console.log(`🗑️ Deleted Resume ID: ${id}`);
    } catch (error) {
      console.error("❌ Error deleting resume:", error);
    }
  };

  const handleDownload = (filePath) => {
    const cleanPath = filePath.replace(/^media\//, "");
    const url = `http://127.0.0.1:8000/${cleanPath}`;
    window.open(url, "_blank");
  };




    const handleDownloadExcel = () => {
      window.open("http://127.0.0.1:8000/api/report/excel/", "_blank");
    };
  
    const handleDownloadPDF = () => {
      window.open("http://127.0.0.1:8000/api/report/pdf/", "_blank");
    };



  // ✅ Filter resumes based on ATS Score, Shortlisted Status & Search Query
  const filteredResumes = resumes.filter((resume) => {
    const atsScore = typeof resume.ats_score === "number" ? resume.ats_score : 0;
    const meetsScore = atsScore >= filterScore;
    const isShortlisted = resume.shortlisted === true;
    const meetsShortlist =
      shortlistFilter === "all"
        ? true
        : shortlistFilter === "yes"
        ? isShortlisted
        : !isShortlisted;

    const matchesSearch =
      resume.resume_file?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resume.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resume.phone_number?.toLowerCase().includes(searchQuery.toLowerCase());

    return meetsScore && meetsShortlist && matchesSearch;
  });

  const chartData = filteredResumes.map((resume) => ({
    name: `Resume ${resume.id}`,
    score: resume.ats_score || 0,
  }));

  const shortlistedCount = filteredResumes.filter((r) => r.shortlisted).length;
  const notShortlistedCount = filteredResumes.length - shortlistedCount;
  const pieData = [
    { name: "Shortlisted", value: shortlistedCount },
    { name: "Not Shortlisted", value: notShortlistedCount },
  ];

  return (
    <Container maxWidth="xl" sx={{ width: "100%", marginTop: "20px", overflowX: "auto" }}>
      <Typography variant="h4" align="center" gutterBottom>
        Resume Dashboard
      </Typography>

      {/* ✅ Filters */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Search (File, Email, Phone)"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Filter by ATS Score (Min %)"
            type="number"
            fullWidth
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value) || 0)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Filter by Shortlisted</InputLabel>
            <Select value={shortlistFilter} onChange={(e) => setShortlistFilter(e.target.value)}>
              <MenuItem value="all">All Resumes</MenuItem>
              <MenuItem value="yes">Shortlisted Only</MenuItem>
              <MenuItem value="no">Not Shortlisted</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* ✅ Charts */}
      <Grid container spacing={3} sx={{ marginTop: "20px" }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ width: "100%" }}>
            <CardContent>
              <Typography variant="h6" align="center">
                ATS Score Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3f51b5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ width: "100%" }}>
            <CardContent>
              <Typography variant="h6" align="center">
                Shortlisted Candidates
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ Resume Table */}
      <TableContainer component={Paper} sx={{ marginTop: "20px", width: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>File Name</b></TableCell>
              <TableCell><b>ATS Score</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Phone</b></TableCell>
              <TableCell><b>Shortlisted</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResumes.map((resume, index) => (
              <TableRow key={index}>
                <TableCell>{resume.id}</TableCell>
                <TableCell>{resume.resume_file?.split("/").pop() || "N/A"}</TableCell>
                <TableCell>{resume.ats_score?.toFixed(2) + "%"}</TableCell>
                <TableCell>{resume.email || "Not Found"}</TableCell>
                <TableCell>{resume.phone_number || "Not Found"}</TableCell>
                <TableCell>{resume.shortlisted ? "✅ Yes" : "❌ No"}</TableCell>
                <TableCell>
                    <Button onClick={() => handleDownload(resume.resume_file)}><DownloadIcon /></Button>
                    <Button onClick={() => handleDelete(resume.id)} color="error"><DeleteIcon /></Button>
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <br />
      <br />
      <Grid container spacing={10} justifyContent="center" sx={{ marginBottom: "70px" }}>
      <Grid item>
        <Button variant="contained" color="primary" onClick={handleDownloadExcel} startIcon={<TableChartIcon />}>
          Download Excel
        </Button>
      </Grid>
      <Grid item>
        <Button variant="contained" color="secondary" onClick={handleDownloadPDF} startIcon={<PictureAsPdfIcon />}>
          Download PDF
        </Button>
      </Grid>
    </Grid>
    </Container>

    
  );
};

export default ResumeDashboard;
