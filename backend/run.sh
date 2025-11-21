#!/bin/bash

# Dimini Backend Run Script

echo "Starting Dimini Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Generate Prisma client
echo "Generating Prisma client..."
prisma generate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found!"
    echo "Please create .env file with required configuration"
    echo "You can use .env.sample as a template"
    exit 1
fi

# Run database migrations (optional, uncomment if needed)
# echo "Running database migrations..."
# prisma db push

# Start the server
echo "Starting server..."
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
