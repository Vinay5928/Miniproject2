const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// The simple backend password match string configuration
const SERVER_MASTER_PIN = "1234";

// Middleware Pipelines
app.use(cors()); // Permits communication between frontend layouts and port origins
app.use(bodyParser.json({ limit: '10mb' })); // Handles large raw layout strings comfortably

// Utility Helper: Secure Data Deserialization Read
const readDatabase = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
            return {};
        }
        const rawContent = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(rawContent || '{}');
    } catch (error) {
        console.error("Database reading breakdown fault:", error);
        return {};
    }
};

// Utility Helper: Secure Data Serialization Write
const writeDatabase = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Database persistence breakdown fault:", error);
    }
};
app.post('/api/auth/verify', (req, res) => {
    const { pin } = req.body;

    if (!pin) {
        return res.status(400).json({ success: false, message: "PIN parameter validation missing." });
    }

    // Direct match check string evaluation logic
    if (pin === SERVER_MASTER_PIN) {
        return res.json({ success: true, message: "Access granted." });
    } else {
        return res.status(401).json({ success: false, message: "Invalid system validation signature." });
    }
});
app.get('/api/diary/:date', (req, res) => {
    const { date } = req.params; // Matches 'YYYY-MM-DD' query string signatures
    const database = readDatabase();

    if (database[date]) {
        return res.json({ success: true, data: database[date] });
    } else {
        // Return structured blank container if entry space has no trace signature history
        return res.json({ success: true, data: { content: "" } });
    }
});
app.post('/api/diary/:date', (req, res) => {
    const { date } = req.params;
    const { content } = req.body;
    const database = readDatabase();

    // Check if entry string is bare/empty, if so drop key space to maximize efficiency limits
    if (!content || content.trim() === "" || content === "<br>") {
        delete database[date];
    } else {
        database[date] = {
            content: content, // Preserves bold, italic, list markers directly as formatted strings
            lastSaved: new Date().toISOString()
        };
    }

    writeDatabase(database);
    return res.json({ success: true, message: "Data synchronized cleanly to disk." });
});
app.listen(PORT, () => {
    console.log(`===========================================================`);
    console.log(` RUNNING DIARY BACKEND ENGINE CONSOLE`);
    console.log(` Target Endpoint: http://localhost:${PORT}`);
    console.log(` Database File Workspace Allocation: ${DB_FILE}`);
    console.log(`===========================================================`);
});