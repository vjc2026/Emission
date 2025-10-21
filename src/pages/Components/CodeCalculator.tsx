import React, { useState, useEffect, useRef } from 'react';
import { Textarea, Button, Text, Card, Title, Divider } from '@mantine/core';
import styles from './CodeCalculator.module.css';
import axios from 'axios';

export default function CodeCalculator() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false);
  const [deviceSpecs, setDeviceSpecs] = useState<any>(null);
  const [deviceType, setDeviceType] = useState<string | null>(null);
  const [inputSizeN, setInputSizeN] = useState(1000000);
  const [runsPerYear, setRunsPerYear] = useState(1000);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user's device specifications on component mount
  useEffect(() => {
    const fetchDeviceSpecs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // First, check the device type
        const deviceTypeResponse = await axios.get('https://emissionserver.vercel.app/checkDeviceType', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const { deviceType } = deviceTypeResponse.data;
        setDeviceType(deviceType);

        // Based on device type, choose the correct endpoint
        const endpoint = deviceType === 'Laptop'
          ? 'https://emissionserver.vercel.app/displayuserM'
          : 'https://emissionserver.vercel.app/displayuser';

        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && response.data.user) {
          setDeviceSpecs(response.data.user.specifications);
          console.log('Device specs loaded:', response.data.user.specifications);
          console.log('Device type:', deviceType);
        }
      } catch (error) {
        console.error('Error fetching device specifications:', error);
      }
    };

    fetchDeviceSpecs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let dots = 0;
      interval = setInterval(() => {
        setStatus(`Measuring emissions${'.'.repeat(dots % 5)}`);
        dots++;
      }, 500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => setCode(text));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Check if we need to add indentation
      const shouldIndent = currentLine.match(/\s*(if|for|while|def|class|try|except|finally|with|elif|else):\s*$/);
      
      if (shouldIndent) {
        e.preventDefault();
        const indent = currentLine.match(/^(\s*)/)?.[1] || '';
        const newIndent = indent + '  '; // 2 spaces for Python
        const newValue = textarea.value.substring(0, cursorPos) + '\n' + newIndent + textarea.value.substring(cursorPos);
        setCode(newValue);
        
        // Set cursor position after the new indentation
        setTimeout(() => {
          const newCursorPos = cursorPos + 1 + newIndent.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      if (start === end) {
        // Single cursor - insert spaces
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setCode(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      } else {
        // Selection - indent all selected lines
        const lines = value.split('\n');
        const startLine = value.substring(0, start).split('\n').length - 1;
        const endLine = value.substring(0, end).split('\n').length - 1;
        
        for (let i = startLine; i <= endLine; i++) {
          lines[i] = '  ' + lines[i];
        }
        
        const newValue = lines.join('\n');
        setCode(newValue);
        
        setTimeout(() => {
          const newStart = start + 2;
          const newEnd = end + (endLine - startLine + 1) * 2;
          textarea.setSelectionRange(newStart, newEnd);
        }, 0);
      }
    }
  };

  const handleDelete = () => {
    setCode('');
    setStatus('');
    setResult(null);
    setShowCalculations(false);
  };

  const handleMeasure = async () => {
    setLoading(true);
    try {
      // Prepare request payload with code and device specifications
      const payload: any = {
        code: code
      };

      // Add device specifications if available
      if (deviceSpecs) {
        // Desktop/PC specs
        if (deviceSpecs.CPU_avg_watt_usage) {
          payload.cpu_watts = deviceSpecs.CPU_avg_watt_usage;
        }
        if (deviceSpecs.GPU_avg_watt_usage) {
          payload.gpu_watts = deviceSpecs.GPU_avg_watt_usage;
        }
        if (deviceSpecs.RAM_avg_watt_usage) {
          payload.ram_watts = deviceSpecs.RAM_avg_watt_usage;
        }
        if (deviceSpecs.PSU_watts) {
          payload.psu_watts = deviceSpecs.PSU_watts;
        }
        
        // Laptop/Mobile specs
        if (deviceSpecs.cpu_watts) {
          payload.cpu_watts = deviceSpecs.cpu_watts;
        }
        if (deviceSpecs.gpu_watts) {
          payload.gpu_watts = deviceSpecs.gpu_watts;
        }
        if (deviceSpecs.ram_watts) {
          payload.ram_watts = deviceSpecs.ram_watts;
        }
        if (deviceSpecs.psu_watts) {
          payload.psu_watts = deviceSpecs.psu_watts;
        }
      }

      console.log('Sending payload with device specs:', payload);

      // Add new parameters to payload
      if (inputSizeN) payload.input_size_n = inputSizeN;
      if (runsPerYear) payload.runs_per_year = runsPerYear;
      if (lat !== null) payload.lat = lat;
      if (lon !== null) payload.lon = lon;

      const response = await axios.post('https://opti-server.vercel.app/analyze', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setStatus('Emissions measured successfully');
      console.log('Full response:', response.data); // Debug log
      setResult(response.data);
    } catch (error) {
      setStatus('Error measuring emissions');
      console.error(error);
      
      // For testing purposes, let's add some sample data when there's an error
      console.log('Adding sample data for testing...');
      const sampleData = {
        metrics: {
          emissions: 0.0007,
          energy: 0.0023,
          execution_time: 1.2345,
          detailed_data: {
            cpu_energy: 0.0012,
            gpu_energy: 0.0008,
            ram_energy: 0.0003,
            total_energy: 0.0023,
            cpu_power: 45.2,
            gpu_power: 12.8,
            ram_power: 8.5,
            total_power: 66.5,
            cpu_emissions: 0.0004,
            gpu_emissions: 0.0002,
            ram_emissions: 0.0001,
            total_emissions: 0.0007
          }
        },
        hardware_info: {
          cpu: {
            model: "Intel Core i7-10700K",
            cores: 8,
            threads: 16,
            frequency: 3600
          },
          gpu: {
            model: "NVIDIA RTX 3070",
            memory: 8192
          },
          memory: {
            total: 16,
            available: 12.5,
            percent: 22.5
          },
          platform: "Windows",
          python_version: "3.9.0"
        },
                 calculations: {
           energy_calculation: {
             formula: 'Energy (kWh) = Power (W) × Time (hours)',
             steps: [
               'Execution time: 1.234500000000000 seconds = 3.430556 × 10^-4 hours',
               'CPU Energy = 4.520000 × 10^1W × 3.430556 × 10^-4h = 1.200000 × 10^-3 kWh',
               'GPU Energy = 1.280000 × 10^1W × 3.430556 × 10^-4h = 8.000000 × 10^-4 kWh',
               'RAM Energy = 8.500000 × 10^0W × 3.430556 × 10^-4h = 3.000000 × 10^-4 kWh'
             ]
           },
           emissions_calculation: {
             formula: 'Emissions (kg CO2) = Energy (kWh) × Carbon Intensity (kg CO2/kWh)',
             carbon_intensity: 0.5,
             steps: [
               'Using carbon intensity: 0.5 kg CO2/kWh (global average)',
               'Total Emissions = 2.300000 × 10^-3 kWh × 0.5 kg CO2/kWh = 1.150000 × 10^-3 kg CO2'
             ]
           },
          power_breakdown: {
            cpu: 45.2,
            gpu: 12.8,
            ram: 8.5,
            total: 66.5
          },
          energy_breakdown: {
            cpu: 0.0012,
            gpu: 0.0008,
            ram: 0.0003,
            total: 0.0023
          },
          emissions_breakdown: {
            cpu: 0.0004,
            gpu: 0.0002,
            ram: 0.0001,
            total: 0.0007
          }
        },
        timing: {
          duration: 1.2345,
          start_time: Date.now() - 1234,
          end_time: Date.now()
        }
      };
      setResult(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const formatMetrics = (result: any) => {
    if (!result) return { emissions: 0, energy: 0 };
    
    console.log('Raw result data:', result); // Debug log
    
    // Extract emissions and energy from the new response format
    const emissions = result.emissions_gco2 || result.emissions || 0;
    const energy = result.estimated?.energy_kwh || result.energy || 0;
    
    return { emissions, energy };
  };

  const formatCalculations = (calculations: any) => {
    if (!calculations) return '';
    
    // Helper function to format numbers in scientific notation
    const formatScientific = (value: number) => {
      if (value === 0) return '0';
      const exp = Math.floor(Math.log10(Math.abs(value)));
      const mantissa = value / Math.pow(10, exp);
      return `${mantissa.toFixed(6)} × 10^${exp}`;
    };
    
    let formattedText = '';
    
    // Energy Calculation Section
    formattedText += '⚡ ENERGY CALCULATION\n';
    formattedText += '═══════════════════\n\n';
    formattedText += `Formula: ${calculations.energy_calculation.formula}\n\n`;
    
    calculations.energy_calculation.steps.forEach((step: string, index: number) => {
      formattedText += `${index + 1}. ${step}\n`;
    });
    
    formattedText += '\n';
    
    // Power Breakdown
    formattedText += '🔌 POWER BREAKDOWN\n';
    formattedText += '═══════════════════\n\n';
    formattedText += `CPU Power:      ${formatScientific(calculations.power_breakdown.cpu)} W\n`;
    formattedText += `GPU Power:      ${formatScientific(calculations.power_breakdown.gpu)} W\n`;
    formattedText += `RAM Power:      ${formatScientific(calculations.power_breakdown.ram)} W\n`;
    formattedText += `Total Power:    ${formatScientific(calculations.power_breakdown.total)} W\n\n`;
    
    // Energy Breakdown
    formattedText += '⚡ ENERGY BREAKDOWN\n';
    formattedText += '═══════════════════\n\n';
    formattedText += `CPU Energy:     ${formatScientific(calculations.energy_breakdown.cpu)} kWh\n`;
    formattedText += `GPU Energy:     ${formatScientific(calculations.energy_breakdown.gpu)} kWh\n`;
    formattedText += `RAM Energy:     ${formatScientific(calculations.energy_breakdown.ram)} kWh\n`;
    formattedText += `Total Energy:   ${formatScientific(calculations.energy_breakdown.total)} kWh\n\n`;
    
    // Emissions Calculation Section
    formattedText += '🌱 EMISSIONS CALCULATION\n';
    formattedText += '═══════════════════\n\n';
    formattedText += `Formula: ${calculations.emissions_calculation.formula}\n\n`;
    
    calculations.emissions_calculation.steps.forEach((step: string, index: number) => {
      formattedText += `${index + 1}. ${step}\n`;
    });
    
    formattedText += '\n';
    
    // Emissions Breakdown
    formattedText += '🌱 EMISSIONS BREAKDOWN\n';
    formattedText += '═══════════════════\n\n';
    formattedText += `CPU Emissions:  ${formatScientific(calculations.emissions_breakdown.cpu)} kg CO2\n`;
    formattedText += `GPU Emissions:  ${formatScientific(calculations.emissions_breakdown.gpu)} kg CO2\n`;
    formattedText += `RAM Emissions:  ${formatScientific(calculations.emissions_breakdown.ram)} kg CO2\n`;
    formattedText += `Total Emissions: ${formatScientific(calculations.emissions_breakdown.total)} kg CO2\n`;
    
    return formattedText;
  };

  return (
    <div className={styles.container} style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <div className={styles.titleBlock}>
        <img src="/logo.svg" width="100px" alt="Logo" />
        <h2>OptiPy</h2>
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginBottom: '1rem', 
        padding: '0.75rem', 
        backgroundColor: 'rgba(255, 193, 7, 0.1)', 
        border: '1px solid rgba(255, 193, 7, 0.3)', 
        borderRadius: '8px',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <p style={{ 
          margin: '0', 
          fontSize: '14px', 
          color: '#856404', 
          fontFamily: 'Poppins',
          fontWeight: '400'
        }}>
          <strong>⚠️ Disclaimer:</strong> This tool is designed to work exclusively with Python code. 
          Code that requires external modules, dependencies, or file attachments may not function properly 
          and could result in measurement errors.
        </p>
      </div>

      {/* Configuration Panel */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 2rem auto',
        padding: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#2c3e50',
          fontFamily: 'Poppins'
        }}>Analysis Configuration</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#34495e',
              fontFamily: 'Poppins'
            }}>Input Size (N)</label>
            <input
              type="number"
              value={inputSizeN}
              onChange={(e) => setInputSizeN(parseInt(e.target.value) || 1000000)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
              placeholder="1000000"
            />
            <small style={{
              color: '#7f8c8d',
              fontSize: '12px',
              fontFamily: 'Poppins'
            }}>Expected input size for your algorithm</small>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#34495e',
              fontFamily: 'Poppins'
            }}>Runs Per Year</label>
            <input
              type="number"
              value={runsPerYear}
              onChange={(e) => setRunsPerYear(parseInt(e.target.value) || 1000)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
              placeholder="1000"
            />
            <small style={{
              color: '#7f8c8d',
              fontSize: '12px',
              fontFamily: 'Poppins'
            }}>How often this code runs annually</small>
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#34495e',
              fontFamily: 'Poppins'
            }}>Latitude (Optional)</label>
            <input
              type="number"
              step="any"
              value={lat || ''}
              onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
              placeholder="14.5995 (Manila)"
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
              color: '#34495e',
              fontFamily: 'Poppins'
            }}>Longitude (Optional)</label>
            <input
              type="number"
              step="any"
              value={lon || ''}
              onChange={(e) => setLon(e.target.value ? parseFloat(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
              placeholder="120.9842 (Manila)"
            />
          </div>
        </div>
        
        <p style={{
          margin: '1rem 0 0 0',
          fontSize: '12px',
          color: '#7f8c8d',
          fontFamily: 'Poppins',
          fontStyle: 'italic'
        }}>
          💡 Location data helps provide more accurate carbon intensity estimates for your region.
        </p>
      </div>

      <div className={styles.squarebox}>
        <div className={styles.sbcontainer}>
          <div className={styles.sbcontainer2}>
            <div className={styles.input}>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(event) => setCode(event.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start by writing or pasting (CTRL + V) your Python code.&#10;&#10;Features:&#10;• Auto-indentation on Enter after :, def, if, for, while, etc.&#10;• Tab for indentation&#10;• Shift+Tab for outdent&#10;&#10;To measure emissions, press the button below."
                className={styles.textarea}
                spellCheck={false}
              />
              <div className={styles.buttonGroup}>
                <button className={styles.pasteBtn} onClick={handlePaste}>Paste Code</button>
              </div>
              <div className={styles.deleteIcon} onClick={handleDelete}>
                <svg width="22" height="26" viewBox="0 0 27 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path id="Vector" d="M1.83325 8.2288H25.1666M10.5833 14.4576V23.8008M16.4166 14.4576V23.8008M3.29159 8.2288L4.74992 26.9152C4.74992 27.7412 5.05721 28.5334 5.60419 29.1174C6.15117 29.7015 6.89304 30.0296 7.66659 30.0296H19.3333C20.1068 30.0296 20.8487 29.7015 21.3956 29.1174C21.9426 28.5334 22.2499 27.7412 22.2499 26.9152L23.7083 8.2288M9.12492 8.2288V3.5572C9.12492 3.14421 9.27856 2.74812 9.55206 2.45609C9.82555 2.16406 10.1965 2 10.5833 2H16.4166C16.8034 2 17.1743 2.16406 17.4478 2.45609C17.7213 2.74812 17.8749 3.14421 17.8749 3.5572V8.2288" stroke="#3a7f0d" strokeOpacity="0.96" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className={styles.output}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: '20px',
                textAlign: 'center'
              }}>
                {result ? (
                  <>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '20px',
                      fontFamily: 'Poppins'
                    }}>
                      Carbon Emission: {formatMetrics(result).emissions.toFixed(6)} g CO₂
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '500',
                      color: '#34495e',
                      fontFamily: 'Poppins',
                      marginBottom: '10px'
                    }}>
                      Energy Consumption: {formatMetrics(result).energy.toFixed(6)} kWh
                    </div>
                    {result.eco_score && (
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        color: result.eco_score > 70 ? '#27ae60' : result.eco_score > 50 ? '#f39c12' : '#e74c3c',
                        fontFamily: 'Poppins'
                      }}>
                        Eco Score: {result.eco_score.toFixed(1)}/100
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    fontSize: '18px',
                    color: '#7f8c8d',
                    fontFamily: 'Poppins'
                  }}>
                    Your emissions measurement results will appear here
                  </div>
                )}
              </div>
            </div>
          </div>

          <button className={styles.btn2} onClick={handleMeasure} disabled={loading}>
            <svg height="24" width="24" fill="#FFFFFF" viewBox="0 0 24 24" data-name="Layer 1" id="Layer_1" className={styles.sparkle}>
              <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z"></path>
            </svg>
            <span className={styles.text1}>{loading ? 'Measuring...' : 'Measure Emissions'}</span>
          </button>
        </div>
      </div>

      {/* Static Analysis Section */}
      {result && (
        <div style={{ 
          marginTop: '2rem',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setShowCalculations(!showCalculations)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: showCalculations ? '#e74c3c' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Poppins',
                transition: 'background-color 0.3s ease'
              }}
            >
              {showCalculations ? 'Hide Analysis Details' : 'Show Analysis Details'}
            </button>
          </div>

          {showCalculations && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem',
              marginTop: '1rem',
              maxWidth: '1400px',
              width: '100%',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {/* Complexity Metrics Card */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e1e8ed',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontFamily: 'Poppins',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📊 Complexity Metrics
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '500', color: '#34495e' }}>Time Complexity:</span>
                    <span style={{ fontWeight: '600', color: '#e74c3c' }}>{result.metrics?.time_complexity || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '500', color: '#34495e' }}>Space Complexity:</span>
                    <span style={{ fontWeight: '600', color: '#e74c3c' }}>{result.metrics?.space_complexity || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '500', color: '#34495e' }}>Cyclomatic Complexity:</span>
                    <span style={{ fontWeight: '600', color: '#e74c3c' }}>{result.metrics?.cyclomatic_complexity || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Eco Score Card */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e1e8ed',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontFamily: 'Poppins',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🌱 Eco Score
                </h3>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: result.eco_score > 70 ? '#27ae60' : result.eco_score > 50 ? '#f39c12' : '#e74c3c',
                    fontFamily: 'Poppins'
                  }}>
                    {result.eco_score?.toFixed(1) || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#7f8c8d',
                    fontFamily: 'Poppins'
                  }}>
                    out of 100
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '14px',
                  color: '#34495e',
                  fontFamily: 'Poppins'
                }}>
                  {result.eco_score > 70 ? '✅ Excellent energy efficiency!' : 
                   result.eco_score > 50 ? '⚠️ Good efficiency with room for improvement' : 
                   '❌ Consider optimizing for better energy efficiency'}
                </div>
              </div>

              {/* Carbon Emissions Impact Card */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e1e8ed',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontFamily: 'Poppins',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🌍 Carbon Impact
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#e74c3c',
                    fontFamily: 'Poppins',
                    marginBottom: '0.5rem'
                  }}>
                    {formatMetrics(result).emissions.toFixed(6)} g CO₂
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#7f8c8d',
                    fontFamily: 'Poppins'
                  }}>
                    per execution
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {result.equivalents && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <span style={{ fontSize: '16px' }}>🚗</span>
                        <span style={{ fontSize: '14px', color: '#34495e' }}>Equivalent to driving {result.equivalents.car_km.toFixed(2)} km by car</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <span style={{ fontSize: '16px' }}>🌳</span>
                        <span style={{ fontSize: '14px', color: '#34495e' }}>Equal to {result.equivalents.trees_offset.toFixed(2)} trees absorbing CO₂ for a day</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <span style={{ fontSize: '16px' }}>📧</span>
                        <span style={{ fontSize: '14px', color: '#34495e' }}>Same as sending {result.equivalents.emails.toFixed(0)} emails</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Energy Consumption Card */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e1e8ed',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontFamily: 'Poppins',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⚡ Energy Usage
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#3498db',
                    fontFamily: 'Poppins',
                    marginBottom: '0.5rem'
                  }}>
                    {formatMetrics(result).energy.toFixed(6)} kWh
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#7f8c8d',
                    fontFamily: 'Poppins'
                  }}>
                    per execution
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <span style={{ fontSize: '16px' }}>💡</span>
                    <span style={{ fontSize: '14px', color: '#34495e' }}>Powers a 60W light bulb for {(formatMetrics(result).energy * 1000 / 60).toFixed(1)} hours</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <span style={{ fontSize: '16px' }}>📱</span>
                    <span style={{ fontSize: '14px', color: '#34495e' }}>Charges a smartphone {(formatMetrics(result).energy * 1000 / 0.01).toFixed(0)} times</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                    <span style={{ fontSize: '16px' }}>💻</span>
                    <span style={{ fontSize: '14px', color: '#34495e' }}>Runs a laptop for {(formatMetrics(result).energy * 1000 / 50).toFixed(1)} hours</span>
                  </div>
                </div>
              </div>

              {/* Annual Estimates Card */}
              {result.annual_estimate && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e1e8ed',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontFamily: 'Poppins',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📅 Annual Impact
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <span style={{ fontWeight: '500', color: '#34495e' }}>Annual Energy:</span>
                      <span style={{ fontWeight: '600', color: '#3498db' }}>{result.annual_estimate.kwh.toFixed(3)} kWh</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <span style={{ fontWeight: '500', color: '#34495e' }}>Annual Emissions:</span>
                      <span style={{ fontWeight: '600', color: '#e74c3c' }}>{result.annual_estimate.gco2.toFixed(3)} g CO₂</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions Card */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e1e8ed',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontFamily: 'Poppins',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    💡 Optimization Suggestions
                  </h3>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {result.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#34495e',
                        fontFamily: 'Poppins'
                      }}>
                        <span style={{ fontWeight: '600', color: '#3498db' }}>{index + 1}.</span>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings Card */}
              {result.warnings && result.warnings.length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e1e8ed',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontFamily: 'Poppins',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ⚠️ Warnings
                  </h3>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {result.warnings.map((warning: string, index: number) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#dc2626',
                        fontFamily: 'Poppins'
                      }}>
                        <span style={{ fontWeight: '600' }}>⚠️</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}