#!/bin/bash

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Copy build to backend/public
mkdir -p backend/public
cp -r frontend/build/* backend/public/ 2>/dev/null || true

# Setup backend
cd backend
pip install -r requirements.txt
cd ..
