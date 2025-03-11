import React, { useState, useEffect } from "react";
import axios from "axios";
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
  CircularProgress,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import { Pie } from "react-chartjs-2";
import "chart.js/auto"; // Required for Chart.js v3+

const ReportGeneration = () => {
  const [reportType, setReportType] = useState("all");
  const [totalResumes, setTotalResumes] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [notShortlistedCount, setNotShortlistedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch summary when report type changes
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/resumes/");
      const resumes = response.data;
      const shortlisted = resumes.filter((r) => r.shortlisted).length;
      setTotalResumes(resumes.length);
      setShortlistedCount(shortlisted);
      setNotShortlistedCount(resumes.length - shortlisted);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
    setLoading(false);
  };

  // Fetch summary when the component mounts
  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownload = (format) => {
    let url = `http://127.0.0.1:8000/api/report/${format}/?filter=${reportType}`;
    window.open(url, "_blank");
  };

  // Pie Chart Data
  const chartData = {
    labels: ["Shortlisted", "Not Shortlisted"],
    datasets: [
      {
        data: [shortlistedCount, notShortlistedCount],
        backgroundColor: ["#4CAF50", "#F44336"],
        hoverBackgroundColor: ["#388E3C", "#D32F2F"],
      },
    ],
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "30px", textAlign: "center" }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📊 Report Generation
      </Typography>

      {/* Select Report Type */}
      <Card sx={{ mb: 3, p: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
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
            >
              <MenuItem value="all">All Candidates</MenuItem>
              <MenuItem value="shortlisted">Shortlisted Candidates</MenuItem>
              <MenuItem value="not_shortlisted">Not Shortlisted Candidates</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Summary & Pie Chart */}
      <Grid container spacing={4} alignItems="center">
        {/* Summary Card */}
        <Grid item xs={12} md={6.5}>
          <Card sx={{ p: 15.5 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                📑 Summary
              </Typography>
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography variant="h7" fontWeight="bold">Total Resumes: {totalResumes}</Typography>
                  <br />
                  <Typography variant="h7" fontWeight="bold">Shortlisted: {shortlistedCount}</Typography>
                  <br />
                  <Typography variant="h7" fontWeight="bold">Not Shortlisted: {notShortlistedCount}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart Card */}
        <Grid item xs={12} md={5.5}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                📊 Candidates Overview
              </Typography>
              {loading ? (
                <CircularProgress />
              ) : totalResumes > 0 ? (
                <Pie data={chartData} />
              ) : (
                <Typography>No Data Available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Download Buttons */}
      <Grid container spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => handleDownload("pdf")}
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
          >
            Download Excel Report
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportGeneration;
