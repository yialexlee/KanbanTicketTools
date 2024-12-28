const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));
app.use(express.json({ limit: '50mb' }));

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
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Set port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Current directory: ${__dirname}`);
});