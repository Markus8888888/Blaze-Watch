# 🔥 BlazeWatch – AI-Powered Wildfire Risk Prediction

BlazeWatch is an AI-driven web tool that predicts wildfire risk and visualizes it on an interactive map, helping communities and responders stay ahead of potential fires.

## 🚀 Features

- **AI-Powered Risk Prediction**: Predicts wildfire risk based on weather, vegetation, and historical data
- **Interactive Heatmap**: Visual heatmap overlay (green = low risk, red = high risk)
- **Detailed Information**: Clickable map points with risk details
- **User-Friendly**: Fast, simple, and accessible interface

## 🧠 How It Works

### Backend
- Trained ML model (e.g. Random Forest) predicts fire risk scores (0–1) for grid coordinates
- RESTful API built with Flask

### Frontend
- Interactive Leaflet.js map displays risk zones as color-coded markers
- Responsive web interface

### Data Sources
- Open weather & satellite data (e.g. NASA FIRMS, NOAA)
- Real-time environmental monitoring

## ⚡ Tech Stack

- **Machine Learning**: Python (Scikit-learn or XGBoost)
- **Backend**: Flask (API)
- **Frontend**: HTML/CSS/JavaScript
- **Mapping**: Leaflet.js


