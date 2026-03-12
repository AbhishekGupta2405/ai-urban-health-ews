import pandas as pd
import os

def process_data():
    # Load datasets
    cases = pd.read_csv("ai-urban-health-ews/data/raw/cases.csv")
    weather = pd.read_csv("ai-urban-health-ews/data/raw/weather.csv")
    water = pd.read_csv("ai-urban-health-ews/data/raw/water.csv")

    # Merge datasets
    # First merge cases and weather on date
    data = pd.merge(cases, weather, on="date")
    
    # Then merge with water data on date and ward_id
    data = pd.merge(data, water, on=["date", "ward_id"])

    # Ensure date is datetime
    data['date'] = pd.to_datetime(data['date'])
    data = data.sort_values(['ward_id', 'date'])

    # Save processed data
    os.makedirs("ai-urban-health-ews/data/processed", exist_ok=True)
    data.to_csv("ai-urban-health-ews/data/processed/merged_data.csv", index=False)
    print("Data merged and saved to data/processed/merged_data.csv")
    return data

if __name__ == "__main__":
    process_data()
