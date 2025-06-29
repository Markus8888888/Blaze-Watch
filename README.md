# 🔥 BlazeWatch - "AI-Powered Wildfire Risk Predictor"

**BlazeWatch** is an AI-driven web tool that predicts wildfire spread across Canada and visualizes it on an interactive map, helping communities stay alert and take early action.

---

## Features
- **AI-Powered Risk Prediction**
Predicts wildfire spread based on weather, satellite, and historical data
- **Interactive Heatmap**
Visual heatmap overlay (green = low risk, red = high risk)
- **Detailed Information**
Clickable map points with risk details
- **User-Friendly**
Fast, simple, and accessible interface

---

## Process Overview

### Backend

#### Training the Machine Learning Model
- Uses **satellite and weather data** to train a fire spread predictor
- Fire boundaries are represented by **max/min lat/lon points** (N/E/S/W edges)
- For each fire on a given day, the model predicts the **next-day edge coordinates**
- Uses **XGBoost Regressor** within a multi-output regression setup
- Predicts **8 coordinate values** representing 4 directional edge points

#### Model Evaluation
- Uses **Root Mean Square Error (RMSE)** in degrees of latitude/longitude
- **Cross-validation** used to reduce overfitting and improve accuracy

---

### Frontend
- Interactive Leaflet.js map displays risk zones as color-coded markers
- Responsive web interface

---

## Data Sources
- Open weather data (NASA)
- Open satellite data (NASA)

---

## Tech Stack

### Machine Learning
- `pandas`, `geopandas`, `numpy`, `matplotlib`  
- `scikit-learn`, `xgboost`, `pickle`  
- `openmeteo-requests`, `retry-requests`, `requests-cache`  
- `contextily` (for basemaps)

### Backend
- `Flask` (RESTful API)

### Frontend
- `HTML`, `CSS`, `JavaScript`
- `Leaflet.js` for geospatial visualization

---
