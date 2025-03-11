import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ResumeUpload from "./components/ResumeUpload";
import ResumeDashboard from "./components/ResumeDashboard";
import ReportGeneration from "./components/ReportGeneration";
import Home from "./components/Home";


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
      <Route path="/" element={<Home />} />
        <Route path="/upload" element={<ResumeUpload />} />
        <Route path="/dashboard" element={<ResumeDashboard />} />
        <Route path="/report" element={<ReportGeneration />} />
      </Routes>
    </Router>
  );
}

export default App;
