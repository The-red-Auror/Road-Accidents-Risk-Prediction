from fastapi import FastAPI
import streamlit as st
import joblib
import pandas as pd
import requests
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

from typing import List
from pydantic import BaseModel

class RoutePoint(BaseModel):
    lat: float
    lon: float


class RouteRequest(BaseModel):
    route_points: List[RoutePoint]
class RoutePoint(BaseModel):
    lat: float
    lon: float


class RouteRequest(BaseModel):
    route_points: List[RoutePoint]




with open("Road_accident_risk_prediction.pkl", "rb") as f:
    model = joblib.load(f)


# =====================
# CONFIG
# =====================
WEATHER_API_KEY = "84e3fcd88696df87425fc6d12909a713"

# =====================
# LOAD MODEL
# =====================
#with open("model/road_risk_xgb_model.pkl", "rb") as f:
 #   model = pickle.load(f)

# =====================
# FASTAPI APP
# =====================
app = FastAPI(title="Road Risk Prediction API")

app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
def home():
    return {
        "message": "Road Risk Prediction API is running",
        "endpoints": ["/predict"]
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all (safe for local dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================
# WEATHER FETCH FUNCTION
# =====================
def get_weather(lat, lon):
    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}"
    )
    response = requests.get(url).json()
    weather = response["weather"][0]["main"]
    return weather


# =====================
# PREDICTION ENDPOINT
# =====================
@app.post("/predict")
def predict_risk(data: dict):
    lat = data["latitude"]
    lon = data["longitude"]

    # ---- Time features ----
    now = datetime.now()
    hour = now.hour
    day = now.day
    month = now.month
    day_of_week = now.weekday()
    year = now.year

    # ---- Weather ----
    weather = get_weather(lat, lon)

    # ---- Build model input ----
    input_df = pd.DataFrame([{
        "latitude": lat,
        "longitude": lon,
        "road_type": data["road_type"],
        "lanes": data["lanes"],
        "speed_limit": data["speed_limit"],
        "weather": weather,
        "year": year,
        "month": month,
        "day": day,
        "day_of_week": day_of_week,
        "hour": hour
    }])

    # ---- Prediction ----
    pred = model.predict(input_df)[0]
    prob = model.predict_proba(input_df).max()

    risk_map = {0: "Low", 1: "Medium", 2: "High"}

    return {
        "risk": risk_map[pred],
        "confidence": round(float(prob), 2),
        "weather": weather,
        "time": f"{hour}:00",
        "date": f"{day}-{month}-{year}"
    }


# =====================
# ROUTE RISK ENDPOINT
# =====================

class RoutePoint(BaseModel):
    lat: float
    lon: float

class RouteRequest(BaseModel):
    route_points: List[RoutePoint]


@app.post("/route-risk")
def route_risk(data: RouteRequest):
    results = []

    now = datetime.now()
    hour = now.hour
    day = now.day
    month = now.month
    day_of_week = now.weekday()
    year = now.year

    for point in data.route_points:
        input_df = pd.DataFrame([{
            "latitude": point.lat,
            "longitude": point.lon,
            "road_type": "local",      # temporary default
            "lanes": 2,                # temporary default
            "speed_limit": 40,         # temporary default
            "weather": "Clear",        # temporary default
            "year": year,
            "month": month,
            "day": day,
            "day_of_week": day_of_week,
            "hour": hour
        }])

        pred = model.predict(input_df)[0]
        prob = model.predict_proba(input_df).max()

        risk_map = {0: "Low", 1: "Medium", 2: "High"}

        results.append({
            "lat": point.lat,
            "lon": point.lon,
            "risk": risk_map[pred],
            "confidence": round(float(prob), 2)
        })

    return {
        "total_points": len(results),
        "route_risk": results
    }
