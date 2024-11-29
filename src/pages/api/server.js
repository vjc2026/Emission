const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mysql = require('mysql2');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
require('dotenv').config();

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // Use environment variable for secret key

let totpSecrets = {};

// Create MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});


// Use cors middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



  app.post('/check-email', (req, res) => {
    const { email } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?'; // Replace 'users' with your table name
  
    connection.query(query, [email], (err, results) => {
      if (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      if (results.length > 0) {
        return res.json({ exists: true });
      } else {
        return res.json({ exists: false });
      }
    });
  });

  // Ensure the uploads directory exists on startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true }); // Create the directory if it doesn't exist
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Save to uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true); // Accept the file
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// File upload route
app.post('/upload', upload.single('profileImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  res.status(200).send({ fileName: req.file.filename });
});

// Serve the uploads folder
app.use('/uploads', express.static(uploadsDir));

  app.post('/check-email', (req, res) => {
    const { email } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?'; // Replace 'users' with your table name
  
    connection.query(query, [email], (err, results) => {
      if (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      if (results.length > 0) {
        return res.json({ exists: true });
      } else {
        return res.json({ exists: false });
      }
    });
  });

// Endpoint to insert user data into the MySQL database
app.post('/register', upload.single('profilePicture'), (req, res) => {
  const { name, email, password, organization, device, cpu, gpu, ram, capacity, motherboard, psu } = req.body;
  const profilePicture = req.file ? req.file.filename : null;

  const query = `
   INSERT INTO users (name, email, password, organization, device, cpu, gpu, ram, capacity, motherboard, psu, profile_image)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(query, [name, email, password, organization, device, cpu, gpu, ram, capacity, motherboard, psu, profilePicture], (err) => {
   if (err) {
    console.error('Error inserting data into the database:', err);
    return res.status(500).json({ error: 'Database error' });
   }

   const profileImageUrl = profilePicture ? `http://localhost:5000/uploads/${profilePicture}` : null;
   res.status(200).json({ message: 'User registered successfully', profileImageUrl });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = `
    SELECT id, name, email FROM users WHERE email = ? AND password = ?
  `;

  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      const user = results[0]; // Get the first user record
      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({ message: 'Login successful', token, userId: user.id, name: user.name, email: user.email });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Endpoint to fetch user's name and email after login
app.get('/user', authenticateToken, (req, res) => {
  const { email } = req.user;

  const userQuery = `
    SELECT name, organization, cpu, gpu, email, profile_image FROM users WHERE email = ?
  `;

  connection.query(userQuery, [email], (err, userResults) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults.length > 0) {
      const user = userResults[0];
      const { cpu, gpu, profile_image } = user;
      
      // Fix the profile image URL construction
      const profileImageUrl = profile_image
        ? `http://localhost:5000/uploads/${profile_image}` // Assuming profile_image contains the filename (e.g., '1731926448773.jpg')
        : null;

      // Queries for avg_watt_usage for both CPU and GPU
      const cpuQuery = `SELECT avg_watt_usage FROM cpus WHERE model = ?`;
      const gpuQuery = `SELECT avg_watt_usage FROM gpus WHERE model = ?`;

      connection.query(cpuQuery, [cpu], (err, cpuResults) => {
        if (err) {
          console.error('Error querying CPU database:', err);
          return res.status(500).json({ error: 'CPU database error' });
        }

        connection.query(gpuQuery, [gpu], (err, gpuResults) => {
          if (err) {
            console.error('Error querying GPU database:', err);
            return res.status(500).json({ error: 'GPU database error' });
          }

          // Attach avg_watt_usage if found, else set as null
          user.cpu_avg_watt_usage = cpuResults[0]?.avg_watt_usage || null;
          user.gpu_avg_watt_usage = gpuResults[0]?.avg_watt_usage || null;
          user.profile_image = profileImageUrl;

          res.status(200).json({ user, profileImageUrl });
        });
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

app.post('/user_history', authenticateToken, (req, res) => {
  const { organization, projectName, projectDescription, sessionDuration, carbonEmit, projectStage, status } = req.body;
  const userId = req.user.id; // Get the user ID from the authenticated token

  // Log the data being inserted
  console.log('Inserting session data:', {
    userId,
    organization,
    projectName,
    projectDescription,
    sessionDuration,
    carbonEmit,
    projectStage, // Log the new field
    status
  });

  const query = `
    INSERT INTO user_history (user_id, organization, project_name, project_description, session_duration, carbon_emit, stage, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(query, [userId, organization, projectName, projectDescription, sessionDuration, carbonEmit, projectStage, status], (err, results) => {
    if (err) {
      console.error('Error inserting session data into the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ message: 'Session recorded successfully' });
  });
});



// Endpoint to fetch user's projects
app.get('/user_projects', authenticateToken, (req, res) => {
  const userId = req.user.id; // Get the user ID from the authenticated token

  const query = `
    SELECT id, organization, project_name, project_description, session_duration, carbon_emit, stage, status 
    FROM user_history 
    WHERE user_id = ? AND status <> 'Complete'
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ projects: results }); // Send back user's projects
  });
});

app.get('/all_user_projects', authenticateToken, (req, res) => {
  const userId = req.user.id; // Get the user ID from the authenticated token

  const query = `
    SELECT id, organization, project_name, project_description, session_duration, carbon_emit, stage, status, created_at 
    FROM user_history 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ projects: results }); // Send back all user's projects
  });
});

// Endpoint to fetch user's projects
app.get('/user_project_display', authenticateToken, (req, res) => {
  const userId = req.user.id; // Get the user ID from the authenticated token

  const query = `
    SELECT id, organization, project_name, project_description, session_duration, carbon_emit, stage, status 
    FROM user_history 
    WHERE user_id = ? AND status
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ projects: results }); // Send back user's projects
  });
});

// Endpoint to update a project
app.put('/update_project/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id; // Get project ID from request parameters
  const userId = req.user.id; // Get user ID from the authenticated token
  const { projectName, projectDescription, projectStage } = req.body; // Get project data from the request body

  const query = `
    UPDATE user_history 
    SET project_name = ?, project_description = ?, stage = ? 
    WHERE id = ? AND user_id = ?
  `;

  connection.query(query, [projectName, projectDescription, projectStage, projectId, userId], (err, results) => {
    if (err) {
      console.error('Error updating project in the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows > 0) {
      res.status(200).json({ message: 'Project updated successfully' });
    } else {
      res.status(404).json({ error: 'Project not found or you do not have permission to update this project' });
    }
  });
});

app.post('/user_Update', authenticateToken, (req, res) => {
  const { projectName, projectDescription, sessionDuration, carbonEmissions, projectStage } = req.body;
  const userId = req.user.id; // Get the user ID from the authenticated token

  const query = `
    UPDATE user_history 
    SET session_duration = ?, carbon_emit = ?, stage = ?
    WHERE user_id = ? AND project_name = ? AND status <> 'Complete' 
  `;

  connection.query(
    query,
    [sessionDuration, carbonEmissions, projectStage, userId, projectName],
    (err, results) => {
      if (err) {
        console.error('Error updating session data in the database:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'No matching project found to update' });
      }

      res.status(200).json({ message: 'Session updated successfully' });
    }
  );
});


// Endpoint to delete a project
app.delete('/delete_project/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id; // Get project ID from request parameters
  const userId = req.user.id; // Get user ID from the authenticated token

  const query = `
    DELETE FROM user_history WHERE id = ? AND user_id = ?
  `;

  connection.query(query, [projectId, userId], (err, results) => {
    if (err) {
      console.error('Error deleting project from the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ message: 'Project deleted successfully' });
  });
});

// Example of a protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'This is a protected route', user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Endpoint to find a project by name and description
app.post('/find_project', authenticateToken, (req, res) => {
  const { projectName, projectDescription } = req.body;
  const userId = req.user.id; // Get user ID from the authenticated token

  const query = `
    SELECT session_duration, id, status
    FROM user_history
    WHERE project_name = ? AND project_description = ? AND user_id = ? AND status <> 'Complete' 
  `;

  connection.query(query, [projectName, projectDescription, userId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Project found, return session duration and project ID
      const project = results[0];
      res.status(200).json({
        session_duration: project.session_duration,
        project_id: project.id,
        project_status: project.status
      });
    } else {
      // No matching project found
      res.status(200).json(null);
    }
  });
});

// Endpoint to find a project by name only
app.post('/check_existing_projectname', authenticateToken, (req, res) => {
  const { projectName } = req.body; // Only check for project name
  const userId = req.user.id; // Get user ID from the authenticated token

  const query = `
    SELECT id
    FROM user_history
    WHERE project_name = ? AND user_id = ?
  `;

  connection.query(query, [projectName, userId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Project with the same name found, return exists:true
      console.log('Project with the same name exists');
      return res.status(200).json({ exists: true });
    } else {
      // No matching project found
      console.log('No project found with the same name');
      return res.status(200).json({ exists: false });
    }
  });
});

// Endpoint to calculate carbon emissions for pc personal computer
app.post('/calculate_emissions', authenticateToken, async (req, res) => {
  const { sessionDuration } = req.body; // Get session duration from the request body
  const userId = req.user.id; // Get user ID from the authenticated token

  try {
      // Fetch user's CPU, GPU, RAM, and PSU details
      const userQuery = `SELECT cpu, gpu, ram, psu FROM users WHERE id = ?`;
      connection.query(userQuery, [userId], async (err, userResults) => {
          if (err) {
              console.error('Error fetching user details:', err);
              return res.status(500).json({ error: 'Database error' });
          }

          if (userResults.length === 0) {
              return res.status(404).json({ error: 'User not found' });
          }

          const { cpu, gpu, ram, psu } = userResults[0];

          // Fetch CPU, GPU, and RAM wattage
          const cpuResponse = await fetch(`http://localhost:5000/cpu_usage?model=${cpu}`);
          const gpuResponse = await fetch(`http://localhost:5000/gpu_usage?model=${gpu}`);
          const ramResponse = await fetch(`http://localhost:5000/ram_usage?model=${ram}`);

          if (cpuResponse.ok && gpuResponse.ok && ramResponse.ok) {
              const cpuData = await cpuResponse.json();
              const gpuData = await gpuResponse.json();
              const ramData = await ramResponse.json();

              const cpuWattUsage = cpuData.avg_watt_usage;
              const gpuWattUsage = gpuData.avg_watt_usage;
              const ramWattUsage = ramData.avg_watt_usage;

              // Add PSU wattage
              const psuWattUsage = psu; // Assuming 'psu' in the database stores the wattage directly

              // Calculate total power consumption (in kWh)
              const totalWattUsage = cpuWattUsage + gpuWattUsage + ramWattUsage + psuWattUsage;
              const totalEnergyUsed = (totalWattUsage * sessionDuration) / 3600; // kWh

              // Define carbon intensity (kg CO2/kWh)
              const CARBON_INTENSITY = 0.475; // Example value, adjust based on your region

              // Calculate carbon emissions
              const carbonEmissions = totalEnergyUsed * CARBON_INTENSITY; // in kg CO2e

              res.status(200).json({ carbonEmissions });
          } else {
              return res.status(500).json({ error: 'Error fetching wattage data' });
          }
      });
  } catch (error) {
      console.error('Error calculating carbon emissions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Check CPU watt usage for pc personal computer
app.get('/cpu_usage', (req, res) => {
  const { model } = req.query;
  const query = 'SELECT avg_watt_usage FROM cpus WHERE model = ?';
  
  connection.query(query, [model], (err, results) => {
    if (err) {
      console.error('Error querying CPU database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      res.status(200).json({ avg_watt_usage: results[0].avg_watt_usage });
    } else {
      res.status(404).json({ error: 'CPU not found' });
    }
  });
});

// Check GPU watt usage for pc personal computer
app.get('/gpu_usage', (req, res) => {
  const { model } = req.query;
  const query = 'SELECT avg_watt_usage FROM gpus WHERE model = ?';
  
  connection.query(query, [model], (err, results) => {
    if (err) {
      console.error('Error querying GPU database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      res.status(200).json({ avg_watt_usage: results[0].avg_watt_usage });
    } else {
      res.status(404).json({ error: 'GPU not found' });
    }
  });
});

// Endpoint to calculate carbon emissions for mobile or laptop
app.post('/calculate_emissionsM', authenticateToken, async (req, res) => {
  const { sessionDuration } = req.body; // Get session duration from the request body
  const userId = req.user.id; // Get user ID from the authenticated token

  try {
      // Fetch user's CPU and GPU details
      const userQuery = `SELECT cpu, gpu, ram FROM users WHERE id = ?`;
      connection.query(userQuery, [userId], async (err, userResults) => {
          if (err) {
              console.error('Error fetching user details:', err);
              return res.status(500).json({ error: 'Database error' });
          }

          if (userResults.length === 0) {
              return res.status(404).json({ error: 'User not found' });
          }

          const { cpu, gpu, ram} = userResults[0];

          // Fetch CPU and GPU wattage
          const cpuResponse = await fetch(`http://localhost:5000/cpum_usage?model=${cpu}`);
          const gpuResponse = await fetch(`http://localhost:5000/gpum_usage?model=${gpu}`);
          const ramResponse = await fetch(`http://localhost:5000/ram_usage?model=${ram}`);

          if (cpuResponse.ok && gpuResponse.ok) {
              const cpuData = await cpuResponse.json();
              const gpuData = await gpuResponse.json();
              const ramData = await ramResponse.json();

              const cpuWattUsage = cpuData.watts;
              const gpuWattUsage = gpuData.watts;
              const ramWattUsage = ramData.avg_watt_usage;

              // Calculate total power consumption (in kWh)
              const totalWattUsage = cpuWattUsage + gpuWattUsage + ramWattUsage;
              const totalEnergyUsed = (totalWattUsage * sessionDuration) / 3600; // kWh

              // Define carbon intensity (kg CO2/kWh)
              const CARBON_INTENSITY = 0.475; // Example value, adjust based on your region

              // Calculate carbon emissions
              const carbonEmissions = totalEnergyUsed * CARBON_INTENSITY; // in kg CO2e

              res.status(200).json({ carbonEmissions });
          } else {
              return res.status(500).json({ error: 'Error fetching wattage data' });
          }
      });
  } catch (error) {
      console.error('Error calculating carbon emissions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Check CPU watt usage for mobile or laptop
app.get('/cpum_usage', (req, res) => {
  const { model } = req.query;
  const query = 'SELECT watts FROM cpusm WHERE model = ?';
  
  connection.query(query, [model], (err, results) => {
    if (err) {
      console.error('Error querying CPU database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      res.status(200).json({ watts: results[0].watts });
    } else {
      res.status(404).json({ error: 'CPUm not found' });
    }
  });
});

// Check GPU watt usage for mobile or laptop
app.get('/gpum_usage', (req, res) => {
  const { model } = req.query;
  const query = 'SELECT watts FROM gpusm WHERE model = ?';
  
  connection.query(query, [model], (err, results) => {
    if (err) {
      console.error('Error querying GPU database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      res.status(200).json({ watts: results[0].watts });
    } else {
      res.status(404).json({ error: 'GPUm not found' });
    }
  });
});

// Check ram watt usage for mobile or laptop
app.get('/ram_usage', (req, res) => {
  const { model } = req.query;
  const query = 'SELECT avg_watt_usage FROM ram WHERE ddr_generation = ?';
  
  connection.query(query, [model], (err, results) => {
    if (err) {
      console.error('Error querying CPU database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      res.status(200).json({ avg_watt_usage: results[0].avg_watt_usage });
    } else {
      res.status(404).json({ error: 'CPU not found' });
    }
  });
});

// Endpoints to fetch available CPU and GPU options
app.get('/cpu-options', (req, res) => {
  const query = 'SELECT manufacturer, series, model FROM cpus';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching GPU options:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Return an array of objects with optionString and model
    const cpuOptions = results.map(row => ({
      label: `${row.manufacturer} ${row.series} ${row.model}`, // Display string
      value: row.model // Unique model value
    }));

    res.status(200).json({ cpuOptions });
  });
});

app.get('/gpu-options', (req, res) => {
  const query = 'SELECT manufacturer, series, model FROM gpus';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching GPU options:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Return an array of objects with optionString and model
    const gpuOptions = results.map(row => ({
      label: `${row.manufacturer} ${row.series} ${row.model}`, // Display string
      value: row.model // Unique model value
    }));

    res.status(200).json({ gpuOptions });
  });
});

app.get('/cpu-options-mobile', (req, res) => {
  const query = 'SELECT generation, model FROM cpusm';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching CPUm options:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Return an array of objects with optionString and model
    const cpuOptions = results.map(row => ({
      label: `${row.generation} ${row.model}`, // Display string
      value: row.model // Unique model value
    }));

    res.status(200).json({ cpuOptions }); // Now matches frontend expectation
  });
});

app.get('/gpu-options-mobile', (req, res) => {
  const query = 'SELECT manufacturer, model FROM gpusm';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching GPUm options:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Return an array of objects with optionString and model
    const gpuOptions = results.map(row => ({
      label: `${row.manufacturer} ${row.model}`, // Display string
      value: row.model // Unique model value
    }));

    res.status(200).json({ gpuOptions }); // Now matches frontend expectation
  });
});

// Endpoint to fetch full user details including organization and device specifications for personal computer
app.get('/displayuser', authenticateToken, (req, res) => {
  const { email } = req.user;

  const userQuery = `
    SELECT name, email, organization, cpu, gpu, ram, motherboard, psu, profile_image
    FROM users 
    WHERE email = ?
  `;

  connection.query(userQuery, [email], (err, userResults) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults.length > 0) {
      const user = userResults[0];
      const { cpu, gpu, profile_image } = user;
      
      // Fix the profile image URL construction
      const profileImageUrl = profile_image
        ? `http://localhost:5000/uploads/${profile_image}` // Assuming profile_image contains the filename (e.g., '1731926448773.jpg')
        : null;

        
        user.profile_image = profileImageUrl;

      const { ram, motherboard, psu } = user;

      // Queries for avg_watt_usage for both CPU and GPU
      const cpuQuery = `SELECT manufacturer, series, model, avg_watt_usage FROM cpus WHERE model = ?`;
      const gpuQuery = `SELECT manufacturer, series, model, avg_watt_usage FROM gpus WHERE model = ?`;

      connection.query(cpuQuery, [cpu], (err, cpuResults) => {
        if (err) {
          console.error('Error querying CPU database:', err);
          return res.status(500).json({ error: 'CPU database error' });
        }

        connection.query(gpuQuery, [gpu], (err, gpuResults) => {
          if (err) {
            console.error('Error querying GPU database:', err);
            return res.status(500).json({ error: 'GPU database error' });
          }

          // Create the specifications object
          const specifications = {
            CPU: cpuResults.length > 0 
              ? `${cpuResults[0].manufacturer} ${cpuResults[0].series} ${cpuResults[0].model}`
              : cpu,
            GPU: gpuResults.length > 0 
              ? `${gpuResults[0].manufacturer} ${gpuResults[0].series} ${gpuResults[0].model}`
              : gpu,
            CPU_avg_watt_usage: cpuResults[0]?.avg_watt_usage || null,
            GPU_avg_watt_usage: gpuResults[0]?.avg_watt_usage || null,
            RAM: ram,
            motherboard: motherboard,
            PSU: psu
          };

          res.status(200).json({ user: { ...user, specifications, profileImageUrl } });
        });
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});


// Endpoint to fetch full user details including organization and device specifications for mobile or laptop
app.get('/displayuserM', authenticateToken, (req, res) => {
  const { email } = req.user;

  const userQuery = `
    SELECT name, email, organization, cpu, gpu, ram, motherboard, psu, profile_image
    FROM users 
    WHERE email = ?
  `;

  connection.query(userQuery, [email], (err, userResults) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults.length > 0) {
      const user = userResults[0];
      const { cpu, gpu, profile_image } = user;
      
      // Fix the profile image URL construction
      const profileImageUrl = profile_image
        ? `http://localhost:5000/uploads/${profile_image}` // Assuming profile_image contains the filename (e.g., '1731926448773.jpg')
        : null;

        
        user.profile_image = profileImageUrl;

      const { ram, motherboard, psu } = user;

      // Queries for avg_watt_usage for both CPU and GPU
      const cpuQuery = `SELECT manufacturer, series, model, avg_watt_usage FROM cpusm WHERE model = ?`;
      const gpuQuery = `SELECT manufacturer, series, model, avg_watt_usage FROM gpusm WHERE model = ?`;

      connection.query(cpuQuery, [cpu], (err, cpuResults) => {
        if (err) {
          console.error('Error querying CPU database:', err);
          return res.status(500).json({ error: 'CPU database error' });
        }

        connection.query(gpuQuery, [gpu], (err, gpuResults) => {
          if (err) {
            console.error('Error querying GPU database:', err);
            return res.status(500).json({ error: 'GPU database error' });
          }

          // Create the specifications object
          const specifications = {
            CPU: cpuResults.length > 0 
              ? `${cpuResults[0].manufacturer} ${cpuResults[0].series} ${cpuResults[0].model}`
              : cpu,
            GPU: gpuResults.length > 0 
              ? `${gpuResults[0].manufacturer} ${gpuResults[0].series} ${gpuResults[0].model}`
              : gpu,
            CPU_avg_watt_usage: cpuResults[0]?.avg_watt_usage || null,
            GPU_avg_watt_usage: gpuResults[0]?.avg_watt_usage || null,
            RAM: ram,
            motherboard: motherboard,
            PSU: psu
          };

          res.status(200).json({ user: { ...user, specifications, profileImageUrl } });
        });
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});


// Endpoint to check device type (Laptop or Personal Computer)
app.get('/checkDeviceType', authenticateToken, (req, res) => {
  const userId = req.user.id; // Get user ID from the authenticated token

  const query = `SELECT device, profile_image FROM users WHERE id = ?`;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error querying device type from database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      const deviceType = results[0].device;
      res.status(200).json({ deviceType }); // Return the device type (Laptop or Personal Computer)
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Endpoint to complete user's project stage
app.post('/complete_project/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;
  const { nextStage } = req.body;

  // Define all project stages in order
  const projectStages = [
    'Design: Creating the software architecture',
    'Development: Writing the actual code',
    'Testing: Ensuring the software works as expected'
  ];

  // First get the current project's stage
  const getCurrentStageQuery = `
    SELECT stage FROM user_history WHERE id = ? AND user_id = ?;
  `;

  connection.query(getCurrentStageQuery, [projectId, userId], (err, results) => {
    if (err) {
      console.error('Error getting current stage:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const currentStage = results[0]?.stage;
    const isLastStage = currentStage === projectStages[projectStages.length - 1];

    // Update current project to mark it as complete
    const completeQuery = `
      UPDATE user_history
      SET status = 'Complete'
      WHERE id = ? AND user_id = ?;
    `;

    connection.query(completeQuery, [projectId, userId], (err, results) => {
      if (err) {
        console.error('Error completing project:', err);
        return res.status(500).json({ error: 'Database error while completing project' });
      }

      // If this is the last stage, just send success response
      if (isLastStage) {
        return res.status(200).json({ 
          message: 'Project completed successfully',
          isComplete: true
        });
      }

      // If not last stage, create next stage
      const insertNewStageQuery = `
        INSERT INTO user_history (user_id, organization, project_name, project_description, session_duration, carbon_emit, stage, status, created_at)
        SELECT user_id, organization, project_name, project_description, 0, 0, ?, 'In-Progress', NOW()
        FROM user_history
        WHERE id = ? AND user_id = ?;
      `;

      connection.query(insertNewStageQuery, [nextStage, projectId, userId], (err, results) => {
        if (err) {
          console.error('Error creating new project stage:', err);
          return res.status(500).json({ error: 'Database error while creating new project stage' });
        }
        res.status(200).json({ 
          message: 'Project stage completed and new stage created successfully',
          isComplete: false
        });
      });
    });
  });
});


app.get('/organization_projects', authenticateToken, (req, res) => {
  const { organization } = req.query;

  const query = `
    SELECT uh.id, uh.project_name, uh.project_description, uh.session_duration, uh.carbon_emit, uh.status, uh.stage, u.name AS owner
    FROM user_history uh
    JOIN users u ON uh.user_id = u.id
    WHERE uh.organization = ?
  `;

  connection.query(query, [organization], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ projects: results });
  });
});

app.get('/user_projects_only', authenticateToken, (req, res) => {
  const userId = req.user.id; // Get user ID from the authenticated token

  const query = `
    SELECT id, project_name, project_description, session_duration, carbon_emit, status, stage
    FROM user_history
    WHERE user_id = ?
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ projects: results });
  });
});

app.get('/ram-options', (req, res) => {
  const query = 'SELECT ddr_generation FROM ram';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching RAM options:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Create an array of RAM options
    const ramOptions = results.map(row => ({
      label: `${row.ddr_generation}`,
      value: row.ddr_generation.toString(),
    }));

    res.status(200).json({ ramOptions });
  });
});

app.post('/generate-totp', async (req, res) => {
  const { email } = req.body;

  // Generate TOTP secret
  const secret = speakeasy.generateSecret({ name: `EmissionSense (${email})` });
  totpSecrets[email] = secret.base32; // Store the secret securely (in a database)

  // Generate QR Code for Google Authenticator
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  res.json({ qrCodeUrl });
});

// Step 2: Validate TOTP and update password
app.post('/validate-totp', async (req, res) => {
  const { email, token, newPassword } = req.body;

  // Retrieve the user's TOTP secret
  const userSecret = totpSecrets[email];
  if (!userSecret) {
    return res.status(400).json({ error: 'Invalid email or token.' });
  }

  // Verify TOTP token
  const isValid = speakeasy.totp.verify({
    secret: userSecret,
    encoding: 'base32',
    token,
  });

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid token.' });
  }

  try {
    // Update the password in the database
    connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [newPassword, email],
      (err, result) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ error: 'Failed to update password.' });
        }

        // Return success response
        if (result.affectedRows > 0) {
          return res.json({ message: 'Password reset successful.' });
        } else {
          return res.status(404).json({ error: 'User not found.' });
        }
      }
    );
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// Endpoint to send password reset email
app.post('/send-reset-email', async (req, res) => {
  const { email } = req.body;

  // Check if the email exists in the database
  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], (err, results) => {
      if (err) {
          console.error('Error querying the database:', err);
          return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'Email not found' });
      }

      // Generate a password reset token
      const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '5m' });

      // Send the password reset email
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      const mailOptions = {
          from: `"EmissionSense" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Password Reset Request - EmissionSense',
          text: `Click the following link to reset your password: ${resetLink}`,
          html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">EmissionSense</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 5px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">Hello,</p>
            <p style="color: #666; line-height: 1.6;">We received a request to reset your password. To proceed with the password reset, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">If you did not make this request, please ignore this email and your password will remain unchanged.</p>
            <p style="color: #666; line-height: 1.6;">This link will expire in 5 minutes for security purposes.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} EmissionSense. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
          `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
              console.error('Error sending email:', err);
              return res.status(500).json({ error: 'Failed to send email' });
          }

          res.status(200).json({ message: 'Password reset email sent successfully' });
      });
  });
});

// Endpoint to reset password
app.post('/resetpassword', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    // Update the password in the database
    connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [newPassword, email],
      (err, result) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ error: 'Failed to update password.' });
        }

        // Return success response
        if (result.affectedRows > 0) {
          return res.json({ message: 'Password reset successful.' });
        } else {
          return res.status(404).json({ error: 'User not found.' });
        }
      }
    );
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Invalid or expired token.' });
  }
});


// Send project invitation
app.post('/send-invitation', authenticateToken, (req, res) => {
  const senderId = req.user.id;
  const { recipientEmail, projectId, message } = req.body;

  // First get recipient's user ID from their email
  const getUserQuery = 'SELECT id FROM users WHERE email = ?';
  
  connection.query(getUserQuery, [recipientEmail], (err, userResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipientId = userResults[0].id;
    
    // Create notification
    const createNotificationQuery = `
      INSERT INTO notifications (sender_id, recipient_id, project_id, type, message)
      VALUES (?, ?, ?, 'project_invitation', ?)
    `;

    connection.query(createNotificationQuery, 
      [senderId, recipientId, projectId, message],
      (err, results) => {
        if (err) {
          console.error('Error creating notification:', err);
          return res.status(500).json({ error: 'Failed to send invitation' });
        }
        res.json({ message: 'Invitation sent successfully' });
    });
  });
});

// Get user's notifications
app.get('/notifications', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      n.*,
      u.name as sender_name,
      u.email as sender_email,
      p.project_name,
      p.project_description
    FROM notifications n
    JOIN users u ON n.sender_id = u.id
    JOIN user_history p ON n.project_id = p.id
    WHERE n.recipient_id = ?
    ORDER BY n.created_at DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
    res.json({ notifications: results });
  });
});

// Mark notification as read
app.put('/notifications/:id/read', authenticateToken, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  const query = `
    UPDATE notifications 
    SET status = 'read'
    WHERE id = ? AND recipient_id = ?
  `;

  connection.query(query, [notificationId, userId], (err, results) => {
    if (err) {
      console.error('Error updating notification:', err);
      return res.status(500).json({ error: 'Failed to update notification' });
    }
    res.json({ message: 'Notification marked as read' });
  });
});

// Respond to project invitation
app.put('/invitations/:id/respond', authenticateToken, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  const { response } = req.body; // 'accepted' or 'rejected'

  connection.beginTransaction(async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Transaction error' });
    }

    try {
      // Update notification status
      const updateQuery = `
        UPDATE notifications 
        SET response = ?, status = 'read'
        WHERE id = ? AND recipient_id = ?
      `;

      await new Promise((resolve, reject) => {
        connection.query(updateQuery, [response, notificationId, userId], (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        });
      });

      // If accepted, add user to project_members
      if (response === 'accepted') {
        const getProjectIdQuery = `
          SELECT project_id FROM notifications WHERE id = ? AND recipient_id = ?
        `;

        const projectId = await new Promise((resolve, reject) => {
          connection.query(getProjectIdQuery, [notificationId, userId], (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results[0].project_id);
          });
        });

        const insertMemberQuery = `
          INSERT INTO project_members (project_id, user_id, role)
          VALUES (?, ?, 'member')
        `;

        await new Promise((resolve, reject) => {
          connection.query(insertMemberQuery, [projectId, userId], (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results);
          });
        });
      }

      connection.commit((err) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ error: 'Transaction commit error' });
          });
        }
        res.json({ message: 'Invitation response recorded successfully' });
      });
    } catch (error) {
      connection.rollback(() => {
        res.status(500).json({ error: 'Transaction error' });
      });
    }
  });
});

// Get project members
app.get('/project/:id/members', authenticateToken, (req, res) => {
  const projectId = req.params.id;

  const query = `
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `;

  connection.query(query, [projectId], (err, results) => {
    if (err) {
      console.error('Error fetching project members:', err);
      return res.status(500).json({ error: 'Failed to fetch project members' });
    }
    res.json({ members: results });
  });
});