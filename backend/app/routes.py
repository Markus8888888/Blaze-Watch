from app import app
from flask import request, jsonify, render_template
import pickle
import numpy as np

spreadModel = pickle.load(open("spread_model.pkl", "rb"))

@app.route('/predict-spread', methods=['POST'])
def predictSpread():
    coords = request.json
    lat_max_lat = coords.get("lat_max_lat")
    lat_max_lng = coords.get("lat_max_lng")
    lat_min_lat = coords.get("lat_min_lat")
    lat_min_lng = coords.get("lat_min_lng")
    lon_max_lat = coords.get("lon_max_lat")
    lon_max_lng = coords.get("lon_max_lng")
    lon_min_lat = coords.get("lon_min_lat")
    lon_min_lng = coords.get("lon_min_lng")

    print(f"Received coordinates: {coords}")

    lonMax = coords.get("lon_max_lng")
    lonMin = coords.get("lon_min_lng")
    latMax = coords.get("lat_max_lat")
    latMin = coords.get("lat_min_lat")
    X = np.array([[latMax, latMin, lonMax, lonMin]])

    prediction = spreadModel.predict(X)

    return jsonify({'predictions': prediction.tolist()})

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/map')
def map():
    return render_template('map.html')

@app.route('/about')
def about():
    return render_template('about.html')