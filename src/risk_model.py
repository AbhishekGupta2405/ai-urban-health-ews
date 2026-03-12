import pandas as pd
from xgboost import XGBClassifier
import joblib
import os

def train_risk_model():
    # Load data
    data = pd.read_csv("ai-urban-health-ews/data/processed/final_dataset.csv")
    
    # Define features and target
    # Target was created in feature_engineering.py (outbreak_label)
    features = [
        'cases_ma7', 'cases_ma14', 'growth_rate', 
        'rain_lag3', 'rain_lag7', 'temp_lag3', 
        'chlorine_level', 'bacteria_ma3', 'humidity'
    ]
    
    X = data[features]
    y = data['outbreak_label']
    
    # Train XGBoost model
    model = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    model.fit(X, y)
    
    # Predict risk score (probability of outbreak)
    data['risk_score'] = model.predict_proba(X)[:, 1] * 100
    
    # Save model
    os.makedirs("ai-urban-health-ews/models", exist_ok=True)
    joblib.dump(model, "ai-urban-health-ews/models/risk_model.pkl")
    
    # Save results
    data.to_csv("ai-urban-health-ews/data/processed/final_dataset.csv", index=False)
    print("Risk prediction model trained. Saved to models/risk_model.pkl")

if __name__ == "__main__":
    train_risk_model()
