from app import app
from flask import request, jsonify, render_template
import pickle
import numpy as np
import openmeteo_requests
import requests_cache
import requests

spreadModel = pickle.load(open("spread_model.pkl", "rb"))

cache_sess = requests_cache.CachedSession('.cache', expire_after=5)
om = openmeteo_requests.Client(session=cache_sess)

# set up vegetation data
with open("./training/data_2024/Vegetation.txt", "r") as f:
    lines = f.readlines()

data = []

for line in lines:
    try:
        nums = [int(val) for val in line.strip().split()]
        data.extend(nums)
    except ValueError:
        continue

veg_array = np.array(data[:180 * 360]).reshape((180, 360))

def getWeather(lat, lon):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "wind_direction_10m", "precipitation"],
    }
    responses = om.weather_api(url, params=params)
    resp = responses[0]
    current = resp.Current()
    
    vals = [current.Variables(i).Value() for i in range(current.VariablesLength())]
    return {
        "temperature_2m": vals[0],
        "relative_humidity_2m": vals[1],
        "wind_speed_10m": vals[2],
        "wind_direction_10m": vals[3],
        "precipitation": vals[4],
    }

def getVegetation(lat, lon):
    convertedLat = int(lat + 89.5)  
    convertedLon = int(lon + 180)    

    return veg_array[convertedLat, convertedLon]

def runPredictions(latMaxLat, latMaxLon,
                   latMinLat, latMinLon,
                   lonMaxLat, lonMaxLon,
                   lonMinLat, lonMinLon,
                   count, predictionList = None):
    if predictionList is None:
        predictionList = []
    count -= 1
    points = {
        "LAT_MAX": (latMaxLat, latMaxLon),
        "LAT_MIN": (latMinLat, latMinLon),
        "LON_MAX": (lonMaxLat, lonMaxLon),
        "LON_MIN": (lonMinLat, lonMinLon)
    }

    predictors = []

    predictors.extend([
        latMaxLat, latMaxLon,
        latMinLat, latMinLon,
        lonMaxLat, lonMaxLon,
        lonMinLat, lonMinLon
    ])

    for key, (lat, lon) in points.items():
        weather = getWeather(lat, lon)
        predictors.extend([
            weather["temperature_2m"],
            weather["relative_humidity_2m"],
            weather["wind_speed_10m"],
            weather["wind_direction_10m"],
            weather["precipitation"]
        ])
    
    for key, (lat, lon) in points.items():
        predictors.append(getVegetation(lat, lon))

    X = np.array([predictors])

    prediction = spreadModel.predict(X).tolist()[0] 

    prediction[0] = latMaxLat + prediction[0]
    prediction[1] = latMaxLon + prediction[1]
    prediction[2] = latMinLat + prediction[2]
    prediction[3] = latMinLon + prediction[3]
    prediction[4] = lonMaxLat + prediction[4]
    prediction[5] = lonMaxLon + prediction[5]
    prediction[6] = lonMinLat + prediction[6]
    prediction[7] = lonMinLon + prediction[7]

    predictionList.append(prediction)

    if count == 0:
        return [predictionList]
    else:
        return runPredictions(prediction[0], prediction[1],
                              prediction[2], prediction[3],
                              prediction[4], prediction[5],
                              prediction[6], prediction[7],
                              count, predictionList)

# routes
@app.route('/predict-spread', methods=['POST'])
def predictSpread():
    coords = request.json
    lonMaxLat = coords.get("lon_max_lat")
    lonMaxLon = coords.get("lon_max_lng")
    lonMinLat = coords.get("lon_min_lat")
    lonMinLon = coords.get("lon_min_lng")
    latMaxLat = coords.get("lat_max_lat")
    latMaxLon = coords.get("lat_max_lng")
    latMinLat = coords.get("lat_min_lat")
    latMinLon = coords.get("lat_min_lng")

    predictions = runPredictions(latMaxLat, latMaxLon,
                                 latMinLat, latMinLon,
                                 lonMaxLat, lonMaxLon,
                                 lonMinLat, lonMinLon,
                                 3)
    # print(predictions)
    return jsonify({'predictions': predictions})

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/map')
def map():
    return render_template('map.html')

@app.route('/about')
def about():
    return render_template('about.html')