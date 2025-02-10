const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://blazemarketingm.blazemarketingmedia.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const uri = 'mongodb+srv://dhruva:dhruva123@backenddb.klh5v.mongodb.net/?retryWrites=true&w=majority&appName=BackendDB';
let db;

async function connectDB() {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db('landing_page');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1); // Exit the app if the database connection fails
    }
}

connectDB(); // Connect to MongoDB

// Ensure DB is connected before processing requests
app.use((req, res, next) => {
    if (!db) {
        return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    req.db = db;
    next();
});

// Serve the main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submissions
app.post('/submit-form', async (req, res) => {
    try {
        const { name, phone, email, city, state } = req.body;

        if (!name || !phone || !email || !city || !state) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        await req.db.collection('form_details').insertOne({
            name,
            phone,
            email,
            city,
            state,
            date: new Date()
        });

        res.status(200).json({ success: true, message: 'Form submitted successfully' });
    } catch (error) {
        console.error('❌ Error inserting form data:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Retrieve submitted form details
app.get('/get-details', async (req, res) => {
    try {
        const results = await req.db.collection('form_details').find().toArray();
        res.json(results);
    } catch (error) {
        console.error('❌ Error fetching form details:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
