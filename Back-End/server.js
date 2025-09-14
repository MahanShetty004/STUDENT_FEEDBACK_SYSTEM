const express = require('express');
const cors = require('cors');
const { Feedback_Database } = require('./db.js');
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;
app.use(express.json());
app.use(cors());

let db;
async function startServer() {
    try {
        db = new Feedback_Database(MONGODB_URL);
        await db.connectToDatabase();
        app.post('/api/student/signup', async (req, res) => {
            try {
                const { username, email, password } = req.body;
                const insertedId = await feedbackDB.Insert_Student(username, password, email);
                res.status(201).json({
                    message: "Student account created successfully!",
                    id: insertedId
                });
            } catch (error) {
                console.error("Signup failed:", error);
                res.status(400).json({ message: error.message });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server due to database connection error.");
        process.exit(1);
    }
}

startServer();