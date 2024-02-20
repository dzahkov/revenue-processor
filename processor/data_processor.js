const pool = require('../config/db');
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

let eventQueue = [];
const BATCH_SIZE = 1000;

async function handleEventsInBatch(pool) {
    if (eventQueue.length === 0) return;

    const eventsToProcess = eventQueue.slice(0, BATCH_SIZE);
    eventQueue = eventQueue.slice(BATCH_SIZE);

    const queries = eventsToProcess.map(eventData => {
        const {
            userId,
            name,
            value
        } = eventData;
        if (name === 'add_revenue') {
            return `UPDATE users_revenue SET revenue = revenue + ${value} WHERE userId = ${userId}`;
        } else if (name === 'subtract_revenue') {
            return `UPDATE users_revenue SET revenue = revenue - ${value} WHERE userId = ${userId}`;
        }
    });

    const batchQuery = queries.join('; ');

    try {
        await pool.query(batchQuery);
        console.log(`Processed ${eventsToProcess.length} events in batch`);
    } catch (error) {
        console.error('Error updating revenue:', error);
    }
}

async function connectAndEmitEvents() {
    try {
        await pool.connect();

        eventEmitter.on('updateRevenue', eventData => {
            eventQueue.push(eventData);
            if (eventQueue.length >= BATCH_SIZE) {
                handleEventsInBatch(pool);
            }
        });

        const events = await readEventsFromFile('events.jsonl');

        events.forEach(event => {
            eventEmitter.emit('updateRevenue', event);
        });

        if (eventQueue.length > 0) {
            await handleEventsInBatch(client);
        }
    } catch (error) {
        console.error(error);
        await pool.end();
    }
}

async function readEventsFromFile(filePath) {
    const events = [];
    const fileStream = fs.createReadStream(filePath);
    const readLine = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of readLine) {
        try {
            const eventData = JSON.parse(line);
            events.push(eventData);
        } catch (error) {
            console.error('Error parsing event:', error);
        }
    }

    return events;
}

connectAndEmitEvents();
