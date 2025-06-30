# Blaze Watch - AI Wildfire Predictor

An AI-driven web tool that predicts wildfire spread across Canada and visualizes risk zones on an interactive map. It helps local communities to stay alert and take early action.

<p style="text-align: center;">
  <img src="app/static/img/wildfire.gif" alt="BlazeWatch demo" width="500">
</p>

## Features
- **AI-Powered Risk Prediction**
Predicts wildfire spread based on weather, satellite, and vegetation data
- **Interactive Heatmap**
Visual heatmap overlay with colour-coded markers
- **Detailed Information**
Clickable map points with risk details
- **User-Friendly**
Fast, simple, and accessible interface



## Installation
1. Clone the repo:
    ```sh
   git clone https://github.com/AustinBao/blaze-watch
   ```
2. Install pip packages
    ```sh
   pip install -requirements
   ```
3. Run Flask
    ```sh
   flask run
   ```



## How We Trained Our AI

### Training the Machine Learning Model
- Trained on satellite, weather, and vegetation data to predict fire spread
- Fire boundaries defined by max/min latitude and longitude points (N/E/S/W edges)
- Model predicts next-day boundary coordinates for each fire area
- Uses an XGBoost multi-output regression model
- Outputs 8 coordinate values representing updated fire edges

### Model Evaluation
- Evaluated with Root Mean Square Error (RMSE) in lat/lon degrees
- Applies cross-validation to ensure accuracy and prevent overfitting




## Architecture

### Backend (Flask)
- Serves pages: `/` (landing), `/map`, `/about`
- API `/predict-spread`:
  - Takes fire cluster bounds
  - Fetches weather & vegetation data
  - Runs ML model to predict 3-day fire spread
  - Returns prediction JSON

### Frontend (JS + Leaflet)
- Map centered on Canada with **Esri World Imagery**
- Fetches daily fire points from NASA FIRMS (fallback to local CSV)
- Clusters fires using **Supercluster** at zoom 4
- Cluster colors: yellow (small), orange (medium), red (large)
- Clicking cluster:
  - Expands points
  - Sends bounds to backend for predictions
  - Shows 3-day spread polygons & circles
- Side panel shows risk %, coordinates, and day slider
- Smooth map controls with loading indicators


## Data Sources
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/download/) (hotspot detection via LANDSAT, MODIS, VIIRS)
- [Open-Meteo API](https://open-meteo.com/en/docs) (Weather features like wind speed, temperature, humidity)
- [NASA GISS](https://data.giss.nasa.gov/landuse/vegeem.html) (Vegetation data)
- [Natural Resources Canada](https://cwfis.cfs.nrcan.gc.ca/datamart/metadata/fm3buffered) (historical wildfire perimeter data)


## Tech Stack

### Machine Learning
- `pandas`, `geopandas`, `numpy`, `matplotlib`  
- `scikit-learn`, `xgboost`, `pickle`  
- `openmeteo-requests`, `retry-requests`, `requests-cache`  
- `contextily` 

### Backend
- `Flask` 

### Frontend
- `HTML`, `CSS`, `JavaScript`
- `Bootstrap`
- `Leaflet.js`
- `Supercluster`
- `Turf.js`
- `noUiSlider`
