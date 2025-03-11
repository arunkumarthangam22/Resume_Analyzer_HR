import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HomeImage from "../assets/home-illustration.png"; // Make sure you have an image

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ textAlign: "center", mt: 5 }}>
      {/* ✅ Hero Section */}
      <Grid container spacing={9} alignItems="center">
        {/* Left Side - Text */}
        <Grid item xs={12} md={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            AI-Powered Resume Analyzer
          </Typography>
          <Typography variant="h6" color="textSecondary" paragraph>
            Upload your resume and get an ATS Score. Compare your resume with job descriptions and optimize it for success!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<UploadFileIcon />}
            onClick={() => navigate("/upload")}
            sx={{ mt: 2, mr: 2 }}
          >
            Upload Resume
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate("/report")}
            sx={{ mt: 2 }}
          >
            View Reports
          </Button>
        </Grid>

        {/* Right Side - Image */}
        <Grid item xs={10} md={4}>
          <img src={HomeImage} alt="Resume Analysis" width="100%" />
        </Grid>
      </Grid>

      {/* ✅ Features Section */}
      <Grid container spacing={3} sx={{ mt: 5 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                📄 Upload Resume
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Upload your resume in PDF or DOCX format for ATS analysis.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                🎯 Get ATS Score
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Receive an ATS Score and suggestions to improve your resume.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                📊 Generate Reports
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View and download detailed PDF & Excel reports.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
