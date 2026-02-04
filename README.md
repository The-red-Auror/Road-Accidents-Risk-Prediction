# 🚦 Road Accident Risk Prediction System

An AI-powered web application to predict road accident risk for selected road segments using machine learning and real-time weather data.

## 🔍 Features
- Predicts accident risk: Low / Medium / High
- Map-based location selection (Pune)
- Real-time weather integration
- Accident hotspot visualization
- XGBoost ML model
- FastAPI backend + HTML/CSS/JS frontend

## 🧠 Tech Stack
- Python (FastAPI, scikit-learn, XGBoost)
- HTML, CSS, JavaScript
- Leaflet.js (maps)
- OpenWeather API

## 🚀 How to Run Locally
```bash
pip install -r requirements.txt
python -m uvicorn app:app --reload

Open:
API Docs: http://127.0.0.1:8000/docs
Frontend: open frontend/index.html

ML Model
Trained on Pune road accident data
Features: location, road type, lanes, speed limit, weather, time

DGs
SDG 3: Good Health & Well-being
SDG 11: Sustainable Cities & Communities