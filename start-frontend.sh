#!/bin/bash

echo "Starting Frontend Development Server..."
cd "/media/cheeta/volume F/projects/Incident_Reporting_App/Reporting_Frontend"

# Run npm dev and log output
npm run dev 2>&1 | tee frontend-output.log