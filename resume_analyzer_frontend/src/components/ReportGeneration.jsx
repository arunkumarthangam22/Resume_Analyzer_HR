import React, { useState, useEffect } from "react";
import axios from "axios";
import CircularProgress from '@mui/material/CircularProgress';

import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const ReportGeneration = () => {
  const [reportType, setReportType] = useState("all");
  const [totalResumes, setTotalResumes] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [notShortlistedCount, setNotShortlistedCount] = useState(0);
  const [atsScores, setAtsScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/resumes/");
      const resumes = response.data;
      const shortlisted = resumes.filter((r) => r.shortlisted).length;
      setTotalResumes(resumes.length);
      setShortlistedCount(shortlisted);
      setNotShortlistedCount(resumes.length - shortlisted);
      setAtsScores(resumes.map((r) => r.ats_score));
    } catch (error) {
      console.error("Error fetching summary:", error);
      setError("Failed to load resumes.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownload = (format) => {
    let url = `http://127.0.0.1:8000/api/report/${format}/?filter=${reportType}`;
    window.open(url, "_blank");
  };

  // ATS Score Chart Data for Bar Chart
  const atsChartData = atsScores.map((score, index) => ({
    name: `Resume ${index + 1}`,
    score: score,
  }));

  // Pie Chart Data for Shortlisted Candidates
  const pieData = [
    { name: "Shortlisted", value: shortlistedCount },
    { name: "Not Shortlisted", value: notShortlistedCount },
  ];

  const COLORS = ["#0088FE", "#00C49F"];


  // Return loading state if data is being fetched
     if (loading) {
      return (
        <Container maxWidth="xl" sx={{ width: "100%", marginTop: "20px", overflowX: "auto" }}>
          <Typography variant="h4" align="center" gutterBottom color="primary" fontWeight="bold">
            Resume Dashboard
          </Typography>
          <Grid container justifyContent="center" sx={{ marginTop: "20px" }}>
            <CircularProgress />
          </Grid>
        </Container>
      );
    }
  
    // Return error state if there was an issue fetching the data
    if (error) {
      return (
        <Container maxWidth="xl" sx={{ width: "100%", marginTop: "20px", overflowX: "auto" }}>
          <Typography variant="h4" align="center" gutterBottom color="primary" fontWeight="bold">
            Resume Dashboard
          </Typography>
          <Grid container justifyContent="center" sx={{ marginTop: "20px" }}>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
          </Grid>
        </Container>
      );
    }
  
  


    return (
      <Container maxWidth="lg" style={{ marginTop: "40px", textAlign: "center" }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          📊 <strong>Report Generation</strong>
        </Typography>
    
        {/* Display Total Resumes */}
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Total Resumes: {totalResumes}
        </Typography>
    
        {/* Select Report Type */}
        <Card sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="textSecondary" fontWeight="bold">
              Select Report Type
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  fetchSummary();
                }}
                variant="outlined"
                fullWidth
              >
                <MenuItem value="all">All Candidates</MenuItem>
                <MenuItem value="shortlisted">Shortlisted Candidates</MenuItem>
                <MenuItem value="not_shortlisted">Not Shortlisted Candidates</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
    
        {/* ✅ Charts */}
        <Grid container spacing={3} sx={{ marginTop: "20px" }}>
          {/* ATS Score Distribution */}
          <Grid item xs={12} md={6}>
            <Card sx={{ width: "100%", boxShadow: 3, borderRadius: "12px" }}>
              <CardContent>
                <Typography variant="h6" align="center" color="primary" fontWeight="bold">
                  ATS Score Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={atsChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#2f11b5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
    
          {/* Shortlisted Candidates */}
          <Grid item xs={12} md={6}>
            <Card sx={{ width: "100%", boxShadow: 3, borderRadius: "12px" }}>
              <CardContent>
                <Typography variant="h6" align="center" color="primary" fontWeight="bold">
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
    
        {/* Download Buttons */}
        <Grid container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleDownload("pdf")}
              sx={{
                borderRadius: 1,
                padding: "10px 20px",
                boxShadow: 2,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  backgroundColor: "#1976d2",
                  boxShadow: 4,
                },
              }}
            >
              Download PDF Report
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<TableChartIcon />}
              onClick={() => handleDownload("excel")}
              sx={{
                borderRadius: 1,
                padding: "10px 20px",
                boxShadow: 2,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  backgroundColor: "#d32f2f",
                  boxShadow: 4,
                },
              }}
            >
              Download Excel Report
            </Button>
          </Grid>
        </Grid>
      </Container>
    );
    
};

export default ReportGeneration;
