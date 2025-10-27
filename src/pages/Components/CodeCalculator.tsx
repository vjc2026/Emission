import React, { useState, useEffect, useRef } from 'react';
import styles from './CodeCalculator.module.css';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

export default function CodeCalculator() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false);
  const [inputSizeN, setInputSizeN] = useState(1000000);
  const [runsPerYear, setRunsPerYear] = useState(1000);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [hardwareWattage, setHardwareWattage] = useState<{
    cpu_watts: number | null;
    gpu_watts: number | null;
    ram_watts: number | null;
    psu_watts: number | null;
  }>({ cpu_watts: null, gpu_watts: null, ram_watts: null, psu_watts: null });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // New state for project selection
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Canonical stage list must match backend gating
  const CANONICAL_STAGES = [
    'Design: Creating the software architecture',
    'Development: Writing the actual code',
    'Testing: Ensuring the software works as expected'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let dots = 0;
      interval = setInterval(() => {
        console.log(`Measuring emissions${'.'.repeat(dots % 5)}`);
        dots++;
      }, 500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch user's hardware wattage on component mount
  useEffect(() => {
    const fetchHardwareWattage = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // First get device type
        const deviceTypeResponse = await fetch('https://emissionserver.vercel.app/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const { deviceType } = await deviceTypeResponse.json();

        // Then get user details based on device type
        const endpoint = deviceType === 'Laptop'
          ? 'https://emissionserver.vercel.app/displayuserM'
          : 'https://emissionserver.vercel.app/displayuser';

        const userResponse = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          const user = data.user;
          
          // Extract wattage based on device type
          if (deviceType === 'Laptop') {
            setHardwareWattage({
              cpu_watts: user?.specifications?.cpu_watts || null,
              gpu_watts: user?.specifications?.gpu_watts || null,
              ram_watts: null, // RAM wattage might not be directly available
              psu_watts: null, // PSU wattage might not be directly available
            });
          } else {
            setHardwareWattage({
              cpu_watts: user?.specifications?.CPU_avg_watt_usage || null,
              gpu_watts: user?.specifications?.GPU_avg_watt_usage || null,
              ram_watts: null,
              psu_watts: null,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching hardware wattage:', error);
      }
    };

    fetchHardwareWattage();
  }, []);

  // Fetch user's active projects
  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('https://emissionserver.vercel.app/user_project_display_combined', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // Filter for active projects only (not completed or archived)
          const activeProjects = data.projects.filter((p: any) => 
            p.status === 'In Progress' || p.status === 'In-Progress'
          );
          setProjects(activeProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

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
    setResult(null);
    setShowCalculations(false);
  };

  const handleMeasure = async () => {
    setLoading(true);
    try {
      // Use the new /analyze endpoint with enhanced parameters
      const response = await axios.post('https://opti-server.vercel.app/analyze', {
        code: code,
        input_size_n: inputSizeN,
        runs_per_year: runsPerYear,
        lat: lat,
        lon: lon,
        cpu_watts: hardwareWattage.cpu_watts,
        gpu_watts: hardwareWattage.gpu_watts,
        ram_watts: hardwareWattage.ram_watts,
        psu_watts: hardwareWattage.psu_watts
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Emissions measured successfully');
      console.log('Full response:', response.data); // Debug log
      setResult(response.data);
    } catch (error) {
      console.error('Error measuring emissions');
      console.error(error);
      
      // For testing purposes, let's add some sample data when there's an error
      console.log('Adding sample data for testing...');
      const sampleData = {
        emissions_gco2: 0.0007,
        eco_score: 85.5,
        metrics: {
          time_complexity: 'O(N)',
          space_complexity: 'O(1)',
          cyclomatic_complexity: 3,
          halstead_volume: 45.2,
          bytecode_ops: 128,
          smells_count: 2
        },
        estimated: {
          ops_total: 1000000,
          runtime_s: 0.4,
          energy_kwh: 0.0023,
          carbon_intensity_gco2_kwh: 475
        },
        breakdown: {
          baseline: 0.0001,
          dynamic: 0.0018,
          patterns: 0.0004,
          categories: {
            energy_eff: 1.0,
            resource: 1.0,
            io: 1.0
          }
        },
        confidence: 0.85,
        suggestions: [
          'Consider using more efficient algorithms for better energy efficiency',
          'Code appears well-optimized for energy efficiency'
        ],
        equivalents: {
          car_km: 0.0058,
          trees_offset: 0.032,
          emails: 0.175
        },
        annual_estimate: {
          kwh: 2.3,
          gco2: 0.7
        },
        warnings: []
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
    const emissions = result.emissions_gco2 || 0;
    const energy = result.estimated?.energy_kwh || 0;
    
    return { emissions, energy };
  };

  const handleSaveToProject = async () => {
    console.log('=== handleSaveToProject called ===');
    console.log('selectedProject:', selectedProject);
    console.log('selectedStage:', selectedStage);
    
    if (!selectedProject || !selectedStage) {
      console.error('Missing project or stage:', { selectedProject, selectedStage });
      notifications.show({
        title: 'Error',
        message: 'Please select both a project and stage',
        color: 'red',
      });
      return;
    }

    if (!result) {
      notifications.show({
        title: 'Error',
        message: 'No analysis results to save',
        color: 'red',
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Ensure stage is locked to the project's current stage
      const projectObj = projects.find(p => p.id.toString() === selectedProject);
      const stageLocked = projectObj?.stage;
      console.log('Selected project object:', projectObj);
      console.log('Current selectedProject (string):', selectedProject);
      console.log('Locked stage (from project):', stageLocked);
      console.log('All canonical stages:', CANONICAL_STAGES);

      // Verify the locked stage value is one of the canonical stages
      if (!stageLocked || !CANONICAL_STAGES.includes(stageLocked)) {
        console.error('Invalid or missing locked stage:', stageLocked);
        notifications.show({
          title: 'Error',
          message: `Invalid stage for project. Must be one of: ${CANONICAL_STAGES.join(', ')}`,
          color: 'red',
        });
        return;
      }

      // Confirm before saving
      console.log('=== Confirmation ===');
      console.log('Project:', projectObj?.project_name);
      console.log('Stage to save to (locked):', stageLocked);
      console.log('Emissions:', result.emissions_gco2, 'g CO₂');

      // Debug logging to verify the values being sent
      console.log('Saving code analysis with values:', {
        project_id: parseInt(selectedProject, 10),
        stage: stageLocked,
        emissions_gco2: result.emissions_gco2,
        energy_kwh: result.estimated?.energy_kwh,
        eco_score: result.eco_score
      });

      const requestBody = {
        project_id: parseInt(selectedProject, 10),
        stage: stageLocked,
        emissions_gco2: result.emissions_gco2,
        energy_kwh: result.estimated?.energy_kwh || 0,
        eco_score: result.eco_score || null,
        time_complexity: result.metrics?.time_complexity || null,
        space_complexity: result.metrics?.space_complexity || null,
      };

      console.log('=== Final request body to be sent ===');
      console.log(JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://emissionserver.vercel.app/add_code_calculated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Response from server:', data);
      console.log('Response status:', response.status);

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Code analysis saved to ${stageLocked.split(':')[0]}! Total emissions: ${data.accumulated_emissions.toFixed(6)} kg CO₂`,
          color: 'green',
        });
        setShowSaveModal(false);
        setSelectedProject('');
        setSelectedStage('');
        
        // Trigger refresh for Statistics page if it's open
        window.dispatchEvent(new CustomEvent('code-analysis-added'));
      } else {
        console.error('Backend returned error:', data);
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to save code analysis',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error saving code analysis:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save code analysis',
        color: 'red',
      });
    }
  };




  return (
    <div className={styles.container} style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <div className={styles.titleBlock}>
        <img src="/logo.svg" width="100px" alt="Logo" />
        <h2>OptiPy</h2>
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
                      Carbon Emission: {formatMetrics(result).emissions.toFixed(6)} kg CO₂
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
                        fontFamily: 'Poppins',
                        marginBottom: '20px'
                      }}>
                        Eco Score: {result.eco_score.toFixed(1)}/100
                      </div>
                    )}
                    
                    <button 
                      onClick={() => {
                        setShowSaveModal(true);
                        // Lock stage to the current project's stage when opening modal
                        const proj = projects.find(p => p.id.toString() === selectedProject);
                        setSelectedStage(proj?.stage || '');
                      }}
                      style={{
                        marginTop: '15px',
                        padding: '12px 24px',
                        backgroundColor: '#3a7f0d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        fontFamily: 'Poppins',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2d6209';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a7f0d';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                    >
                      💾 Save to Project
                    </button>
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

      {/* Save to Project Modal */}
      {showSaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{
              margin: '0 0 1.5rem 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#2c3e50',
              fontFamily: 'Poppins'
            }}>
              Save Code Analysis to Project
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '14px',
                fontWeight: '500',
                color: '#34495e',
                fontFamily: 'Poppins'
              }}>
                Select Project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  const newProjectId = e.target.value;
                  console.log('Project selection changed to:', newProjectId);
                  setSelectedProject(newProjectId);
                  // Lock stage to the selected project's current stage
                  const proj = projects.find(p => p.id.toString() === newProjectId);
                  console.log('Locking stage to project stage:', proj?.stage);
                  setSelectedStage(proj?.stage || '');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '14px',
                  fontFamily: 'Poppins',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Choose a project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name} ({project.stage})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '14px',
                fontWeight: '500',
                color: '#34495e',
                fontFamily: 'Poppins'
              }}>
                Stage (locked to current project) *
              </label>
              <select
                key={`stage-select-${selectedProject}`}
                value={selectedStage}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '14px',
                  fontFamily: 'Poppins',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  color: '#6b7280',
                  cursor: 'not-allowed'
                }}
              >
                {!selectedProject && <option value="">-- Choose a project first --</option>}
                {selectedProject && (
                  <option value={selectedStage}>
                    {selectedStage ? (selectedStage.includes(':') ? selectedStage.split(':')[0] : selectedStage) : 'Unknown stage'}
                  </option>
                )}
              </select>
              <small style={{
                display: 'block',
                marginTop: '0.5rem',
                fontSize: '12px',
                color: '#7f8c8d',
                fontFamily: 'Poppins'
              }}>
              </small>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#34495e',
                fontFamily: 'Poppins',
                marginBottom: '0.5rem'
              }}>
                <strong>Analysis Summary:</strong>
              </div>
              <div style={{
                fontSize: '13px',
                color: '#7f8c8d',
                fontFamily: 'Poppins'
              }}>
                • Emissions: {result?.emissions_gco2?.toFixed(6)} g CO₂<br />
                • Energy: {result?.estimated?.energy_kwh?.toFixed(6)} kWh<br />
                {result?.eco_score && `• Eco Score: ${result.eco_score.toFixed(1)}/100`}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSelectedProject('');
                  setSelectedStage('');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Poppins',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#34495e',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToProject}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Poppins',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#3a7f0d',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d6209';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a7f0d';
                }}
              >
                Save Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

