const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const JWT = require("jsonwebtoken");

// Serve static files from the current directory
app.use(express.static(__dirname));
app.use(express.json({ limit: '50mb' }));

//Login endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

try {
  
      if (username == "Ops" && password == "Ops") {
  
        const token = await JWT.sign(
            {
              expiresIn: "7d",
              username: username,
            },
            "NZz58bsIo3d3XPZsfN0NOm92z9FMfnKgXwovR9fp6ryDIoGRM8HuHLB6i9sc0ig"
          );
  
          const key = username;
  
          res.setHeader("x-auth-token", token);
  
          res.json({ success: true, message: "Login successful!", token: token });
          console.log("Login successful!");
        } else {
            res.json({ success: false, message: "Invalid username or password." });
            console.log("Invalid username or password.");
          }
      } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

// Endpoint to save backup
app.post('/save-backup', async (req, res) => {
    try {
        const data = req.body;
        // Save in the current directory
        await fs.writeFile('latest_backup.json', JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Backup saved successfully' });
    } catch (error) {
        console.error('Error saving backup:', error);
        res.status(500).json({ error: 'Failed to save backup' });
    }
});

// Endpoint to get latest backup
app.get('/get-latest-backup', async (req, res) => {
    try {
        const data = await fs.readFile('latest_backup.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading backup:', error);
        res.status(404).json({ error: 'No backup file found' });
    }
});

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Set port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Current directory: ${__dirname}`);
});