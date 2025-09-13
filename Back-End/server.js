const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const validator = require("validator");
dotenv.config();
let database;
class Feedback_Database {
    constructor(uri) {
        this.client = null;
        this.uri = uri;
    }

    async connectToDatabase() {
        if (this.client) {
            return this.client;
        }

        try {
            const client = new MongoClient(this.uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });
            await client.connect();
            this.client = client;
            this.database = this.client.db('StudentfeedbackSystem');
            await this.database.collection('Student').createIndex({ "std_email": 1 }, { unique: true });
            await this.database.collection('Admin').createIndex({ "ad_email": 1 }, { unique: true });
            console.log("Successfully connected to MongoDB Atlas!");
            return this.client;

        } catch (err) {
            console.error("Failed to connect to MongoDB", err);
            throw err;
        }
    }

    async closeConnection() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            console.log("MongoDB connection closed.");
        }
    }
    async Insert_Student(user_name, password, email) {
        try {
            if (!validator.isEmail(email)) {
                console.error("Error: The provided email is not valid.");
                throw new Error("Invalid email format.");
            }
            if (!validator.isStrongPassword(password, {
                minLength: 8,
                minNumbers: 1,
                minSymbols: 1,
                minLowercase: 0,
                minUppercase: 0
            })) {
                throw new Error("Password must be at least 8 characters long and contain at least 1 number and 1 special character.");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await this.database.collection('Student').insertOne({
                std_name: user_name,
                std_email: email,
                password: hashedPassword
            });
        }
        catch (error) {
            if (error.code == 11000) {
                console.error("Error: A user with this name/email already exists.");
            } else {
                console.error("An unexpected error occurred during insertion:", error);
            }
            throw error;
        }
    }
    async Insert_Admin(user_name, password, email) {
        try {
            if (!validator.isEmail(email)) {
                console.error("Error: The provided email is not valid.");
                throw new Error("Invalid email format.");
            }
            if (!validator.isStrongPassword(password, {
                minLength: 8,
                minNumbers: 1,
                minSymbols: 1,
                minLowercase: 0,
                minUppercase: 0
            })) {
                throw new Error("Password must be at least 8 characters long and contain at least 1 number and 1 special character.");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await this.database.collection('Admin').insertOne({
                ad_name: user_name,
                ad_email: email,
                password: hashedPassword
            });
            return result.insertedId;
        }
        catch (error) {
            if (error.code == 11000) {
                console.error("Error: A user with this name/email already exists.");
            } else {
                console.error("An unexpected error occurred during insertion:", error);
            }
            throw error;
        }
    }
    async Student_Login_check(email,password) {
        try {
            const user = await this.database.collection('Student').findOne({ std_email: email });
            if (!user) {
                console.error("User not found.");
                return { success: false, message: "Invalid email or password." };
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                console.log("Login successful for user:", user.std_email);
                return { success: true, message: "Login successful.", user: user };
            } else {
                console.error("Incorrect password for user:", user.std_email);
                return { success: false, message: "Invalid email or password." };
            }
        }
        catch (error) {
            console.error("An unexpected error occurred during the check:", error);
            throw error;
        }
    }
    async Admin_Login_check(email,password) {
        try {
            const user = await this.database.collection('Admin').findOne({ ad_email: email });
            if (!user) {
                console.error("User not found.");
                return { success: false, message: "Invalid email or password." };
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                console.log("Login successful for user:", user.std_email);
                return { success: true, message: "Login successful.", user: user };
            } else {
                console.error("Incorrect password for user:", user.std_email);
                return { success: false, message: "Invalid email or password." };
            }
        }
        catch (error) {
            console.error("An unexpected error occurred during the check:", error);
            throw error;
        }
    }
    async Insert_Courses(adminId, course) {
        try {
            await this.database.collection('Course').insertOne({
                course: course,
                ad_id: adminId,
            });
        }
        catch (error) {
            console.error("An unexpected error occurred during insertion:", error);
            throw error;
        }
    }
}
(async () => {
    const db = new Feedback_Database(process.env.MONGODB_URL);
    await db.connectToDatabase();
    // await db.Insert_Student("Mahan", "abcdefgh1@", "mahanshetty488@gmail.com");
    // const adm_id = await db.Insert_Admin("MAHANJ", "abcdefgh1@", "mahanshetty488@gmail.com");
    // await db.Insert_Courses(adm_id, "Math");
    // const stdlogin=await db.Student_Login_check("mahanshetty488@gmail.com","abcdefgh1@");
    // console.log(stdlogin);
    const adlogin=await db.Admin_Login_check("mahanshetty488@gmail.com","abcdefgh1@");
    console.log(adlogin);
    await db.closeConnection();
})();
module.exports = { Feedback_Database };