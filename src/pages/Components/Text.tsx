import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Textarea, TextInput, Select } from '@mantine/core';
import styles from './Text.module.css';

const History = () => {
  // Existing task management state
  const [showActiveTasks, setShowActiveTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Create draft design for Website using Figma',
      description: 'Design a draft for the new website using Figma.',
      status: 'In Progress',
      type: 'Low',
      assignees: ['user1@example.com', 'user2@example.com', 'user3@example.com', 'user4@example.com'],
      spentTime: 6840, // 1:54h in seconds
      isRunning: false,
      startTime: null as number | null,
      carbonEmit: 0,
      leader: null as { email: string; name: string; profileImage: string } | null,
    }
  ]);
  const [now, setNow] = useState(Date.now());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'Low',
    assignees: [] as string[],
  });
  const [selectedTask, setSelectedTask] = useState(null as any);
  const [isEditing, setIsEditing] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState('');

  // New carbon calculation state
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [organization, setOrganization] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDevice, setCurrentDevice] = useState<string | null>(null);

  // Fetch user details and device type on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No token found, please log in.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/user', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setOrganization(data.user.organization);
          fetchUserTasks(data.user.email);
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch user details.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching user details.');
      }

      // Fetch device type
      try {
        const deviceResponse = await fetch('http://localhost:5000/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (deviceResponse.ok) {
          const { deviceType } = await deviceResponse.json();
          setCurrentDevice(deviceType);
        }
      } catch (err) {
        console.error('Error fetching device type:', err);
      }

      setLoading(false);
    };

    fetchUserDetails();
  }, []);

  const fetchUserTasks = async (email: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/user_project_display_combined`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const tasksWithMembers = await Promise.all(data.projects.map(async (project: any) => {
          // Fetch members for each project
          const membersResponse = await fetch(`http://localhost:5000/project/${project.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          let members = [];
          let leader = null;
          if (membersResponse.ok) {
            const { members: projectMembers } = await membersResponse.json();
            members = projectMembers.map((member: any) => {
              if (member.role === 'Leader') {
                leader = {
                  email: member.email,
                  name: member.name,
                  profileImage: member.profile_image
                };
              }
              return {
                email: member.email,
                name: member.name,
                role: member.role,
                joinedAt: member.joined_at,
                profileImage: member.profile_image
              };
            });
          }

          return {
            id: project.id,
            title: project.project_name,
            description: project.project_description,
            status: project.status === 'Archived' ? 'Completed' : 'In Progress',
            type: project.stage || 'Low',
            assignees: members,
            leader: leader,
            spentTime: project.session_duration,
            carbonEmit: project.carbon_emit,
            isRunning: false,
            startTime: null,
          };
        }));

        setTasks(tasksWithMembers);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while fetching tasks.');
    }
  };

  // Update current time every second if any timers are running
  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.some(task => task.isRunning)) {
        setNow(Date.now());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${secs}s`;
  };

  const handleTimer = async (taskId: number) => {
    const token = localStorage.getItem('token');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    if (task.isRunning) {
      // Stop timer and calculate emissions
      const elapsed = task.startTime ? Math.floor((Date.now() - task.startTime) / 1000) : 0;
      const newSpentTime = task.spentTime + elapsed;

      try {
        // Calculate emissions
        const emissionsEndpoint = currentDevice === 'Laptop' 
          ? 'http://localhost:5000/calculate_emissionsM'
          : 'http://localhost:5000/calculate_emissions';

        const emissionsResponse = await fetch(emissionsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            sessionDuration: elapsed,
            projectId: taskId 
          }),
        });

        let newCarbonEmit = task.carbonEmit;
        if (emissionsResponse.ok) {
          const { carbonEmissions } = await emissionsResponse.json();
          newCarbonEmit = (task.carbonEmit || 0) + carbonEmissions;
        }

        // Fetch project members after stopping
        const membersResponse = await fetch(`http://localhost:5000/project/${taskId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        let updatedAssignees = task.assignees;
        if (membersResponse.ok) {
          const { members } = await membersResponse.json();
          updatedAssignees = members.map((member: any) => ({
            email: member.email,
            name: member.name,
            role: member.role,
            joinedAt: member.joined_at
          }));
        }

        // Update task with new values
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                spentTime: newSpentTime,
                isRunning: false,
                startTime: null,
                carbonEmit: newCarbonEmit,
                assignees: updatedAssignees
              };
            }
            return t;
          });
          
          // Update selected task if it's currently selected
          const updatedTask = updatedTasks.find(t => t.id === taskId);
          if (selectedTask?.id === taskId && updatedTask) {
            setSelectedTask(updatedTask);
          }
          
          return updatedTasks;
        });

      } catch (err) {
        console.error('Error updating task:', err);
      }
    } else {
      // Start timer
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              isRunning: true,
              startTime: Date.now(),
            };
          }
          return t;
        });
        const updatedTask = updatedTasks.find(t => t.id === taskId);
        if (selectedTask?.id === taskId && updatedTask) {
          setSelectedTask(updatedTask);
        }
        return updatedTasks;
      });
    }
  };

  const handleComplete = async (taskId: number) => {
    const token = localStorage.getItem('token');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Define the project stages in order
    const projectStages = [
      'Design: Creating the software architecture',
      'Development: Writing the actual code',
      'Testing: Ensuring the software works as expected'
    ];

    // Find the current stage index
    const currentStageIndex = projectStages.indexOf(task.type);
    const nextStage = currentStageIndex < projectStages.length - 1 ? projectStages[currentStageIndex + 1] : null;

    try {
      // Call the complete_project endpoint
      const completeResponse = await fetch(`http://localhost:5000/complete_project/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ nextStage }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete project stage');
      }

      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(t => {
          if (t.id === taskId) {
            let updatedTask = { 
              ...t,
              status: nextStage ? 'In Progress' : 'Completed',
              type: nextStage || t.type
            };
            if (t.isRunning) {
              const elapsed = t.startTime ? Math.floor((Date.now() - t.startTime) / 1000) : 0;
              updatedTask.spentTime += elapsed;
              updatedTask.isRunning = false;
              updatedTask.startTime = null;

              // Calculate final emissions
              const calculateFinalEmissions = async () => {
                try {
                  const emissionsEndpoint = currentDevice === 'Laptop' 
                    ? 'http://localhost:5000/calculate_emissionsM'
                    : 'http://localhost:5000/calculate_emissions';

                  const response = await fetch(emissionsEndpoint, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ 
                      sessionDuration: elapsed,
                      projectId: taskId 
                    }),
                  });

                  if (response.ok) {
                    const { carbonEmissions } = await response.json();
                    updatedTask.carbonEmit = (updatedTask.carbonEmit || 0) + carbonEmissions;
                  }
                } catch (err) {
                  console.error('Error calculating final emissions:', err);
                }
              };

              calculateFinalEmissions();
            }
            return updatedTask;
          }
          return t;
        });
        
        // Update selected task if it's currently selected
        setSelectedTask(updatedTasks.find(task => task.id === taskId));
        return updatedTasks;
      });

      // If this was the last stage, refresh the task list
      if (!nextStage && user?.email) {
        await fetchUserTasks(user.email);
      }

    } catch (err) {
      console.error('Error completing project stage:', err);
    }
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.description) return;
    
    const task = {
      id: Date.now(),
      ...newTask,
      status: 'In Progress',
      spentTime: 0,
      isRunning: false,
      startTime: null,
      carbonEmit: 0,
      leader: null,
    };
    
    setTasks([...tasks, task]);
    setShowAddModal(false);
    setNewTask({ title: '', description: '', type: 'Low', assignees: [] });
  };

  const handleEditTask = () => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === selectedTask.id) {
          return { ...task, title: selectedTask.title, description: selectedTask.description, assignees: selectedTask.assignees };
        }
        return task;
      });
      setSelectedTask(updatedTasks.find(task => task.id === selectedTask.id));
      return updatedTasks;
    });
    setIsEditing(false);
  };

  const handleAddAssignee = () => {
    if (assigneeEmail && !newTask.assignees.includes(assigneeEmail)) {
      setNewTask(prevTask => ({
        ...prevTask,
        assignees: [...prevTask.assignees, assigneeEmail],
      }));
      setAssigneeEmail('');
    }
  };

  const handleEditAssignee = () => {
    if (assigneeEmail && !selectedTask.assignees.includes(assigneeEmail)) {
      setSelectedTask((prevTask: typeof selectedTask) => ({
        ...prevTask,
        assignees: [...prevTask.assignees, assigneeEmail],
      }));
      setAssigneeEmail('');
    }
  };

  const activeTasks = tasks.filter(task => task.status === 'In Progress');
  const completedTasks = tasks.filter(task => task.status === 'Completed');

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsEditing(false);
  };

  const closePanel = () => {
    setSelectedTask(null);
    setIsEditing(false);
  };

  const renderAssignees = (assignees: any[]) => {
    const displayedAssignees = assignees.slice(0, 3);
    const remainingCount = assignees.length - displayedAssignees.length;

    return (
      <div className={styles.taskAssignees}>
        {displayedAssignees.map((assignee, index) => (
          <div key={index} className={styles.assignee}>
            <img 
              src={assignee.profileImage || '/default-avatar.png'} 
              alt={assignee.name}
              className={styles.assigneeAvatar}
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
            <div className={styles.assigneeInfo}>
              <span className={styles.assigneeName}>{assignee.name}</span>
              <span className={styles.assigneeRole}>{assignee.role}</span>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className={styles.moreAssignees}>
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <div className={styles.deviceInfo}>
          <span>Current Device: {currentDevice || 'N/A'}</span>
        </div>
        <button className="addNew" onClick={() => setShowAddModal(true)}>
          + Add new
        </button>
      </div>

      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Project"
        centered
      >
        <div className={styles.addForm}>
          <TextInput
            label="Task Title"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <Textarea
            label="Task Description"
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <Select
            label="Task Type"
            placeholder="Select type"
            value={newTask.type}
            onChange={(value) => setNewTask({ ...newTask, type: value || 'Low' })}
            data={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
            ]}
          />
          <TextInput
            label="Assignee Email"
            placeholder="Enter assignee email"
            value={assigneeEmail}
            onChange={(e) => setAssigneeEmail(e.target.value)}
          />
          <Button onClick={handleAddAssignee}>Add Assignee</Button>
          <div className={styles.assigneesList}>
            {newTask.assignees.map((assignee, index) => (
              <div key={index} className={styles.assignee}>
                <img src={`https://www.gravatar.com/avatar/${assignee}?d=identicon`} alt="Assignee" />
                <span>{assignee}</span>
              </div>
            ))}
          </div>
          <Group align="right" mt="md">
            <Button onClick={handleAddTask}>Add Task</Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
          </Group>
        </div>
      </Modal>

      <div className={styles.taskList}>
        <div className={styles.taskSection}>
          <div className={styles.taskSectionHeader} onClick={() => setShowActiveTasks(!showActiveTasks)}>
            Active tasks ({activeTasks.length})
          </div>
          {showActiveTasks && (
            <table className={styles.taskTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Leader</th>
                  <th>Assignees</th>
                  <th>Spent Time</th>
                  <th>Carbon Emissions</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((task) => {
                  const currentSeconds = task.isRunning 
                    ? task.spentTime + (task.startTime ? Math.floor((Date.now() - task.startTime) / 1000) : 0)
                    : task.spentTime;

                  return (
                    <tr key={task.id} onClick={() => handleTaskClick(task)}>
                      <td>{task.title}</td>
                      <td>{task.status}</td>
                      <td>{task.type}</td>
                      <td>
                        {task.leader && (
                          <div className={styles.assignee}>
                            <img 
                              src={task.leader.profileImage || '/default-avatar.png'} 
                              alt={task.leader.name}
                              className={styles.assigneeAvatar}
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                            <div className={styles.assigneeInfo}>
                              <span className={styles.assigneeName}>{task.leader.name}</span>
                              <span className={styles.assigneeRole}>Leader</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>{renderAssignees(task.assignees)}</td>
                      <td>{formatTime(currentSeconds)}</td>
                      <td>{task.carbonEmit ? `${task.carbonEmit.toFixed(2)} kg CO2` : '0 kg CO2'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.taskSection}>
          <div className={styles.taskSectionHeader} onClick={() => setShowCompletedTasks(!showCompletedTasks)}>
            Completed tasks ({completedTasks.length})
          </div>
          {showCompletedTasks && (
            <table className={styles.taskTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Leader</th>
                  <th>Assignees</th>
                  <th>Spent Time</th>
                  <th>Carbon Emissions</th>
                </tr>
              </thead>
              <tbody>
                {completedTasks.map((task) => (
                  <tr key={task.id} className={styles.completed} onClick={() => handleTaskClick(task)}>
                    <td>{task.title}</td>
                    <td>{task.status}</td>
                    <td>{task.type}</td>
                    <td>
                      {task.leader && (
                        <div className={styles.assignee}>
                          <img 
                            src={task.leader.profileImage || '/default-avatar.png'} 
                            alt={task.leader.name}
                            className={styles.assigneeAvatar}
                            onError={(e: any) => {
                              e.target.onerror = null;
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                          <div className={styles.assigneeInfo}>
                            <span className={styles.assigneeName}>{task.leader.name}</span>
                            <span className={styles.assigneeRole}>Leader</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{renderAssignees(task.assignees)}</td>
                    <td>{formatTime(task.spentTime)}</td>
                    <td>{task.carbonEmit ? `${task.carbonEmit.toFixed(2)} kg CO2` : '0 kg CO2'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedTask && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            {isEditing ? (
              <TextInput
                label="Task Title"
                value={selectedTask.title}
                onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            ) : (
              <h2>{selectedTask.title}</h2>
            )}
            <button className={styles.exitButton} onClick={closePanel}>✖</button>
          </div>
          <div className={styles.panelContent}>
            {isEditing ? (
              <Textarea
                label="Task Description"
                value={selectedTask.description}
                onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                placeholder="Enter task description"
              />
            ) : (
              <p>{selectedTask.description}</p>
            )}
            <p><strong>Status:</strong> {selectedTask.status}</p>
            <p><strong>Type:</strong> {selectedTask.type}</p>
            {selectedTask.leader && (
              <div className={styles.leaderSection}>
                <strong>Project Leader:</strong>
                <div className={styles.assignee}>
                  <img 
                    src={selectedTask.leader.profileImage || '/default-avatar.png'} 
                    alt={selectedTask.leader.name}
                    className={styles.assigneeAvatar}
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className={styles.assigneeInfo}>
                    <span className={styles.assigneeName}>{selectedTask.leader.name}</span>
                    <span className={styles.assigneeRole}>Leader</span>
                  </div>
                </div>
              </div>
            )}
            <p><strong>Spent Time:</strong> {formatTime(selectedTask.isRunning ? 
              selectedTask.spentTime + Math.floor((Date.now() - selectedTask.startTime) / 1000) : 
              selectedTask.spentTime)}</p>
            <p><strong>Carbon Emissions:</strong> {selectedTask.carbonEmit ? 
              `${selectedTask.carbonEmit.toFixed(2)} kg CO2` : '0 kg CO2'}</p>
            <div className={styles.taskAssignees}>
              <strong>Team Members:</strong>
              {renderAssignees(selectedTask.assignees)}
            </div>
            {isEditing && (
              <div className={styles.editAssigneeSection}>
                <TextInput
                  label="Add Assignee"
                  placeholder="Enter assignee email"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                />
                <Button onClick={handleEditAssignee}>Add Assignee</Button>
              </div>
            )}
            <div className={styles.panelButtons}>
              {isEditing ? (
                <Button onClick={handleEditTask} className={styles.saveButton}>Save</Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} className={styles.editButton}>Edit</Button>
              )}
              {selectedTask.status !== 'Completed' && (
                <>
                  <Button onClick={() => handleTimer(selectedTask.id)} 
                          className={selectedTask.isRunning ? styles.stopButton : styles.startButton}>
                    {selectedTask.isRunning ? '⏹ Stop' : '▶ Start'}
                  </Button>
                  <Button onClick={() => handleComplete(selectedTask.id)} className={styles.completeButton}>
                    ✓ Complete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;