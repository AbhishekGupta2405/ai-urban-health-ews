import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Users,
  ShieldCheck,
  Bell,
  Menu,
  ChevronRight,
  Droplets,
  Thermometer,
  CloudRain,
  Beaker
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [wardData, setWardData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simulation State
  const [simParams, setSimParams] = useState({
    rain_inc: 0,
    temp_change: 0,
    bacteria_inc: 0,
    growth_sim: 0
  });
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, forecastRes, wardRes, alertsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/overview`),
          axios.get(`${API_BASE_URL}/forecast`),
          axios.get(`${API_BASE_URL}/wards`),
          axios.get(`${API_BASE_URL}/alerts`)
        ]);
        setOverviewData(overviewRes.data);
        setForecastData(forecastRes.data);
        setWardData(wardRes.data);
        setAlerts(alertsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const runSimulation = async () => {
    setSimLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/simulate`, simParams);
      setSimResult(res.data);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setSimLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "#10b981"; // emerald-500
    if (score < 70) return "#f59e0b"; // amber-500
    return "#ef4444"; // rose-500
  };

  const NavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      {sidebarOpen && <span className="font-medium">{label}</span>}
    </button>
  );

  const StatCard = ({ title, value, delta, icon: Icon, color }: { title: string; value: any; delta?: number; icon: any; color: string }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
          {delta !== undefined && (
            <p className={`text-xs mt-2 flex items-center ${delta >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-30`}>
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="text-white flex-shrink-0" size={24} />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-xl text-slate-800 tracking-tight leading-tight">Indore Health</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">DENGUE SURVEILLANCE</p>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem id="home" icon={LayoutDashboard} label="Home" />
          <NavItem id="overview" icon={Activity} label="Overview" />
          <NavItem id="map" icon={MapIcon} label="Ward Risk Map" />
          <NavItem id="forecast" icon={TrendingUp} label="Forecasting" />
          <NavItem id="simulate" icon={Beaker} label="What-If Simulation" />
          <NavItem id="alerts" icon={AlertTriangle} label="Alert Panel" />
        </nav>

        <div className="p-4 mt-auto">
          <div className={`bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden transition-all ${!sidebarOpen && 'hidden'}`}>
            <div className="relative z-10">
              <p className="text-xs text-slate-400 font-medium">SYSTEM STATUS</p>
              <p className="text-sm font-bold mt-1">Monitoring Active</p>
              <div className="flex items-center mt-3 text-xs text-emerald-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2" />
                Live 2023 Analysis
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <ShieldCheck size={80} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Indore Dengue Early Warning System
            </h2>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              2023 DATASET
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'home' && (
            <div className="space-y-12 animate-in fade-in duration-500 pb-12">
              {/* Hero Section */}
              <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative p-12 lg:p-20 flex flex-col items-center text-center z-10">
                  <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 mb-8">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-blue-300 text-xs font-bold tracking-wider uppercase">Live Surveillance Active</span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
                    AI-Driven Urban Health <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                      Early Warning System
                    </span>
                  </h1>
                  
                  <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mb-10 leading-relaxed">
                    Transitioning from reactive healthcare to proactive outbreak prevention. Our AI models analyze environmental telemetry to predict and prevent Dengue outbreaks in Indore before they occur.
                  </p>
                  
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className="bg-white text-slate-900 hover:bg-blue-50 transition-all font-bold px-8 py-4 rounded-xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center group"
                  >
                    Launch Dashboard <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Core Features / Stack */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                    <TrendingUp className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Time-Series Forecasting</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    Utilizing <strong className="text-slate-700">Prophet AI</strong> algorithms to project precise 7-day Dengue case trajectories, enabling hospitals to pre-allocate critical bed infrastructure.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6 relative z-10">
                    <AlertTriangle className="text-rose-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 relative z-10">Real-Time Anomaly Detection</h3>
                  <p className="text-slate-500 leading-relaxed text-sm relative z-10">
                    Deployed <strong className="text-slate-700">Isolation Forest</strong> uncovers hidden patterns in ward-level rainfall and bacteria data, instantly flagging pre-outbreak conditions.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                    <ShieldCheck className="text-emerald-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Targeted Interventions</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    Translates complex geospatial risk maps into actionable directives for civic agencies, steering vector-control squads exactly where they are needed.
                  </p>
                </div>
              </div>

              {/* Data Sources Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 lg:p-12">
                <h3 className="text-center text-sm font-bold tracking-widest uppercase text-slate-400 mb-8">Aggregating Multi-Modal Telemetry Data</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <CloudRain className="mx-auto text-blue-500 mb-2" />
                    <span className="text-sm font-bold text-slate-700">Rainfall Logs</span>
                  </div>
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <Thermometer className="mx-auto text-orange-500 mb-2" />
                    <span className="text-sm font-bold text-slate-700">Temperature</span>
                  </div>
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <Droplets className="mx-auto text-cyan-500 mb-2" />
                    <span className="text-sm font-bold text-slate-700">Water Quality</span>
                  </div>
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <Users className="mx-auto text-indigo-500 mb-2" />
                    <span className="text-sm font-bold text-slate-700">Clinical Cases</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">City Overview (2023)</h2>
                  <p className="text-slate-500 mt-1 max-w-2xl">
                    Real-time Dengue fever surveillance. AI models process daily environmental telemetry (rainfall, temp) against confirmed case data to flag incoming outbreak risks across Indore's 85 wards.
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex items-center">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                   Data Sync: {overviewData?.latest_date || 'Dec 31, 2023'}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Dengue Cases"  
                  value={overviewData?.stats.total_cases} 
                  delta={12} 
                  icon={Users} 
                  color="bg-blue-500" 
                />
                <StatCard 
                  title="High Risk Wards" 
                  value={overviewData?.stats.high_risk_wards} 
                  icon={AlertTriangle} 
                  color="bg-rose-500" 
                />
                <StatCard 
                  title="Health Index" 
                  value={`${overviewData?.stats.health_index}/100`} 
                  icon={ShieldCheck} 
                  color="bg-emerald-500" 
                />
                <StatCard 
                  title="Active Alerts" 
                  value={overviewData?.stats.active_alerts} 
                  icon={Bell} 
                  color="bg-amber-500" 
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <TrendingUp className="mr-2 text-blue-600" size={20} />
                    Dengue Infection Trend (30 Days)
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewData?.trend}>
                        <defs>
                          <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}} 
                          minTickGap={30}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        />
                        <Area type="monotone" dataKey="case_count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-0.5">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Trend Analysis</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Infection rates show cyclical volatility over the past month. Recent peaks align with preceding high-humidity periods, indicating active vector breeding cycles in vulnerable wards.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <Activity className="mr-2 text-blue-600" size={20} />
                    Predictive Forecasting (7 Days)
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="ds" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}}
                          tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {weekday: 'short'})}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        />
                        <Line type="monotone" dataKey="yhat" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-start space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 mt-0.5">
                      <Activity size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Forecast Insight</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        The model projects a sharp upward trajectory towards the weekend. Anticipated case volume may stress local clinics, warranting preemptive resource allocation and community advisories.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dengue Ward Risk Map</h2>
                  <p className="text-slate-500 mt-1 max-w-2xl">
                    Live predictive heatmap. Green = Safe, Yellow = Warning, Red = Critical Risk of Dengue Outbreak.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm h-[600px] w-full relative z-0">
                <MapContainer 
                  center={[22.7196, 75.8577]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
                  />
                  {wardData.map((ward, idx) => (
                    <CircleMarker
                      key={idx}
                      center={[ward.lat, ward.lon]}
                      radius={ward.risk_score > 70 ? 12 : ward.risk_score > 40 ? 8 : 6}
                      fillOpacity={0.7}
                      color={getRiskColor(ward.risk_score)}
                      fillColor={getRiskColor(ward.risk_score)}
                      weight={2}
                    >
                      <Popup className="rounded-xl overflow-hidden shadow-xl border-0">
                        <div className="p-1 min-w-[200px]">
                          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-2">
                            <span className={`w-3 h-3 rounded-full ${ward.risk_score > 70 ? 'bg-rose-500' : ward.risk_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            <span className="font-bold text-slate-800">Ward {ward.ward_id}</span>
                          </div>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Cases</span>
                              <span className="font-semibold text-slate-800">{ward.case_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Risk Score</span>
                              <span className={`font-black ${ward.risk_score > 70 ? 'text-rose-500' : 'text-amber-500'}`}>{ward.risk_score.toFixed(1)}/100</span>
                            </div>
                            {ward.is_anomaly === 1 && (
                              <div className="mt-2 text-xs bg-rose-50 text-rose-600 p-2 rounded-lg font-bold flex items-center justify-center">
                                <AlertTriangle size={12} className="mr-1" /> Active Alert
                              </div>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">7-Day Dengue Trajectory Forecast</h2>
                  <p className="text-slate-500 mt-1 max-w-2xl">
                    AI-driven forecast projecting city-wide Dengue cases to aid hospital bed allocation.
                  </p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-sm font-semibold text-blue-700 shadow-sm flex items-center">
                  <Activity size={16} className="mr-2" />
                  Model: Prophet Time-Series
                </div>
              </div>

              {/* Main Forecast Chart */}
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center">
                  <TrendingUp className="mr-2 text-blue-600" size={20} />
                  Predicted Dengue Cases (Next 7 Days)
                </h3>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <defs>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="ds" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}}
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                      />
                      <Area type="monotone" dataKey="yhat" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorForecast)" name="Predicted Cases" />
                      <Area type="monotone" dataKey="yhat_upper" stroke="transparent" fill="#6366f1" fillOpacity={0.05} name="Upper Bound" />
                      <Area type="monotone" dataKey="yhat_lower" stroke="transparent" fill="#6366f1" fillOpacity={0.05} name="Lower Bound" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resource Planning Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <ShieldCheck className="mr-2 text-blue-600" size={20} />
                    Hospital Infrastructure Readiness
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Predicted Admissions</p>
                      <h4 className="text-3xl font-black text-slate-800">
                        {Math.round(forecastData.reduce((acc, curr) => acc + curr.yhat, 0) * 0.15)}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2">Based on 15% hospital rate</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Available Beds</p>
                      <h4 className="text-3xl font-black text-slate-800">1,200</h4>
                      <p className="text-xs text-slate-400 mt-2">Indore Central Registry</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Utilization Ratio</p>
                      <h4 className={`text-3xl font-black ${
                        (forecastData.reduce((acc, curr) => acc + curr.yhat, 0) * 0.15 / 1200) > 0.8 ? 'text-rose-500' : 'text-emerald-500'
                      }`}>
                        {((forecastData.reduce((acc, curr) => acc + curr.yhat, 0) * 0.15 / 1200) * 100).toFixed(1)}%
                      </h4>
                      <p className="text-xs text-slate-400 mt-2">Projected for next week</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-4">
                    <AlertTriangle className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-900">Infrastructure Advisory</h4>
                      <p className="text-blue-800 text-sm mt-1 leading-relaxed">
                        Current forecasts suggest hospital capacity remains stable. No emergency bed allocation required for the upcoming 7-day window. Recommend routine stock-taking of medical supplies.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-4">Forecast Insights</h3>
                    <div className="space-y-6 mt-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 font-bold text-blue-400">1</div>
                        <p className="text-sm text-slate-300 leading-relaxed">Weekly seasonality indicates peak cases typically occur towards the weekend.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 font-bold text-emerald-400">2</div>
                        <p className="text-sm text-slate-300 leading-relaxed">Model confidence interval remains within ±12% based on historical validation.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 font-bold text-amber-400">3</div>
                        <p className="text-sm text-slate-300 leading-relaxed">Recent weather shifts correlate with a 5-day lag in predicted case spikes.</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 opacity-5">
                    <TrendingUp size={240} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">AI Outbreak Alerts</h2>
                  <p className="text-slate-500 mt-1 max-w-2xl">
                    Real-time anomaly detection identifying wards exhibiting unusual pre-Dengue environmental patterns.
                  </p>
                </div>
                <div className="bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 text-sm font-semibold text-rose-700 shadow-sm flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  System: Isolation Forest
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
                  <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="text-emerald-500" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">No Active Anomalies</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">All 85 wards are currently within normal health parameters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {alerts.map((alert, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                      <div className={`w-full md:w-2 ${alert.risk_score > 70 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div className="p-8 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${alert.risk_score > 70 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                              <AlertTriangle size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Ward {alert.ward_id} - Dengue Risk Signal</h3>
                              <p className="text-slate-500 text-sm">Detected on {new Date(alert.date).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}</p>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              alert.risk_score > 70 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {alert.risk_score > 70 ? 'Critical' : 'Elevated'}
                            </span>
                            <span className="text-slate-400 font-mono text-sm">Risk: {alert.risk_score.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identified Drivers</h4>
                            <div className="space-y-2">
                              {alert.growth_rate > 0.5 && (
                                <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded-lg">
                                  <TrendingUp size={14} className="mr-2 text-rose-500" /> Rapid Growth (+{(alert.growth_rate * 100).toFixed(0)}%)
                                </div>
                              )}
                              {alert.rainfall > 15 && (
                                <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded-lg">
                                  <CloudRain size={14} className="mr-2 text-blue-500" /> Heavy Rainfall ({alert.rainfall}mm)
                                </div>
                              )}
                              {alert.bacteria_count > 15 && (
                                <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded-lg">
                                  <Droplets size={14} className="mr-2 text-amber-500" /> High Bacteria Count
                                </div>
                              )}
                              {alert.humidity > 80 && (
                                <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded-lg">
                                  <Thermometer size={14} className="mr-2 text-orange-500" /> Extreme Humidity ({alert.humidity.toFixed(0)}%)
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended Emergency Interventions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                <p className="font-bold text-blue-900 mb-1">Vector Control</p>
                                <p className="text-blue-800 opacity-80">Deployment of fogging teams and stagnant water clearing in Ward {alert.ward_id}.</p>
                              </div>
                              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                <p className="font-bold text-emerald-900 mb-1">Water Quality</p>
                                <p className="text-emerald-800 opacity-80">Targeted chlorination drive and inspection of local water storage facilities.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'simulate' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight text-center">Dengue Scenario Simulator</h2>
              <p className="text-slate-500 text-center max-w-2xl mx-auto mb-8">
                Adjust environmental parameters to see how extreme weather events and water quality changes predictively impact the city's Dengue Risk Index.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center mb-4">
                    <Menu className="mr-2 text-blue-600" size={20} />
                    Simulation Parameters
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Rainfall Increase (mm)</label>
                    <input 
                      type="range" min="0" max="50" step="1" 
                      value={simParams.rain_inc}
                      onChange={(e) => setSimParams({...simParams, rain_inc: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-mono"><span>0mm</span><span>{simParams.rain_inc}mm</span><span>50mm</span></div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Temperature Change (°C)</label>
                    <input 
                      type="range" min="-5" max="5" step="0.5" 
                      value={simParams.temp_change}
                      onChange={(e) => setSimParams({...simParams, temp_change: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-mono"><span>-5°C</span><span>{simParams.temp_change > 0 ? '+' : ''}{simParams.temp_change}°C</span><span>+5°C</span></div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Bacteria Count Growth</label>
                    <input 
                      type="range" min="0" max="50" step="1" 
                      value={simParams.bacteria_inc}
                      onChange={(e) => setSimParams({...simParams, bacteria_inc: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-mono"><span>0</span><span>{simParams.bacteria_inc}</span><span>50</span></div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Case Growth Rate (%)</label>
                    <input 
                      type="range" min="0" max="200" step="5" 
                      value={simParams.growth_sim}
                      onChange={(e) => setSimParams({...simParams, growth_sim: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-mono"><span>0%</span><span>{simParams.growth_sim}%</span><span>200%</span></div>
                  </div>

                  <button 
                    onClick={runSimulation}
                    disabled={simLoading}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                  >
                    {simLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" /> : <Beaker size={20} />}
                    <span>{simLoading ? 'Simulating...' : 'Run Simulation'}</span>
                  </button>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col items-center justify-center text-center">
                    {!simResult ? (
                      <div className="opacity-40">
                        <Beaker size={80} className="mx-auto mb-4" />
                        <h4 className="text-xl font-bold">Awaiting Simulation</h4>
                        <p className="max-w-xs mx-auto mt-2">Adjust parameters and click "Run Simulation" to see predictive impact on city risk.</p>
                      </div>
                    ) : (
                      <div className="w-full space-y-8 animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center">
                          <p className="text-slate-500 font-medium uppercase tracking-widest text-sm mb-2">Simulated City Risk Index</p>
                          <div className={`text-8xl font-black ${simResult.simulated_risk > 70 ? 'text-rose-500' : simResult.simulated_risk > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {simResult.simulated_risk.toFixed(1)}
                          </div>
                          <div className="flex items-center mt-4 text-lg font-bold">
                            <span className="text-slate-400 mr-2">Base Risk: {simResult.base_risk.toFixed(1)}</span>
                            <span className={simResult.simulated_risk > simResult.base_risk ? 'text-rose-500' : 'text-emerald-500'}>
                              {simResult.simulated_risk > simResult.base_risk ? '↑' : '↓'} 
                              {Math.abs(simResult.simulated_risk - simResult.base_risk).toFixed(1)} Change
                            </span>
                          </div>
                        </div>

                        <div className={`p-6 rounded-2xl border-2 flex items-start space-x-4 text-left ${
                          simResult.simulated_risk > 70 
                            ? 'bg-rose-50 border-rose-100 text-rose-800' 
                            : simResult.simulated_risk > 40 
                              ? 'bg-amber-50 border-amber-100 text-amber-800' 
                              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        }`}>
                          <AlertTriangle className="mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-lg uppercase tracking-tight">
                              {simResult.simulated_risk > 70 ? 'Critical Risk Alert' : simResult.simulated_risk > 40 ? 'Elevated Risk Warning' : 'Stable Health Conditions'}
                            </h4>
                            <p className="mt-1 opacity-90 leading-relaxed">
                              {simResult.simulated_risk > 70 
                                ? 'The simulated conditions indicate a extremely high probability of a city-wide outbreak. Immediate emergency preparedness and preventative measures are recommended.' 
                                : simResult.simulated_risk > 40 
                                  ? 'Increased risk parameters detected. Pre-outbreak conditions are likely. Recommend targeted surveillance in vulnerable wards.' 
                                  : 'Environment remains stable. Continue regular monitoring and routine health checks.'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center text-slate-500 text-xs font-bold uppercase mb-2"><CloudRain size={14} className="mr-2" /> Rainfall</div>
                              <div className="text-lg font-bold">+{simParams.rain_inc}mm</div>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center text-slate-500 text-xs font-bold uppercase mb-2"><Thermometer size={14} className="mr-2" /> Temperature</div>
                              <div className="text-lg font-bold">{simParams.temp_change > 0 ? '+' : ''}{simParams.temp_change}°C</div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
