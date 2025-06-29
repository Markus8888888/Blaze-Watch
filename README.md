BlazeWatch - "AI-Powered Wildfire Risk Predictor"

BlazeWatch is an AI-driven web tool that predicts Canadian wildfire spreads over time, and visualizes it on an interactive map, helping local communities to stay alert of potential fires.

Process

Training the Machine Learning (ML) Model:
- Our web app uses satilite and weather data to train a ML model to predict fire spreads. The model takes the maximum and minimum latitude and longitude points from each daily fire, which represent the bounding circle of the fire. This informs the model of the N/E/S/W edge points.
- Given a day's fire boundary, the model's target outputs will be the next day's edge coordinates.
- 




















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


