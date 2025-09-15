const express = require('express');
const cors = require('cors');
const { Feedback_Database } = require('./db.js');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const { ObjectId } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.");
    process.exit(1);
}

let db;

// JWT Authentication Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header is missing." });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Token is missing." });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

// Middleware to check if the user is an admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: "Forbidden: Only admins can access this resource." });
    }
    next();
};

// Student Signup
app.post('/api/student/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const newStudentId = await db.Insert_Student(username, password, email);
        const token = jwt.sign({
            id: newStudentId,
            email: email,
            role: 'student'
        }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            message: "Student account created successfully!",
            id: newStudentId,
            token: token
        });
    } catch (error) {
        const statusCode = error.message.includes("exists") || error.message.includes("Invalid") ? 400 : 500;
        res.status(statusCode).json({ message: error.message });
    }
});

// Student Login
app.post('/api/student/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const result = await db.Student_Login_check(email, password);
        if (result.success) {
            const token = jwt.sign({
                id: result.user._id.toHexString(),
                email: result.user.std_email,
                name: result.user.std_name,
                role: 'student'
            }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({
                message: "Login successful",
                token: token
            });
        } else {
            return res.status(401).json({ message: "Invalid email or password." });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "An unexpected server error occurred." });
    }
});

// Admin Signup
app.post('/api/admin/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const newAdminId = await db.Insert_Admin(username, password, email);
        const token = jwt.sign({
            id: newAdminId,
            email: email,
            role: 'Admin'
        }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            message: "Admin account created successfully!",
            id: newAdminId,
            token: token
        });
    } catch (error) {
        const statusCode = error.message.includes("exists") || error.message.includes("Invalid") ? 400 : 500;
        res.status(statusCode).json({ message: error.message });
    }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const result = await db.Admin_Login_check(email, password);
        if (result.success) {
            const token = jwt.sign({
                id: result.user._id.toHexString(),
                email: result.user.ad_email,
                role: 'Admin'
            }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({
                message: "Login successful",
                token: token
            });
        } else {
            return res.status(401).json({ message: "Invalid email or password." });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "An unexpected server error occurred." });
    }
});

// Protected route for student profile
app.get('/api/student/profile', authMiddleware, async (req, res) => {
    const result = await db.GetStudentProfile(req.user.id);
    console.log(result);
    res.status(200).json({
        message: "You have accessed a protected student route.",
        user: result
    });
});

// Protected route for admin profile
app.get('/api/admin/profile', authMiddleware, adminMiddleware, async (req, res) => {
    const st_size = await db.Getregisterstudnum();
    const fd_size = await db.Getfeddbacknum();
    let opt = {};
    opt.totalFeedbacks = fd_size;
    opt.totalStudents = st_size;
    console.log(opt);
    return res.status(200).json(opt);
});

// GET all courses for an admin
app.get('/api/fcourses', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const courses = await db.GetAdminCourses(req.user.id);
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "An unexpected error occurred while fetching courses." });
    }
});

// POST a new course
app.post('/api/acourses', authMiddleware, adminMiddleware, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Course name is required." });
    }
    try {
        await db.Insert_Courses(req.user.id, name);
        res.status(201).json({ message: "Course added successfully." });
    } catch (error) {
        console.error("Error adding course:", error);
        res.status(500).json({ message: "An unexpected error occurred while adding the course." });
    }
});

// PUT route to update a course
app.put('/api/ucourses', authMiddleware, adminMiddleware, async (req, res) => {
    const { courseId, newCourseName } = req.body;
    if (!courseId || !newCourseName) {
        return res.status(400).json({ message: "Course ID and new name are required." });
    }
    try {
        const result = await db.Update_Course(courseId, newCourseName);
        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: error.message || "An unexpected error occurred while updating the course." });
    }
});

// DELETE route to remove a course
app.delete('/api/dcourses', authMiddleware, adminMiddleware, async (req, res) => {
    const { courseId } = req.body;
    if (!courseId) {
        return res.status(400).json({ message: "Course ID is required." });
    }
    try {
        const result = await db.Delete_Course(courseId);
        if (result.success) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(404).json({ message: result.message });
        }
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: error.message || "An unexpected error occurred while deleting the course." });
    }
});
app.post('/api/student/feedbacks', authMiddleware, async (req, res) => {
    const { courseId, rating, message } = req.body;
    const studentId = req.user.id;

    if (!courseId || !rating || !message) {
        return res.status(400).json({ message: "All fields are required." });
    }
    try {
        const newFeedback = await db.Insert_Feedback(studentId, courseId, rating, message);
        res.status(201).json({
            message: "Feedback submitted successfully!",
            feedback: newFeedback
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        res.status(500).json({ message: "An unexpected error occurred." });
    }
});


// GET all feedback for the authenticated student (Student Protected)
app.get('/api/student/feedbacks/me', authMiddleware, async (req, res) => {
    const studentId = req.user.id;
    try {
        const feedbacks = await db.GetStudentFilteredFeedback(studentId);
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ message: "An unexpected error occurred." });
    }
});
app.get('/api/student/courses', authMiddleware, async (req, res) => {
    try {
        const courses = await db.GetCourses(req.user.id);
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "An unexpected error occurred while fetching courses." });
    }
});
// PUT to update a specific feedback (Student Protected, must own feedback)
app.put('/api/student/feedbacks/:id', authMiddleware, async (req, res) => {
    const feedbackId = req.params.id;
    const { rating, message } = req.body;
    const studentId = req.user.id;

    if (!rating || !message) {
        return res.status(400).json({ message: "Rating and message are required." });
    }

    try {
        const result = await db.Edit_Student_Feedback(feedbackId, rating, message);
        if (result.success) {
            res.status(200).json({ message: "Feedback updated successfully!" });
        } else {
            res.status(404).json({ message: result.message });
        }
    } catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({ message: "An unexpected error occurred." });
    }
});

// DELETE a specific feedback (Student Protected, must own feedback)
app.delete('/api/student/feedbacks/:id', authMiddleware, async (req, res) => {
    const feedbackId = req.params.id;
    const studentId = req.user.id;

    try {
        const result = await db.Delete_Student_Feedback(feedbackId);
        if (result.success) {
            res.status(200).json({ message: "Feedback deleted successfully!" });
        } else {
            res.status(404).json({ message: result.message });
        }
    } catch (error) {
        console.error("Error deleting feedback:", error);
        res.status(500).json({ message: "An unexpected error occurred." });
    }
});

app.put('/me', authMiddleware, async (req, res) => {
    const { std_name, std_phoneno, DOB, Address } = req.body;

    // Create an empty object to store only the updates that were sent
    const updates = {};
    if (std_name) updates.std_name = std_name;
    if (std_phoneno) updates.std_phoneno = std_phoneno;
    if (DOB) updates.DOB = DOB;
    if (Address) updates.Address = Address;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No fields to update.' });
    }

    try {
        const success = await db.updateUser(req.user.id, updates);
        if (!success) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
app.post('/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {

        // Basic validation to ensure both fields are present
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required.' });
        }
        const success = await db.SetPassword(req.user.id, currentPassword, newPassword);
        if (success) {
            res.status(200).json({ message: 'Password changed successfully!' });
        } else {
            res.status(500).json({ message: 'Failed to update password.' });
        }
    }
    catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'An unexpected server error occurred.' });
    }
});
app.get('/admin/students', authMiddleware, adminMiddleware, async (req, res) => {
    const id = req.user.id;
    try {
        let student = await db.BlockStatus(id);
        console.log(student);
        res.status(200).json(student);
    }
    catch (error) {
        throw error;
    }
});
app.post('/admin/block-user/:userId', async (req, res) => {
    try {
        // 1. Get the userId from the URL parameters.
        const { userId } = req.params;

        // 2. Call the dedicated function to handle the business logic.
        const updatedUser = await BlockStatus(userId);

        // 3. Send a success response with the updated user data.
        res.status(200).json({ 
            message: `User ${updatedUser.name} block status updated to ${updatedUser.isBlocked}.`,
            isBlocked: updatedUser.isBlocked 
        });
    } catch (error) {
        // Catch any errors thrown by the database function.
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
});
app.delete('/admin/delete-user/:id',authMiddleware,adminMiddleware,async(req,res)=>{
    const {id}=req.params;
    try{
       const result= await db.deleteUser(id);
       res.status(201).json(result);
    }
    catch(error)
    {
        throw error;
    }
})
app.get('/admin/courses',authMiddleware,adminMiddleware,async(req,res)=>{
    const id=req.user.id;
    try{
         const result= await db.GetCourses();
            res.status(200).json(result);
    }
    catch(error)
    {
        throw error;
    }
});
app.get('/admin/filter-feedbacks',authMiddleware,adminMiddleware,async(req,res)=>{
    const id=req.user.id;
    const{course,studentEmail,rating}=req.query;
    console.log(course,studentEmail,rating);    
    try{
         const result= await db.GetFilteredFeedback();      
            res.status(200).json(result);

    }
    catch(error)
    {
        throw error;
    }   
});
// Start the server after connecting to the database
async function startServer() {
    try {
        db = new Feedback_Database(MONGODB_URL);
        await db.connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server due to database connection error:", error);
        process.exit(1);
    }
}

startServer();