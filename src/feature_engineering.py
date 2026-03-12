import pandas as pd
import numpy as np
import os

def engineer_features():
    # Load merged data
    data = pd.read_csv("ai-urban-health-ews/data/processed/merged_data.csv")
    data['date'] = pd.to_datetime(data['date'])
    data = data.sort_values(['ward_id', 'date'])

    # Add features per ward
    processed_wards = []
    for ward_id, group in data.groupby('ward_id'):
        group = group.copy()
        
        # 1. Moving averages (7-day and 14-day)
        group['cases_ma7'] = group['case_count'].rolling(window=7).mean()
        group['cases_ma14'] = group['case_count'].rolling(window=14).mean()
        
        # 2. Growth rate (pct change) - handling division by zero
        group['growth_rate'] = group['case_count'].pct_change().replace([np.inf, -np.inf], 0).fillna(0)
        
        # 3. Lagged features (Weather effects are often delayed)
        group['rain_lag3'] = group['rainfall'].shift(3)
        group['rain_lag7'] = group['rainfall'].shift(7)
        group['temp_lag3'] = group['temperature'].shift(3)
        
        # 4. Water quality trends
        group['bacteria_ma3'] = group['bacteria_count'].rolling(window=3).mean()
        
        # 5. Outbreak Label (Target for Risk Model)
        # Define an outbreak as cases > mean + 2*std in a 14-day window
        group['outbreak_label'] = (group['case_count'] > (group['cases_ma14'] + 2 * group['case_count'].rolling(window=14).std())).astype(int)
        
        processed_wards.append(group)

    final_df = pd.concat(processed_wards)
    
    # Fill NaN values created by rolling/shift
    final_df = final_df.fillna(0)

    # Save final dataset
    final_df.to_csv("ai-urban-health-ews/data/processed/final_dataset.csv", index=False)
    print("Feature engineering complete. Saved to data/processed/final_dataset.csv")
    return final_df

if __name__ == "__main__":
    engineer_features()
