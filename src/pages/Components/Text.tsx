import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Textarea, TextInput, Select } from '@mantine/core';
import styles from './Text.module.css';

const History = () => {
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

  const handleTimer = (taskId: number) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          if (task.isRunning) {
            // Stop timer
            const elapsed = task.startTime ? Math.floor((Date.now() - task.startTime) / 1000) : 0;
            return {
              ...task,
              spentTime: task.spentTime + elapsed,
              isRunning: false,
              startTime: null,
            };
          } else {
            // Start timer
            return {
              ...task,
              isRunning: true,
              startTime: Date.now(),
            };
          }
        }
        return task;
      });
      setSelectedTask(updatedTasks.find(task => task.id === taskId));
      return updatedTasks;
    });
  };

  const handleComplete = (taskId: number) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          let updatedTask = { ...task, status: 'Completed' };
          if (task.isRunning) {
            const elapsed = task.startTime ? Math.floor((Date.now() - task.startTime) / 1000) : 0;
            updatedTask.spentTime += elapsed;
            updatedTask.isRunning = false;
            updatedTask.startTime = null;
          }
          return updatedTask;
        }
        return task;
      });
      setSelectedTask(updatedTasks.find(task => task.id === taskId));
      return updatedTasks;
    });
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

  const renderAssignees = (assignees: string[]) => {
    const displayedAssignees = assignees.slice(0, 3);
    const remainingCount = assignees.length - displayedAssignees.length;

    return (
      <div className={styles.taskAssignees}>
        {displayedAssignees.map((assignee, index) => (
          <div key={index} className={styles.assignee}>
            <img src={`https://www.gravatar.com/avatar/${assignee}?d=identicon`} alt="Assignee" />
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
                  <th>Assignees</th>
                  <th>Spent Time</th>
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
                      <td>{renderAssignees(task.assignees)}</td>
                      <td>{formatTime(currentSeconds)}</td>
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
                  <th>Assignees</th>
                  <th>Spent Time</th>
                </tr>
              </thead>
              <tbody>
                {completedTasks.map((task) => (
                  <tr key={task.id} className={styles.completed} onClick={() => handleTaskClick(task)}>
                    <td>{task.title}</td>
                    <td>{task.status}</td>
                    <td>{task.type}</td>
                    <td>{renderAssignees(task.assignees)}</td>
                    <td>{formatTime(task.spentTime)}</td>
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
            <p><strong>Spent Time:</strong> {formatTime(selectedTask.isRunning ? selectedTask.spentTime + Math.floor((Date.now() - selectedTask.startTime) / 1000) : selectedTask.spentTime)}</p>
            <div className={styles.taskAssignees}>
              <strong>Assignees:</strong>
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
                  <Button onClick={() => handleTimer(selectedTask.id)} className={selectedTask.isRunning ? styles.stopButton : styles.startButton}>
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