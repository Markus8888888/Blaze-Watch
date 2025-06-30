# 🔥 BlazeWatch - "AI-Powered Wildfire Risk Predictor"

**BlazeWatch** is an AI-driven web tool that predicts wildfire spread across Canada and visualizes risk zones on an interactive map. It helps local communities to stay alert and take early action.

![BlazeWatch demo](wildfire.gif)

---

## Features
- **AI-Powered Risk Prediction**
Predicts wildfire spread based on weather, satellite, and vegetation data
- **Interactive Heatmap**
Visual heatmap overlay with colour-coded markers
- **Detailed Information**
Clickable map points with risk details
- **User-Friendly**
Fast, simple, and accessible interface

---

## Process Overview

### Training the Machine Learning Model
- Uses **satellite and weather data** to train a fire spread predictor
- Fire boundaries are represented by **max/min lat/lon points** (N/E/S/W edges)
- For each fire on a given day, the model predicts the **next-day edge coordinates**
- Uses **XGBoost Regressor** within a multi-output regression setup
- Predicts **8 coordinate values** representing 4 directional edge points

### Model Evaluation
- Uses **Root Mean Square Error (RMSE)** in degrees of latitude/longitude
- **Cross-validation** used to reduce overfitting and improve accuracy

---
## Architecture

### Backend (Flask)
- Hosts an API to return model predictions
- Serves "map.html" (main interface), "landing.html", and "about.html"

### Frontend
- Satellite basemap through **Esri World Imagery**
- Interactive fire risk points clustered with **Leaflet.markercluster**
- Dynamic side panel shows:
    - Risk percentage (colour-coded)
    - Geographic coordinates
- Clickable clusters reveal all contained markers
- Smooth animated transitions

---

## Data Sources
- **NASA FIRMS** (hotspot detection via LANDSAT, MODIS, VIIRS)
- **Open-Meteo API** (weather features like wind speed, temperature, humidity)
- Custom preprocessing of historical wildfire perimeter data

---

## Tech Stack

### Machine Learning
- `pandas`, `geopandas`, `numpy`, `matplotlib`  
- `scikit-learn`, `xgboost`, `pickle`  
- `openmeteo-requests`, `retry-requests`, `requests-cache`  
- `contextily` (for basemaps when training visualization)

### Backend
- `Flask` (Python REST API)

### Frontend
- `HTML`, `CSS`, `JavaScript`
- `Leaflet.js` (map)
- `Leaflet.markercluster`
- Responsive side panel (vanilla JS + CSS)

---
