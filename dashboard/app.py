import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import folium
from streamlit_folium import folium_static
import numpy as np
from datetime import datetime, timedelta

# Page configuration
st.set_page_config(
    page_title="Indore Urban Health EWS",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better UI
st.markdown("""
    <style>
    .main {
        background-color: #f8f9fa;
    }
    .stMetric {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .header-style {
        font-size: 30px;
        font-weight: bold;
        color: #1E3A8A;
        margin-bottom: 20px;
    }
    .footer {
        position: fixed;
        left: 0;
        bottom: 0;
        width: 100%;
        background-color: #f1f5f9;
        color: #64748b;
        text-align: center;
        padding: 10px;
        font-size: 14px;
        border-top: 1px solid #e2e8f0;
    }
    .card {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        margin-bottom: 20px;
    }
    </style>
    """, unsafe_allow_html=True)

# Header
def draw_header():
    st.markdown('<div class="header-style">🏥 Indore Urban Health Early Warning System</div>', unsafe_allow_html=True)
    st.markdown("---")

# Footer
def draw_footer():
    st.markdown("""
        <div class="footer">
            Developed for Indore Municipal Corporation | AI-Powered Disease Surveillance System | © 2026
        </div>
        """, unsafe_allow_html=True)

# Load data
@st.cache_data
def load_data():
    try:
        df = pd.read_csv("ai-urban-health-ews/data/processed/final_dataset.csv")
        df['date'] = pd.to_datetime(df['date'])
        return df
    except Exception as e:
        return None

@st.cache_data
def load_forecast():
    try:
        df = pd.read_csv("ai-urban-health-ews/data/processed/city_forecast.csv")
        df['ds'] = pd.to_datetime(df['ds'])
        return df
    except Exception as e:
        return None

data = load_data()
forecast = load_forecast()

if data is None or forecast is None:
    st.error("Data files not found. Please ensure the processing and ML scripts have been run.")
    st.stop()

# Sidebar
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/hospital.png", width=80)
    st.title("Indore Health")
    page = st.selectbox(
        "Navigation",
        ["🏠 Home", "📊 City Overview", "🗺️ Ward Risk Map", "🔮 Case Forecasting", "⚠️ Alert Panel", "🧪 What-If Simulation"]
    )
    st.markdown("---")
    st.info("This system uses AI to predict and detect disease outbreaks across Indore's 85 wards.")

# Helper functions
def get_risk_color(score):
    if score < 30: return "green"
    elif score < 70: return "orange"
    else: return "red"

draw_header()

if page == "🏠 Home":
    st.markdown("### Welcome to the Urban Health Early Warning System")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        #### 🎯 Project Objective
        The **AI-Powered Urban Health Early Warning System (EWS)** is a state-of-the-art analytical platform designed specifically for the city of Indore. It integrates health, weather, and water quality data to provide real-time insights into disease transmission risks.
        
        #### 🚀 Key Features:
        1. **Ward-Level Risk Scoring**: Analyzes 85 wards individually to assign a risk score from 0-100 based on multiple signals.
        2. **Outbreak Detection**: Uses machine learning (Isolation Forest) to detect unusual spikes in cases before they become official outbreaks.
        3. **7-Day Forecasting**: Employs Prophet time-series models to predict case counts for the upcoming week.
        4. **Interactive Mapping**: Visualizes risks on a city map for quick identification of hotspots.
        5. **Resource Management**: Predicts hospital bed demand based on incoming case forecasts.
        6. **Scenario Simulation**: Allows health officials to simulate "What-If" scenarios (e.g., impact of 20% more rainfall).
        """)
        
    with col2:
        st.image("https://img.icons8.com/fluency/240/city.png", caption="Indore City Analytics")
        st.success("**City Status: Monitoring Active**")
        st.info(f"**Current Date:** {data['date'].max().strftime('%Y-%m-%d')}")

    st.markdown("---")
    st.markdown("#### 🛠️ How it Works")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("**1. Data Integration**")
        st.caption("Combines IHIP/IDSP cases, IMD weather data, and CPCB water quality metrics.")
    with c2:
        st.markdown("**2. AI Analysis**")
        st.caption("XGBoost and Prophet models process historical patterns to predict future risks.")
    with c3:
        st.markdown("**3. Actionable Insights**")
        st.caption("Generates alerts and recommended interventions for health officials.")

elif page == "📊 City Overview":
    st.title("🏙️ Indore City Health Overview")
    
    latest_date = data['date'].max()
    today_data = data[data['date'] == latest_date]
    prev_date = latest_date - timedelta(days=1)
    prev_data = data[data['date'] == prev_date]
    
    col1, col2, col3, col4 = st.columns(4)
    total_cases = today_data['case_count'].sum()
    prev_cases = prev_data['case_count'].sum()
    case_diff = int(total_cases - prev_cases)
    
    col1.metric("Total Cases (Today)", int(total_cases), delta=case_diff, delta_color="inverse")
    
    high_risk_wards = today_data[today_data['risk_score'] > 70]['ward_id'].nunique()
    col2.metric("High Risk Wards", high_risk_wards, delta=0)
    
    avg_risk = today_data['risk_score'].mean()
    col3.metric("Indore Health Index", f"{100 - avg_risk:.1f}/100")
    
    active_anomalies = today_data[today_data['is_anomaly'] == 1].shape[0]
    col4.metric("Active Alerts", active_anomalies)

    st.markdown("---")
    
    c1, c2 = st.columns([2, 1])
    
    with c1:
        st.subheader("Disease Trend Analysis (Indore)")
        city_trend = data.groupby('date')['case_count'].sum().reset_index()
        fig = px.line(city_trend, x='date', y='case_count', 
                      title="Daily Cases in Indore",
                      template="plotly_white",
                      color_discrete_sequence=['#1E3A8A'])
        st.plotly_chart(fig, use_container_width=True)
    
    with c2:
        st.subheader("Top Risk Wards")
        risk_rank = today_data[['ward_id', 'risk_score', 'case_count']].sort_values('risk_score', ascending=False).head(10)
        st.dataframe(risk_rank.style.background_gradient(subset=['risk_score'], cmap='YlOrRd'), use_container_width=True)

elif page == "🗺️ Ward Risk Map":
    st.title("📍 Ward Risk Heatmap")
    st.write("Visualizing disease risk across 85 wards of Indore.")
    
    latest_date = data['date'].max()
    map_data = data[data['date'] == latest_date].copy()
    
    # Coordinates for Indore
    np.random.seed(42)
    map_data['lat'] = 22.7196 + np.random.uniform(-0.08, 0.08, len(map_data))
    map_data['lon'] = 75.8577 + np.random.uniform(-0.08, 0.08, len(map_data))
    
    m = folium.Map(location=[22.7196, 75.8577], zoom_start=12, tiles='CartoDB positron')
    
    for _, row in map_data.iterrows():
        color = get_risk_color(row['risk_score'])
        folium.CircleMarker(
            location=[row['lat'], row['lon']],
            radius=row['case_count'] + 5,
            popup=f"<b>Ward {int(row['ward_id'])}</b><br>Risk Score: {row['risk_score']:.1f}<br>Cases: {int(row['case_count'])}",
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.6
        ).add_to(m)
    
    folium_static(m, width=1000)
    
    st.info("🟢 Low Risk (0-30) | 🟠 Medium Risk (31-70) | 🔴 High Risk (71-100)")

elif page == "🔮 Case Forecasting":
    st.title("🔮 Outbreak Forecast")
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=forecast['ds'], y=forecast['yhat'], name='Predicted', line=dict(color='#1E3A8A', width=3)))
    fig.add_trace(go.Scatter(
        x=forecast['ds'].tolist() + forecast['ds'].tolist()[::-1],
        y=forecast['yhat_upper'].tolist() + forecast['yhat_lower'].tolist()[::-1],
        fill='toself',
        fillcolor='rgba(30, 58, 138, 0.1)',
        line=dict(color='rgba(255,255,255,0)'),
        hoverinfo="skip",
        showlegend=False,
        name='Confidence Interval'
    ))
    
    fig.update_layout(title="Predicted Disease Cases Next Week (Indore)", 
                      xaxis_title="Date", yaxis_title="Cases",
                      template="plotly_white")
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    st.subheader("🏥 Hospital Bed Demand Prediction")
    
    next_week_forecast = forecast.tail(7)['yhat'].sum()
    hosp_rate = 0.15 
    predicted_admissions = int(next_week_forecast * hosp_rate)
    available_beds = 1200 # Simulated for Indore hospitals
    
    c1, c2, c3 = st.columns(3)
    c1.metric("Predicted Admissions (7D)", predicted_admissions)
    c2.metric("Indore Bed Capacity", available_beds)
    
    utilization = (predicted_admissions / available_beds) * 100
    c3.metric("Capacity Utilization", f"{utilization:.1f}%")
    
    if utilization > 80:
        st.error(f"⚠️ **Critical Alert:** Hospital capacity utilization predicted to reach {utilization:.1f}%.")
    elif utilization > 50:
        st.warning(f"⚠️ **Warning:** Increasing bed demand detected ({utilization:.1f}%).")
    else:
        st.success("Hospital infrastructure is stable.")

elif page == "⚠️ Alert Panel":
    st.title("⚠️ Outbreak Alerts & Explanations")
    
    latest_anomalies = data[data['is_anomaly'] == 1].sort_values('date', ascending=False).head(10)
    
    if latest_anomalies.empty:
        st.success("No active anomalies detected in Indore.")
    else:
        for _, alert in latest_anomalies.iterrows():
            with st.expander(f"🚨 ALERT: Ward {int(alert['ward_id'])} - Detected on {alert['date'].strftime('%Y-%m-%d')}"):
                c1, c2 = st.columns(2)
                with c1:
                    st.write(f"**Severity:** {'High' if alert['risk_score'] > 70 else 'Medium'}")
                    st.write(f"**Risk Score:** {alert['risk_score']:.1f}")
                    st.write(f"**Case Spike:** {int(alert['case_count'])} cases")
                
                with c2:
                    st.write("**Identified Drivers:**")
                    if alert['growth_rate'] > 0.5: st.markdown("- 📈 Rapid case growth rate")
                    if alert['rainfall'] > 15: st.markdown("- 🌧️ Excessive rainfall spike")
                    if alert['bacteria_count'] > 15: st.markdown("- 💧 Water quality degradation")
                    if alert['humidity'] > 80: st.markdown("- 🌡️ High humidity levels")
                
                st.markdown("**📋 Recommended Interventions:**")
                st.info("1. Deployment of mosquito fogging teams to Ward " + str(int(alert['ward_id'])) + 
                        "\n2. Targeted water chlorination drive.\n3. Door-to-door awareness campaign.")

elif page == "🧪 What-If Simulation":
    st.title("🧪 Environmental Scenario Simulation")
    st.info("Simulate how changes in weather and environmental factors impact Indore's overall risk.")
    
    with st.container():
        st.markdown('<div class="card">', unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            rain_sim = st.slider("Rainfall Increase (mm)", 0, 50, 0)
            temp_sim = st.slider("Temperature Change (°C)", -5, 5, 0)
        with c2:
            bacteria_sim = st.slider("Bacteria Count Increase", 0, 50, 0)
            growth_sim = st.slider("Case Growth Simulation (%)", 0, 200, 0)
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Simple simulation logic based on feature importance
    base_risk = data['risk_score'].mean()
    sim_risk = base_risk + (rain_sim * 0.5) + (temp_sim * 1.2) + (bacteria_sim * 0.8) + (growth_sim * 0.1)
    sim_risk = min(100, max(0, sim_risk))
    
    st.markdown("---")
    res_col1, res_col2 = st.columns(2)
    
    with res_col1:
        st.metric("Simulated City Risk Index", f"{sim_risk:.1f}", 
                  delta=f"{sim_risk - base_risk:.1f}", delta_color="inverse")
    
    with res_col2:
        if sim_risk > 75:
            st.error("🚨 **CRITICAL RISK:** Scenario indicates high probability of city-wide outbreak.")
        elif sim_risk > 50:
            st.warning("⚠️ **ELEVATED RISK:** Scenario suggests pre-outbreak conditions.")
        else:
            st.success("✅ **STABLE:** Scenario within manageable health parameters.")

draw_footer()

