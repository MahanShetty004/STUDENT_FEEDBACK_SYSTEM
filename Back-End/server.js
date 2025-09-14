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
let database;
async function startServer() {
    try {
        db = new Feedback_Database(MONGODB_URL);
        app.post('/api/student/signup', async (req, res) => {
            await db.connectToDatabase();
            console.log("hi");
            const { username, email, password } = req.body;
            try {
                if (!username || !email || !password) {
                    return res.status(400).json({ message: "All fields are required." });
                }
                const newStudentId = await db.Insert_Student(username, password, email);
                res.status(201).json({ 
                    message: "Student account created successfully!", 
                    id: newStudentId 
                });
            } catch (error) {
                const statusCode = error.message.includes("exists") || error.message.includes("Invalid") ? 400 : 500;
                res.status(statusCode).json({ message: error.message });
            }
        });
        app.post('/api/student/login', async (req, res) => {
            await db.connectToDatabase();
            console.log("hi");
            const {  email, password } = req.body;
            try {
                if ( !email || !password) {
                    return res.status(400).json({ message: "All fields are required." });
                }
                const ID = await db.Student_Login_check(email, password);
                res.status(201).json({ 
                    message: "Login Succesfull", 
                    id: true 
                });
            } catch (error) {
                const statusCode = error.message.includes("exists") || error.message.includes("Invalid") ? 400 : 500;
                res.status(statusCode).json({ message: error.message });
            }
        });
        app.post('/api/admin/signup', async (req, res) => {
            await db.connectToDatabase();
            console.log("hi");
            const { username, email, password } = req.body;
            try {
                if (!username || !email || !password) {
                    return res.status(400).json({ message: "All fields are required." });
                }
                const newStudentId = await db.Insert_Admin(username, password, email);
                res.status(201).json({ 
                    message: "Admin account created successfully!", 
                    id: newStudentId 
                });
            } catch (error) {
                const statusCode = error.message.includes("exists") || error.message.includes("Invalid") ? 400 : 500;
                res.status(statusCode).json({ message: error.message });
            }
        });
        app.post('/api/admin/login', async (req, res) => {
            await db.connectToDatabase();
            console.log("hi");
            const { email, password } = req.body;
            try {
                if ( !email || !password) {
                    return res.status(400).json({ message: "All fields are required." });
                }
                const ID = await db.Admin_Login_check(email, password);
                res.status(201).json({ 
                    message: "Login Succesfull", 
                    id: ID
                });
            } catch (error) {
                const statusCode = error.message.includes("exists") || error.message.includes("Invalid") ? 400 : 500;
                res.status(statusCode).json({ message: error.message });
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