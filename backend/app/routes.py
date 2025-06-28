from app import app
from flask import request, jsonify
import pickle
import numpy as np

spreadModel = pickle.load(open("spread_model.pkl", "rb"))

@app.route('/predict-spread', methods=['POST'])
def predictSpread():
    coords = request.json
    lonMax = coords.get("lon_max")
    lonMin = coords.get("lon_min")
    latMax = coords.get("lat_max")
    latMin = coords.get("lat_min")
    X = np.array([[latMax, latMin, lonMax, lonMin]])

    prediction = spreadModel.predict(X)
    return jsonify({'predictions': prediction.tolist()})