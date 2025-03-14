#!/bin/bash

# Install system dependencies for Render
echo "Installing Poppler for PDF processing..."
sudo apt-get update
sudo apt-get install -y poppler-utils

# Install Python dependencies
pip install -r requirements.txt
