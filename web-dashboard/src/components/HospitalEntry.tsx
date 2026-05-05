import React, { useState } from 'react';
import axios from 'axios';
import { Stethoscope, CheckCircle, AlertCircle, Calendar, MapPin, Activity } from 'lucide-react';

const HospitalEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    ward_id: 1,
    date: new Date().toISOString().split('T')[0],
    disease: 'Dengue',
    cases: 0,
  });

  const [status, setStatus] = useState<{
    type: 'idle' | 'submitting' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ward_id' || name === 'cases' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'submitting', message: 'Submitting patient data...' });

    try {
      const response = await axios.post('http://localhost:8000/api/hospital/data', formData);
      setStatus({ 
        type: 'success', 
        message: `Successfully integrated ${response.data.cases_added} case(s) of ${formData.disease} for Ward ${formData.ward_id}.` 
      });
      // Reset cases count
      setFormData(prev => ({ ...prev, cases: 0 }));
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' });
      }, 5000);
    } catch (error) {
      console.error("Error submitting data:", error);
      setStatus({ 
        type: 'error', 
        message: 'Failed to submit data. Please ensure the backend is running and the inputs are correct.' 
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="bg-primary/5 px-6 py-8 border-b border-border text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Hospital Data Entry</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Securely record new patient cases. Data submitted here is integrated in real-time with the central health early warning system for outbreak prediction.
          </p>
        </div>

        <div className="p-6 md:p-8">
          {status.type === 'success' && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-xl flex items-start gap-3 transition-gentle">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">Integration Successful</h4>
                <p className="text-sm mt-1 opacity-90">{status.message}</p>
              </div>
            </div>
          )}

          {status.type === 'error' && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-start gap-3 transition-gentle">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">Integration Failed</h4>
                <p className="text-sm mt-1 opacity-90">{status.message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Ward ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Ward Location
                </label>
                <select
                  name="ward_id"
                  value={formData.ward_id}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-gentle text-sm"
                  required
                >
                  {Array.from({ length: 85 }, (_, i) => i + 1).map(id => (
                    <option key={id} value={id}>Ward {id}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Reporting Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-gentle text-sm"
                  required
                />
              </div>

              {/* Disease */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  Disease
                </label>
                <select
                  name="disease"
                  value={formData.disease}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-gentle text-sm"
                  required
                >
                  <option value="Dengue">Dengue</option>
                  <option value="Malaria">Malaria</option>
                  <option value="Chikungunya">Chikungunya</option>
                  <option value="Cholera">Cholera</option>
                </select>
              </div>

              {/* Cases */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="w-4 h-4 text-muted-foreground font-bold">#</span>
                  Number of Cases
                </label>
                <input
                  type="number"
                  name="cases"
                  value={formData.cases}
                  onChange={handleChange}
                  min="0"
                  max="1000"
                  className="w-full h-11 px-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-gentle text-sm"
                  required
                />
              </div>

            </div>

            <div className="pt-6 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={status.type === 'submitting'}
                className={`px-8 py-3 rounded-xl font-medium text-white shadow-sm transition-gentle ${
                  status.type === 'submitting' 
                    ? 'bg-primary/70 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90 hover:shadow-md active:scale-[0.98]'
                }`}
              >
                {status.type === 'submitting' ? 'Processing...' : 'Submit Patient Data'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalEntry;
