from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
import os

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "data/processed/final_dataset.csv"
FORECAST_PATH = "data/processed/city_forecast.csv"
RISK_MODEL_PATH = "models/risk_model.pkl"

PATIENT_RECORDS_PATH = "data/patient_records.csv"

class PatientRecord(BaseModel):
    patient_name: str
    age: int
    gender: str
    diagnosis: str
    address: str
    ward_id: int
    date: str
    contact: str = ""
    notes: str = ""

# Global model variable
risk_model = None
if os.path.exists(RISK_MODEL_PATH):
    try:
        risk_model = joblib.load(RISK_MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}")

@app.get("/api/overview")
async def get_overview():
    if not os.path.exists(DATA_PATH):
        return {"error": "Data not found"}
    
    df = pd.read_csv(DATA_PATH)
    df['date'] = pd.to_datetime(df['date'])
    latest_date = df['date'].max()
    today_df = df[df['date'] == latest_date]
    
    total_cases = int(today_df['case_count'].sum())
    high_risk_wards = int(today_df[today_df['risk_score'] > 70]['ward_id'].nunique())
    avg_risk = float(today_df['risk_score'].mean())
    active_alerts = int(today_df[today_df['is_anomaly'] == 1].shape[0])
    
    # Trends for chart
    city_trend = df.groupby('date')['case_count'].sum().reset_index()
    city_trend['date'] = city_trend['date'].dt.strftime('%Y-%m-%d')
    trend_data = city_trend.tail(30).to_dict(orient='records')
    
    return {
        "latest_date": latest_date.strftime('%Y-%m-%d'),
        "stats": {
            "total_cases": total_cases,
            "high_risk_wards": high_risk_wards,
            "health_index": round(100 - avg_risk, 1),
            "active_alerts": active_alerts
        },
        "trend": trend_data
    }

@app.get("/api/wards")
async def get_wards():
    if not os.path.exists(DATA_PATH):
        return {"error": "Data not found"}
    
    df = pd.read_csv(DATA_PATH)
    df['date'] = pd.to_datetime(df['date'])
    latest_date = df['date'].max()
    today_df = df[df['date'] == latest_date].copy()
    
    # Simulating coordinates for the map
    import numpy as np
    np.random.seed(42)
    today_df['lat'] = 22.7196 + np.random.uniform(-0.08, 0.08, len(today_df))
    today_df['lon'] = 75.8577 + np.random.uniform(-0.08, 0.08, len(today_df))
    
    return today_df.to_dict(orient='records')

@app.get("/api/forecast")
async def get_forecast():
    if not os.path.exists(FORECAST_PATH):
        return {"error": "Forecast data not found"}
    
    df = pd.read_csv(FORECAST_PATH)
    return df.to_dict(orient='records')

@app.post("/api/simulate")
async def simulate_risk(params: dict = Body(...)):
    if risk_model is None:
        return {"error": "Risk model not loaded"}
    
    # Simulation factors
    rain_inc = float(params.get('rain_inc', 0))
    temp_change = float(params.get('temp_change', 0))
    bacteria_inc = float(params.get('bacteria_inc', 0))
    growth_sim = float(params.get('growth_sim', 0))

    # Load base data to get average features
    df = pd.read_csv(DATA_PATH)
    features = [
        'cases_ma7', 'cases_ma14', 'growth_rate', 
        'rain_lag3', 'rain_lag7', 'temp_lag3', 
        'chlorine_level', 'bacteria_ma3', 'humidity'
    ]
    
    # Create base feature vector (mean of latest records)
    df['date'] = pd.to_datetime(df['date'])
    latest_date = df['date'].max()
    latest_data = df[df['date'] == latest_date]
    
    # Ensure we have data
    if latest_data.empty:
        return {"error": "No recent data for simulation base"}

    # Calculate base risk
    base_risk = float(latest_data['risk_score'].mean())
    
    # Apply simulation changes to all wards
    sim_data = latest_data[features].copy()
    sim_data['rain_lag3'] += rain_inc
    sim_data['rain_lag7'] += rain_inc
    sim_data['temp_lag3'] += temp_change
    sim_data['bacteria_ma3'] += bacteria_inc
    sim_data['growth_rate'] += (growth_sim / 100.0)
    
    # Predict new risk for all wards and take the mean
    new_probs = risk_model.predict_proba(sim_data)[:, 1] * 100
    risk_prob = float(new_probs.mean())
    
    print(f"Simulation: Rain+{rain_inc}, Temp{temp_change}, Bact+{bacteria_inc}, Growth+{growth_sim}%")
    print(f"Base Risk: {base_risk}, Simulated Risk: {risk_prob}")
    
    return {
        "base_risk": base_risk,
        "simulated_risk": risk_prob
    }

@app.get("/api/alerts")
async def get_alerts():
    if not os.path.exists(DATA_PATH):
        return {"error": "Data not found"}
    
    df = pd.read_csv(DATA_PATH)
    df['date'] = pd.to_datetime(df['date'])
    
    # Get latest anomalies/outbreaks
    alerts_df = df[df['is_anomaly'] == 1].sort_values('date', ascending=False).head(10)
    
    # Return as list of records
    return alerts_df.to_dict(orient='records')

@app.post("/api/hospital/register")
async def register_patient(record: PatientRecord):
    """Register a new patient. Saves patient details and increments case count by 1."""
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="Data file not found")
        
    try:
        from datetime import datetime
        
        # 1. Save patient record to patient_records.csv
        patient_dict = record.dict()
        patient_dict['registered_at'] = datetime.now().isoformat()
        
        if os.path.exists(PATIENT_RECORDS_PATH):
            patients_df = pd.read_csv(PATIENT_RECORDS_PATH)
            patients_df = pd.concat([patients_df, pd.DataFrame([patient_dict])], ignore_index=True)
        else:
            patients_df = pd.DataFrame([patient_dict])
        
        patients_df.to_csv(PATIENT_RECORDS_PATH, index=False)
        
        # 2. Increment case_count by 1 in the main dataset
        df = pd.read_csv(DATA_PATH)
        df['date'] = pd.to_datetime(df['date'])
        target_date = pd.to_datetime(record.date)
        
        mask = (df['ward_id'] == record.ward_id) & (df['date'] == target_date)
        
        if mask.any():
            df.loc[mask, 'case_count'] += 1.0
            df.loc[mask, 'disease'] = record.diagnosis
        else:
            ward_data = df[df['ward_id'] == record.ward_id].sort_values('date').tail(1)
            if not ward_data.empty:
                new_row = ward_data.copy()
                new_row['date'] = target_date
                new_row['case_count'] = 1.0
                new_row['disease'] = record.diagnosis
                df = pd.concat([df, new_row], ignore_index=True)
            else:
                raise HTTPException(status_code=400, detail=f"Ward {record.ward_id} not found in data")
                
        df.to_csv(DATA_PATH, index=False)
        
        total_patients = len(patients_df)
        today_count = len(patients_df[patients_df['date'] == record.date]) if 'date' in patients_df.columns else 0
        
        return {
            "message": f"Patient {record.patient_name} registered successfully",
            "total_records": total_patients,
            "today_registrations": today_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/hospital/records")
async def get_patient_records(limit: int = 20):
    """Get recent patient records."""
    if not os.path.exists(PATIENT_RECORDS_PATH):
        return []
    
    df = pd.read_csv(PATIENT_RECORDS_PATH)
    return df.tail(limit).iloc[::-1].to_dict(orient='records')

@app.get("/api/hospital/stats")
async def get_hospital_stats():
    """Get hospital dashboard stats."""
    if not os.path.exists(PATIENT_RECORDS_PATH):
        return {"total_patients": 0, "today_patients": 0, "diseases": {}}
    
    from datetime import date
    df = pd.read_csv(PATIENT_RECORDS_PATH)
    today = date.today().isoformat()
    today_df = df[df['date'] == today] if 'date' in df.columns else pd.DataFrame()
    
    diseases = df['diagnosis'].value_counts().to_dict() if 'diagnosis' in df.columns else {}
    
    return {
        "total_patients": len(df),
        "today_patients": len(today_df),
        "diseases": diseases
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
