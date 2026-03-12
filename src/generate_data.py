import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_synthetic_data(num_wards=20, days=365):
    start_date = datetime(2023, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(days)]
    
    # 1. Weather Data (Global for city)
    weather_data = []
    for date in dates:
        month = date.month
        # Seasonal rainfall and humidity
        if 6 <= month <= 9: # Monsoon
            rain = np.random.gamma(2, 5) 
            humidity = np.random.uniform(70, 95)
        else:
            rain = np.random.gamma(0.1, 2)
            humidity = np.random.uniform(30, 60)
            
        temp = np.random.uniform(25, 35)
        weather_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'rainfall': round(rain, 2),
            'temperature': round(temp, 1),
            'humidity': round(humidity, 1)
        })
    df_weather = pd.DataFrame(weather_data)
    
    # 2. Ward-specific Data (Cases and Water Quality)
    case_data = []
    water_data = []
    
    for ward_id in range(1, num_wards + 1):
        # Baseline risk for ward
        ward_risk_factor = np.random.uniform(0.5, 2.0)
        
        for date_row in weather_data:
            date_str = date_row['date']
            rain = date_row['rainfall']
            
            # Water Quality
            chlorine = max(0, np.random.normal(0.5, 0.2))
            bacteria = np.random.poisson(10 * ward_risk_factor)
            if rain > 10: # Rain contamination
                bacteria += np.random.poisson(20)
                chlorine -= 0.1
                
            water_data.append({
                'date': date_str,
                'ward_id': ward_id,
                'chlorine_level': round(max(0, chlorine), 2),
                'bacteria_count': bacteria
            })
            
            # Disease Cases (Dengue)
            # Cases depend on rain (lagged), humidity, and water quality
            base_cases = np.random.poisson(2 * ward_risk_factor)
            if rain > 5:
                base_cases += np.random.poisson(3)
            if bacteria > 25:
                base_cases += np.random.poisson(4)
                
            case_data.append({
                'date': date_str,
                'ward_id': ward_id,
                'disease': 'dengue',
                'case_count': base_cases
            })
            
    df_cases = pd.DataFrame(case_data)
    df_water = pd.DataFrame(water_data)
    
    # Ensure directories exist
    os.makedirs('ai-urban-health-ews/data/raw', exist_ok=True)
    
    # Save files
    df_weather.to_csv('ai-urban-health-ews/data/raw/weather.csv', index=False)
    df_cases.to_csv('ai-urban-health-ews/data/raw/cases.csv', index=False)
    df_water.to_csv('ai-urban-health-ews/data/raw/water.csv', index=False)
    
    print("Synthetic datasets generated in data/raw/")

if __name__ == "__main__":
    generate_synthetic_data()
