const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const pool = require('../config/db');

const app = express();
const PORT = 8000;
const SECRET = 'secret';
const FILE_NAME = 'events.jsonl';

app.use(bodyParser.json());
pool.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Error connecting to PostgreSQL database', err));


const authenticateRequest = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader === SECRET) {
        next();
    } else {
        res.status(403).json({
            error: 'Authorization error'
        });
    }
};

app.post('/liveEvent', authenticateRequest, (req, res) => {
    const event = req.body;
    fs.appendFile(FILE_NAME, JSON.stringify(event) + '\n', (error) => {
        if (error) {
            console.error(error);
            res.status(500).json({
                error: 'Internal server error'
            });
        } else {
            console.log('Success');
            res.status(200).json({
                message: 'Event saved successfully'
            });
        }
    });
});

app.get('/userEvents/:userId', authenticateRequest, async (req, res) => {
    const userId = req.params.userId;
    try {
        const queryText = 'SELECT * FROM user_events WHERE user_id = $1';
        const {
            rows
        } = await pool.query(queryText, [userId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }

    res.status(200).json(rows);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});