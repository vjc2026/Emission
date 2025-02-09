import React, { useState } from 'react';
import styles from './Text.module.css';

const History = () => {
  const [showActiveTasks, setShowActiveTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  const activeTasks = [
    {
      title: 'Create draft design for Website using Figma',
      status: 'In Progress',
      type: 'Low',
      assignees: ['user1.jpg', 'user2.jpg'],
      spentTime: '1:54h'
    }
  ];

  const completedTasks = [
    {
      title: 'Practice Basic Trouble shooting',
      status: 'Completed',
      type: 'Low',
      assignees: ['user1.jpg', 'user2.jpg'],
      spentTime: '30:19h'
    },
    {
      title: 'OJT Onboarding',
      status: 'Completed',
      type: 'Low',
      assignees: ['user1.jpg', 'user2.jpg'],
      spentTime: ''
    },
    {
      title: 'Identify common PC issues and practice basic troubleshooting',
      status: 'Completed',
      type: 'Low',
      assignees: ['user1.jpg', 'user2.jpg'],
      spentTime: '3:12h'
    }
  ];

  const toggleActiveTasks = () => {
    setShowActiveTasks(!showActiveTasks);
  };

  const toggleCompletedTasks = () => {
    setShowCompletedTasks(!showCompletedTasks);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <button className="addNew">+ Add new</button>
      </div>
      <div className={styles.taskList}>
        <div className={styles.taskSection}>
          <div className={styles.taskSectionHeader} onClick={toggleActiveTasks}>
            Active tasks
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
                {activeTasks.map((task, index) => (
                  <tr key={index}>
                    <td>{task.title}</td>
                    <td>{task.status}</td>
                    <td>{task.type}</td>
                    <td>
                      <div className={styles.taskAssignees}>
                        {task.assignees.map((assignee, index) => (
                          <div key={index} className={styles.assignee}>
                            <img src={assignee} alt="Assignee" />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{task.spentTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className={styles.taskSection}>
          <div className={styles.taskSectionHeader} onClick={toggleCompletedTasks}>
            Completed tasks
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
                {completedTasks.map((task, index) => (
                  <tr key={index} className={styles.completed}>
                    <td>{task.title}</td>
                    <td>{task.status}</td>
                    <td>{task.type}</td>
                    <td>
                      <div className={styles.taskAssignees}>
                        {task.assignees.map((assignee, index) => (
                          <div key={index} className={styles.assignee}>
                            <img src={assignee} alt="Assignee" />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{task.spentTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;

