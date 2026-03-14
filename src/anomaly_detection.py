import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

def detect_anomalies():
    # Load feature engineered data
    data = pd.read_csv("data/processed/final_dataset.csv")
    
    # Select features for anomaly detection
    features = ['case_count', 'growth_rate', 'bacteria_count', 'rainfall']
    X = data[features]
    
    # Train Isolation Forest
    # contamination=0.05 means we expect 5% of data points to be anomalies
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    
    # Predict anomalies (-1 = anomaly, 1 = normal)
    data['anomaly_score'] = model.decision_function(X)
    data['is_anomaly'] = model.predict(X)
    data['is_anomaly'] = data['is_anomaly'].map({1: 0, -1: 1})
    
    # Save model
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/anomaly_detector.pkl")
    
    # Save results
    data.to_csv("data/processed/final_dataset.csv", index=False)
    print("Anomaly detection complete. Model saved to models/anomaly_detector.pkl")

if __name__ == "__main__":
    detect_anomalies()
