import pandas as pd
from prophet import Prophet
import joblib
import os

def forecast_cases():
    # Load data
    data = pd.read_csv("data/processed/final_dataset.csv")
    data['date'] = pd.to_datetime(data['date'])
    
    # We will create a general city-wide forecast for now
    # In a real system, you might want per-ward or a more complex hierarchical model
    city_data = data.groupby('date')['case_count'].sum().reset_index()
    city_data.columns = ['ds', 'y']
    
    # Train Prophet model
    model = Prophet(yearly_seasonality=True, daily_seasonality=False, weekly_seasonality=True)
    model.fit(city_data)
    
    # Save model
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/forecasting_model.pkl")
    
    # Make future dataframe for 7 days
    future = model.make_future_dataframe(periods=7)
    forecast = model.predict(future)
    
    # Save forecast results
    forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_csv("data/processed/city_forecast.csv", index=False)
    print("Forecasting complete. Model saved to models/forecasting_model.pkl")

if __name__ == "__main__":
    forecast_cases()
