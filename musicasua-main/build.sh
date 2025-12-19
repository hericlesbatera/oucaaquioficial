#!/bin/bash

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Setup backend
cd backend
pip install -r requirements.txt
cd ..
