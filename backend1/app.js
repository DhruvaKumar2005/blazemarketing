const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_OPTIONS = "--tls-min-v1.2";


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');  
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});


app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});


app.use(express.static(path.join(__dirname, 'public')));

const uri = process.env.MONGO_URI;
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

connectDB(); 


app.use((req, res, next) => {
    if (!db) {
        return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    req.db = db;
    next();
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


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


app.get('/get-details', async (req, res) => {
    try {
        const results = await req.db.collection('form_details').find().toArray();
        res.json(results);
    } catch (error) {
        console.error('❌ Error fetching form details:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
