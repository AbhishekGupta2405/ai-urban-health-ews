import pandas as pd
import numpy as np
import os

def load_with_fallback(file_path):
    encodings = ['utf-8', 'latin1', 'iso-8859-1', 'cp1252']
    for enc in encodings:
        try:
            return pd.read_csv(file_path, encoding=enc)
        except (UnicodeDecodeError, pd.errors.ParserError):
            continue
    raise ValueError(f"Could not decode file {file_path} with common encodings.")

def process_indore_data():
    raw_path = "data/raw"
    processed_path = "data/processed"
    os.makedirs(processed_path, exist_ok=True)

    print("Loading datasets...")
    # 1. Process Weather Data
    try:
        weather_df = load_with_fallback(f"{raw_path}/Indore_weather_dataset.csv")
        weather_df['date'] = pd.to_datetime(weather_df['date'])
        # Map to standard names if needed
        weather_df = weather_df.rename(columns={
            'temperature': 'temperature',
            'humidity': 'humidity',
            'rainfall': 'rainfall'
        })
        weather_df = weather_df[['date', 'temperature', 'humidity', 'rainfall']]
    except Exception as e:
        print(f"Error loading Indore weather: {e}. Falling back to default weather.csv")
        weather_df = pd.read_csv(f"{raw_path}/weather.csv")
        weather_df['date'] = pd.to_datetime(weather_df['date'])

    # 2. Process Disease Case Data
    try:
        health_df = load_with_fallback(f"{raw_path}/climate_health_dataset.csv")
        indore_cases = health_df[health_df['district'].str.contains('Indore', case=False, na=False)].copy()
        
        if indore_cases.empty:
            print("Warning: No Indore-specific records found in climate_health_dataset.csv. Using Madhya Pradesh data as proxy.")
            indore_cases = health_df[health_df['state_ut'].str.contains('Madhya Pradesh', case=False, na=False)].copy()

        indore_cases['date'] = pd.to_datetime(indore_cases[['year', 'mon', 'day']])
    except Exception as e:
        print(f"Error processing health data: {e}. Using simulated case data.")
        # Create simulated Indore cases if real data is not available
        dates = pd.date_range(start='2023-01-01', end='2023-12-31')
        indore_cases = pd.DataFrame({'date': dates, 'Cases': np.random.poisson(10, len(dates)), 'Disease': 'Dengue'})

    wards = list(range(1, 86))
    case_records = []
    
    for _, row in indore_cases.iterrows():
        num_affected_wards = np.random.randint(1, 6)
        affected_wards = np.random.choice(wards, num_affected_wards, replace=False)
        cases_per_ward = max(1, int(row['Cases'] / num_affected_wards))
        
        for w in affected_wards:
            case_records.append({
                'date': row['date'],
                'ward_id': w,
                'disease': 'Dengue',
                'case_count': cases_per_ward
            })
    
    indore_cases_processed = pd.DataFrame(case_records)
    all_dates = pd.date_range(start=indore_cases_processed['date'].min(), end=indore_cases_processed['date'].max())
    ward_date_grid = pd.MultiIndex.from_product([wards, all_dates], names=['ward_id', 'date']).to_frame(index=False)
    indore_cases_processed = pd.merge(ward_date_grid, indore_cases_processed, on=['ward_id', 'date'], how='left').fillna({'case_count': 0, 'disease': 'Dengue'})

    # 3. Process Water Quality Data
    try:
        water_df = load_with_fallback(f"{raw_path}/Ground_water_dataset.csv")
        mp_water = water_df[water_df['STATE'].str.contains('MADHYA PRADESH', case=False, na=False)].copy()
        avg_ph = mp_water['pH Max'].mean() if not mp_water.empty else 7.2
    except Exception as e:
        print(f"Error processing water data: {e}")
        avg_ph = 7.2
    
    water_records = []
    for w in wards:
        for d in all_dates:
            water_records.append({
                'date': d,
                'ward_id': w,
                'chlorine_level': round(np.random.uniform(0.2, 0.8), 2),
                'bacteria_count': np.random.poisson(2),
                'ph': round(avg_ph + np.random.normal(0, 0.2), 2)
            })
    
    indore_water_processed = pd.DataFrame(water_records)

    # 4. Final Merge and Feature Engineering
    final_data = pd.merge(indore_cases_processed, weather_df, on='date', how='inner')
    final_data = pd.merge(final_data, indore_water_processed, on=['date', 'ward_id'], how='inner')
    
    final_data = final_data.sort_values(['ward_id', 'date'])
    processed_wards = []
    for ward_id, group in final_data.groupby('ward_id'):
        group = group.copy()
        group['cases_ma7'] = group['case_count'].rolling(7).mean().fillna(0)
        group['cases_ma14'] = group['case_count'].rolling(14).mean().fillna(0)
        group['growth_rate'] = group['case_count'].pct_change().replace([np.inf, -np.inf], 0).fillna(0)
        group['rain_lag3'] = group['rainfall'].shift(3).fillna(0)
        group['rain_lag7'] = group['rainfall'].shift(7).fillna(0)
        group['temp_lag3'] = group['temperature'].shift(3).fillna(0)
        group['bacteria_ma3'] = group['bacteria_count'].rolling(3).mean().fillna(0)
        # Handle std division by zero/NaN
        std_val = group['case_count'].rolling(14).std().fillna(0)
        group['outbreak_label'] = (group['case_count'] > (group['cases_ma14'] + 2 * std_val)).astype(int)
        # Added humidity if missing
        if 'humidity' not in group.columns:
            group['humidity'] = np.random.uniform(40, 90, len(group))
        processed_wards.append(group)

    final_df = pd.concat(processed_wards)
    # Ensure all required features for risk_model.py are present
    # features = ['cases_ma7', 'cases_ma14', 'growth_rate', 'rain_lag3', 'rain_lag7', 'temp_lag3', 'chlorine_level', 'bacteria_ma3', 'humidity']
    final_df.to_csv(f"{processed_path}/final_dataset.csv", index=False)
    print(f"Final Indore dataset created: {len(final_df)} rows. Saved to {processed_path}/final_dataset.csv")

if __name__ == "__main__":
    process_indore_data()

