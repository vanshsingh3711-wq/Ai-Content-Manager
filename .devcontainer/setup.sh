#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Setting up AI Content Manager & Remotion "
echo "=========================================="

# 1. Install system dependencies for Remotion & FFmpeg
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
    ffmpeg \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    fonts-liberation

# 2. Install Root and Package Node dependencies
npm install
cd packages/motion-components
npm install

# 3. Ensure Remotion headless browser is downloaded
npx remotion browser ensure

cd ../..

# 4. Set up Python virtual environment
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip

# Install requirements if present
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi
if [ -f "apps/worker/requirements.txt" ]; then
    pip install -r apps/worker/requirements.txt
fi
if [ -f "apps/api/requirements.txt" ]; then
    pip install -r apps/api/requirements.txt
fi

echo "=========================================="
echo " Codespaces Setup Complete!               "
echo " Remotion and AI Pipeline Ready to Run.   "
echo "=========================================="
