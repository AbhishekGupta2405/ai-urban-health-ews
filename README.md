# 🏥 Indore Urban Health Early Warning System (EWS)

An AI-powered analytical platform designed for real-time disease surveillance, risk monitoring, and outbreak forecasting in Indore, Madhya Pradesh.

---

## 🚀 Overview

This project implements a sophisticated "Early Warning System" that integrates health data, meteorological signals, and water quality metrics to provide actionable insights for public health officials. Focusing on the 85 wards of Indore, the system uses Machine Learning to predict risk levels and detect unusual case spikes before they escalate.

## ✨ Key Features

1.  **Ward-Level Risk Scoring**:
    *   Generates a dynamic risk score (0-100) for every ward in Indore.
    *   Signals include: Recent case growth, rainfall intensity, and water contamination levels.
2.  **Early Outbreak Detection**:
    *   Uses **Isolation Forest** (Anomaly Detection) to identify unusual surges.
    *   Provides early alerts 5-7 days before official reports.
3.  **7-Day Case Forecasting**:
    *   Implements **Facebook Prophet** models for accurate time-series forecasting.
    *   Visualizes trends with confidence intervals.
4.  **Interactive Geospatial Heatmap**:
    *   Ward-wise risk visualization using **Folium**.
    *   Color-coded markers (Green/Yellow/Red) for immediate prioritization.
5.  **Hospital Capacity Monitoring**:
    *   Predicts bed demand based on incoming case forecasts.
    *   Automated alerts for potential shortages.
6.  **"What-If" Scenario Simulation**:
    *   Interactive tool to simulate environmental changes (e.g., "What if rainfall increases by 30%?").

---

## 📂 Project Structure

```text
ai-urban-health-ews/
├── dashboard/
│   └── app.py              # Main Streamlit UI with 6 interactive pages
├── data/
│   ├── processed/          # Cleaned, merged, and Indore-specific datasets
│   └── raw/                # Original datasets (Weather, Ground Water, Health)
├── models/
│   ├── anomaly_detector.pkl # Isolation Forest model
│   ├── forecasting_model.pkl# Prophet model
│   └── risk_model.pkl       # XGBoost risk scoring model
├── src/
│   ├── anomaly_detection.py # Outbreak detection logic
│   ├── data_processing_indore.py # Specialized ETL for Indore data
│   ├── feature_engineering.py# Rolling averages and lagged variables
│   ├── forecasting.py      # Time-series prediction logic
│   └── risk_model.py       # ML training for risk scores
├── requirements.txt         # Project dependencies
└── README.md                # Project documentation
```

---

## 🛠️ Technical Stack

*   **Language**: Python 3.x
*   **Web Framework**: Streamlit
*   **Machine Learning**: XGBoost, Scikit-learn (Isolation Forest)
*   **Forecasting**: Facebook Prophet
*   **Data Visualization**: Plotly, Folium, PyDeck
*   **Data Handling**: Pandas (with fallback encoding), Numpy

---

## 🚦 How to Run the Project

### 1. Prerequisites
Ensure you have Python installed. Clone the repository and navigate to the project root.

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Data Processing & Model Training
If you want to refresh the models with new raw data:
```powershell
# Process raw data with Indore filters
python src/data_processing_indore.py

# Run ML models
python src/anomaly_detection.py
python src/forecasting.py
python src/risk_model.py
```

### 4. Launch Dashboard
```powershell
streamlit run dashboard/app.py
```

---

## 🧪 Methodology

1.  **ETL Pipeline**: Handles multiple CSV formats and encodings (`latin1`, `cp1252`) to merge Indore-specific weather, water, and health data.
2.  **Feature Engineering**: Creates 7-day/14-day rolling averages and 3-day rainfall lags to capture the biological delay in vector-borne disease transmission.
3.  **Risk Modeling**: An XGBoost classifier learns the correlation between environmental triggers and historical outbreaks to assign probability-based risk scores.
4.  **Anomaly Detection**: Monitors the "noise" in daily case reports to isolate statistically significant deviations using unsupervised learning.

---

## 🏙️ Focus Area: Indore City
The project is specifically tuned for **Indore**, referencing:
*   **85 Municipal Wards**
*   **Coordinates**: 22.7196° N, 75.8577° E
*   **Data Sources**: Integrated signals from IMD weather logs, Indore ground water reports, and district health datasets.

---

## 🛡️ License
Developed for the **Indore Municipal Corporation** and public health stakeholders. © 2026.
