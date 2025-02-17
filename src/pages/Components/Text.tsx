import React, { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Modal, Button, Group, Textarea, TextInput, Select, Badge, Text, NumberInput } from '@mantine/core';
import { DatePicker, DateValue } from '@mantine/dates';
import styles from './Text.module.css';

type Task = {
  id: number;
  project_id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  assignees: { email: string; name: string; role: string; profileImage: string }[];
  spentTime: number;
  isRunning: boolean;
  startTime: number | null;
  carbonEmit: number;
  leader: { email: string; name: string; profileImage: string } | null;
  stage_duration: number;
  stage_start_date: string;
  stage_due_date: string;
  project_start_date: string;
  project_due_date: string;
};

const History = () => {
  // Existing task management state
  const [showActiveTasks, setShowActiveTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      project_id: 'PRJ-1',
      title: 'Create draft design for Website using Figma',
      description: 'Design a draft for the new website using Figma.',
      status: 'In Progress',
      type: 'Low',
      assignees: [
        { email: 'user1@example.com', name: 'User 1', role: 'Member', profileImage: '' },
        { email: 'user2@example.com', name: 'User 2', role: 'Member', profileImage: '' },
        { email: 'user3@example.com', name: 'User 3', role: 'Member', profileImage: '' },
        { email: 'user4@example.com', name: 'User 4', role: 'Member', profileImage: '' }
      ],
      spentTime: 6840, // 1:54h in seconds
      isRunning: false,
      startTime: null as number | null,
      carbonEmit: 0,
      leader: null as { email: string; name: string; profileImage: string } | null,
      stage_duration: 0,
      stage_start_date: new Date().toISOString().split('T')[0],
      stage_due_date: '',
      project_start_date: new Date().toISOString().split('T')[0],
      project_due_date: ''
    }
  ]);
  const [now, setNow] = useState(Date.now());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'Design: Creating the software architecture',
    assignees: [] as string[],
    stage_duration: 14,
    stage_start_date: new Date().toISOString().split('T')[0],
    stage_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    project_start_date: new Date().toISOString().split('T')[0],
    project_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
            project_id: project.project_id, // Include project_id in task data
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
            stage_duration: project.stage_duration,
            stage_start_date: project.stage_start_date,
            stage_due_date: project.stage_due_date,
            project_start_date: project.project_start_date,
            project_due_date: project.project_due_date
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date';
    }
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
            projectId: taskId,
            project_id: task.project_id // Include project_id in emissions calculation
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

        // Update task with new values and send to server
        const updateResponse = await fetch('http://localhost:5000/user_Update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectName: task.title,
            projectDescription: task.description,
            sessionDuration: newSpentTime,
            carbonEmissions: newCarbonEmit,
            projectStage: task.type,
            projectId: taskId,
            project_id: task.project_id // Include project_id in update
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update task');
        }

        // Update local state
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
      // First stop the timer if it's running
      if (task.isRunning) {
        await handleTimer(taskId);
      }

      // Call the complete_project endpoint
      const completeResponse = await fetch(`http://localhost:5000/complete_project/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          nextStage
        }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete project stage');
      }

      const completionData = await completeResponse.json();

      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(t => {
          if (t.id === taskId) {
            return { 
              ...t,
              status: completionData.status,
              type: completionData.stage
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

      // Close the panel if the project is completed
      if (completionData.status === 'Complete') {
        setSelectedTask(null);
      }

      // Refresh the task list if needed
      if (user?.email) {
        await fetchUserTasks(user.email);
      }

    } catch (err) {
      console.error('Error completing project stage:', err);
      setError('Failed to complete project stage');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.type) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const stage_duration = parseInt(newTask.stage_duration.toString()) || 14;
      const now = new Date();
      const stage_start_date = now.toISOString().split('T')[0];
      const due_date = new Date(now);
      due_date.setDate(now.getDate() + stage_duration);
      const stage_due_date = due_date.toISOString().split('T')[0];

      const projectData = {
        projectName: newTask.title,
        projectDescription: newTask.description,
        organization,
        projectStage: newTask.type,
        sessionDuration: 0,
        carbonEmit: 0,
        status: "In-Progress",
        stage_duration,
        stage_start_date,
        stage_due_date,
        project_start_date: stage_start_date,
        project_due_date: stage_due_date
      };

      const response = await fetch('http://localhost:5000/user_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const data = await response.json();
      
      if (user?.email) {
        await fetchUserTasks(user.email);
      }

      setShowAddModal(false);
      setNewTask({
        title: '',
        description: '',
        type: 'Design: Creating the software architecture',
        assignees: [],
        stage_duration: 14,
        stage_start_date: new Date().toISOString().split('T')[0],
        stage_due_date: '',
        project_start_date: new Date().toISOString().split('T')[0],
        project_due_date: ''
      });
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
    }
  };

  const handleAddAssignee = async () => {
    if (!assigneeEmail) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      if (selectedTask) {
        // Adding assignee to existing task
        const response = await fetch('http://localhost:5000/send-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail: assigneeEmail,
            projectId: selectedTask.id,
            message: `You have been invited to join the project: ${selectedTask.title}`
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send invitation');
        }

        // Update local state for existing task
        setSelectedTask((prevTask: Task) => ({
          ...prevTask,
          assignees: [...prevTask.assignees, { email: assigneeEmail, name: 'Pending...', role: 'Member', profileImage: '' }]
        }));

        // Refresh the project members
        if (user?.email) {
          await fetchUserTasks(user.email);
        }
      } else {
        // Adding assignee to new task
        setNewTask(prevTask => ({
          ...prevTask,
          assignees: [...prevTask.assignees, assigneeEmail]
        }));
      }

      setAssigneeEmail('');
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation');
    }
  };

  // Update handleEditTask to handle project members
  const handleEditTask = async () => {
    if (!selectedTask) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Update project details
      const updateResponse = await fetch(`http://localhost:5000/update_project/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectName: selectedTask.title,
          projectDescription: selectedTask.description,
          projectStage: selectedTask.type,
          stage_duration: selectedTask.stage_duration,
          stage_start_date: selectedTask.stage_start_date,
          stage_due_date: selectedTask.stage_due_date,
          project_due_date: selectedTask.project_due_date
        }),
      });

      const responseData = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(responseData.error || 'Failed to update project');
      }

      // Refresh tasks list to get updated data
      if (user?.email) {
        await fetchUserTasks(user.email);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating project:', err);
      // Show error to user (you might want to add a state for error messages)
      alert('Failed to update project: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

  // Add a function to calculate progress and status
  const calculateProgress = (task: Task) => {
    if (!task.stage_start_date || !task.stage_due_date) {
      return { progress: 0, status: task.status };
    }

    try {
      const now = new Date();
      const startDate = new Date(task.stage_start_date);
      const dueDate = new Date(task.stage_due_date);

      if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
        return { progress: 0, status: task.status };
      }

      const totalDuration = dueDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

      let status = task.status;
      if (now > dueDate && status === 'In-Progress') {
        status = 'Delayed';
      } else if (progress > 90 && status === 'In-Progress') {
        status = 'At Risk';
      }

      return { progress, status };
    } catch (e) {
      console.error('Error calculating progress:', e);
      return { progress: 0, status: task.status };
    }
  };

  // Add useEffect to update stage_due_date when stage_duration changes
  useEffect(() => {
    if (newTask.stage_start_date && newTask.stage_duration) {
      const startDate = new Date(newTask.stage_start_date);
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + newTask.stage_duration);
      setNewTask(prev => ({
        ...prev,
        stage_due_date: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [newTask.stage_start_date, newTask.stage_duration]);

  const handleDateChange = (date: DateValue, field: keyof Task) => {
    if (!selectedTask || !date) return;
    
    setSelectedTask({
      ...selectedTask,
      [field]: date.toISOString().split('T')[0]
    });
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
            required
          />
          <Textarea
            label="Task Description"
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            required
          />
          <Select
            label="Project Stage"
            placeholder="Select type"
            value={newTask.type}
            onChange={(value) => setNewTask({ ...newTask, type: value || 'Design: Creating the software architecture' })}
            data={[
              { value: 'Design: Creating the software architecture', label: 'Design: Creating the software architecture' },
              { value: 'Development: Writing the actual code', label: 'Development: Writing the actual code' },
              { value: 'Testing: Ensuring the software works as expected', label: 'Testing: Ensuring the software works as expected' },
            ]}
            required
          />
          <NumberInput
            label="Stage Duration (days)"
            value={newTask.stage_duration}
            onChange={(value) => {
              const duration = Number(value) || 14;
              const startDate = new Date();
              const dueDate = new Date(startDate);
              dueDate.setDate(startDate.getDate() + duration);
              
              setNewTask({
                ...newTask,
                stage_duration: duration,
                stage_start_date: startDate.toISOString().split('T')[0],
                stage_due_date: dueDate.toISOString().split('T')[0],
                project_start_date: startDate.toISOString().split('T')[0],
                project_due_date: dueDate.toISOString().split('T')[0]
              });
            }}
            min={1}
            max={365}
            required
          />
          <div className={styles.dateGrid}>
            <Text size="sm" fw={500} style={{ marginTop: '1rem' }}>Timeline Dates</Text>
            <Text size="xs" color="dimmed">Start Date: {formatDate(newTask.stage_start_date)}</Text>
            <Text size="xs" color="dimmed">Due Date: {formatDate(newTask.stage_due_date)}</Text>
          </div>
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
            <Button onClick={handleAddTask} style={{ backgroundColor: '#006400', color: '#fff' }}>Create</Button>
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
                  <th>Timeline</th>
                  <th>Progress</th>
                  <th>Spent Time</th>
                  <th>Carbon Emissions</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((task) => {
                  const currentSeconds = task.isRunning 
                    ? task.spentTime + (task.startTime ? Math.floor((Date.now() - task.startTime) / 1000) : 0)
                    : task.spentTime;

                  const { progress, status } = calculateProgress(task);
                  const progressColor = status === 'Delayed' ? 'red' 
                    : status === 'At Risk' ? 'yellow' 
                    : 'green';

                  const daysRemaining = Math.ceil((new Date(task.stage_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={task.id} onClick={() => handleTaskClick(task)}>
                      <td>{task.title}</td>
                      <td>
                        <Badge 
                          color={status === 'Delayed' ? 'red' : status === 'At Risk' ? 'yellow' : 'green'}
                        >
                          {status}
                        </Badge>
                      </td>
                      <td>{task.type}</td>
                      <td>
                        {task.leader && renderAssignees([task.leader])}
                      </td>
                      <td>{renderAssignees(task.assignees)}</td>
                      <td>
                        <div className={styles.timelineInfo}>
                          <div>Start: {new Date(task.stage_start_date).toLocaleDateString()}</div>
                          <div>Due: {new Date(task.stage_due_date).toLocaleDateString()}</div>
                          <div>{daysRemaining} days remaining</div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ 
                              width: `${progress}%`,
                              backgroundColor: progressColor 
                            }} 
                          />
                          <span>{Math.round(progress)}%</span>
                        </div>
                      </td>
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
              <>
                <Textarea
                  label="Task Description"
                  value={selectedTask.description}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  placeholder="Enter task description"
                />
                <NumberInput
                  label="Stage Duration (days)"
                  value={selectedTask.stage_duration || 14}
                  onChange={(value) => {
                    const duration = Number(value);
                    if (!isNaN(duration) && duration > 0) {
                      const startDate = new Date(selectedTask.stage_start_date || new Date());
                      const dueDate = new Date(startDate);
                      dueDate.setDate(startDate.getDate() + duration);
                      setSelectedTask({
                        ...selectedTask,
                        stage_duration: duration,
                        stage_due_date: dueDate.toISOString().split('T')[0]
                      });
                    }
                  }}
                  min={1}
                  max={365}
                />
                
                
              </>
            ) : (
              <>
                <p>{selectedTask.description}</p>
                <div className={styles.timelineDetails}>
                  <h3>Timeline Details</h3>
                  <div className={styles.timelineGrid}>
                    <div>
                      <strong>Stage Duration:</strong> {selectedTask.stage_duration} days
                    </div>
                    <div>
                      <strong>Stage Start:</strong> {formatDate(selectedTask.stage_start_date)}
                    </div>
                    <div>
                      <strong>Stage Due:</strong> {formatDate(selectedTask.stage_due_date)}
                    </div>
                    <div>
                      <strong>Project Due:</strong> {formatDate(selectedTask.project_due_date)}
                    </div>
                  </div>
                  <div className={styles.progressSection}>
                    <strong>Progress:</strong>
                    {(() => {
                      const { progress, status } = calculateProgress(selectedTask);
                      const daysLeft = selectedTask.stage_due_date ? 
                        Math.ceil((new Date(selectedTask.stage_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
                        0;

                      return (
                        <>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill} 
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: status === 'Delayed' ? '#ff4d4f' : 
                                               status === 'At Risk' ? '#faad14' : 
                                               '#52c41a'
                              }} 
                            />
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className={styles.progressInfo}>
                            <Badge 
                              color={status === 'Delayed' ? 'red' : 
                                    status === 'At Risk' ? 'yellow' : 
                                    'green'}
                            >
                              {status}
                            </Badge>
                            {daysLeft > 0 && (
                              <Text size="sm" color="dimmed">
                                {daysLeft} days remaining
                              </Text>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
            <div className={styles.taskMeta}>
              <p><strong>Status:</strong> {selectedTask.status}</p>
              <p><strong>Type:</strong> {selectedTask.type}</p>
            </div>
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
                <Button onClick={handleAddAssignee}>Add Assignee</Button>
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