const fs = require('fs');
const axios = require('axios');

const EVENTS_FILE_PATH = 'events.jsonl';
const SERVER_URL = 'http://localhost:8000/liveEvent';
const SECRET = 'secret';

async function sendEvent(event) {
  try {
    const response = await axios.post(SERVER_URL, event, {
      headers: {
        'Authorization': `${SECRET}`
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.message);
  }
}

async function readEvents(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const events = data.split('\n').map(line => JSON.parse(line.trim()));
    for (const event of events) {
      await sendEvent(event);
    }
  } catch (error) {
    console.error('Error reading events file:', error.message);
  }
}

readEvents(EVENTS_FILE_PATH);