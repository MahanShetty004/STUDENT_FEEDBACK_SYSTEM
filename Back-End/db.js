const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
            await this.database.collection('Feedback').createIndex(
                { std_id: 1, course_id: 1 },
                { unique: true }
            );
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
            const result = await this.database.collection('Student').insertOne({
                std_name: user_name,
                std_email: email,
                password: hashedPassword,
                std_phoneno: "",
                DOB: "",
                Address: "",
            });
            return result.insertedId;
        }
        catch (error) {
            if (error.code == 11000) {
                throw new Error("Error: A user with this name/email already exists.");
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
    async Student_Login_check(email, password) {
        try {
            const user = await this.database.collection('Student').findOne({ std_email: email });
            if (!user) {
                console.error("User not found.");
                throw new Error( "Invalid email or password." );
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                console.log("Login successful for user:", user.std_email);
                return { success: true, message: "Login successful.", user: user };
            } else {
                console.error("Incorrect password for user:", user.std_email);
                throw new Error( "Invalid email or password." );
            }
        }
        catch (error) {
            console.error("An unexpected error occurred during the check:", error);
            throw error;
        }
    }
    async Admin_Login_check(email, password) {
        try {
            const user = await this.database.collection('Admin').findOne({ ad_email: email });
            if (!user) {
                console.error("User not found.");
                throw new Error("Invalid email or password." );
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                console.log("Login successful for user:", user.ad_email);
                return { success: true, message: "Login successful.", user: user };
            } else {
                console.error("Incorrect password for user:", user.ad_email);
                throw new Error("Invalid email or password." );
            }
        }
        catch (error) {
            console.error("An unexpected error occurred during the check:", error);
            throw error;
        }
    }
    async Insert_Courses(adminId, course) {
        try {
            if (!ObjectId.isValid(adminId)) {
                console.error("Error: The provided Admin ID is not a valid ObjectId.");
                throw new Error("Invalid Admin ID.");
            }
            const result = await this.database.collection('Course').insertOne({
                course: course,
                ad_id: adminId,
            });
            return result.insertedId;
        }
        catch (error) {
            console.error("An unexpected error occurred during insertion:", error);
            throw error;
        }
    }
    async Delete_Course(courseId) {
        try {
            if (!ObjectId.isValid(courseId)) {
                console.error("Error: The provided course ID is not a valid ObjectId.");
                throw new Error("Invalid course ID.");
            }
            const filter = { _id: new ObjectId(courseId) };
            const result = await this.database.collection('Course').deleteOne(filter);

            if (result.deletedCount === 1) {
                console.log(`Successfully deleted the course with ID: ${courseId}`);
                return { success: true, message: `Course ${courseId} deleted.` };
            } else {
                console.log(`No course found with ID: ${courseId}`);
                return { success: false, message: `No course found with ID: ${courseId}.` };
            }
        }
        catch (error) {
            console.error("An unexpected error occurred during deletion:", error);
            throw error;
        }
    }
    async Insert_Feedback(Student_id, course_id, rating, message) {
        try {
            if (!ObjectId.isValid(Student_id)) {
                console.error("Error: The provided Student ID is not a valid ObjectId.");
                throw new Error("Invalid Student ID.");
            }
            if (!ObjectId.isValid(course_id)) {
                console.error("Error: The provided course ID is not a valid ObjectId.");
                throw new Error("Invalid course ID.");
            }
            const filter = { _id: new ObjectId(course_id) };
            const admin = await this.database.collection('Course').findOne(filter);
            if (!admin) {
                throw new Error("Course not found.");
            }
            const blk = await this.database.collection('Block_user').findOne({ std_id: Student_id, ad_id: admin.ad_id });
            console.log(blk);
            if (blk)
                throw new Error("The Student has been Blocked by the user");
            if (typeof rating !== 'number' || rating < 1 || rating > 5) {
                throw new Error("Rating must be a number between 1 and 5.");
            }
            if (typeof message !== 'string' || message.trim().length === 0) {
                throw new Error("Feedback message cannot be empty.");
            }
            const result = await this.database.collection('Feedback').insertOne({
                std_id: Student_id,
                course_id: course_id,
                rating: rating,
                comment: message
            });
            return result.insertedId;
        }
        catch (error) {
            if (error.code === 11000) {
                console.error("Error: Feedback alredy given");
            }
            else {
                console.error("An unexpected error occurred during insertion:", error);
            }
            throw error;
        }
    }
    async Delete_Student_Feedback(std_feedback) {
        try {
            if (!ObjectId.isValid(std_feedback)) {
                console.error("Error: The provided Feedback ID is not a valid ObjectId.");
                throw new Error("Invalid Feedback ID.");
            }
            const filter = { _id: new ObjectId(std_feedback) };
            const result = await this.database.collection('Feedback').deleteOne(filter);

            if (result.deletedCount === 1) {
                console.log(`Successfully deleted the Feedback  with ID: ${std_feedback}`);
                return { success: true, message: `Feedback  ${std_feedback} deleted.` };
            } else {
                console.log(`No course found with ID: ${std_feedback}`);
                return { success: false, message: `No Feedback  found with ID: ${std_feedback}.` };
            }
        }
        catch (error) {
            console.error("An unexpected error occurred during deletion:", error);
        }
    }
    async Edit_Student_Feedback(std_feedback, rating, message) {
        try {
            if (!ObjectId.isValid(std_feedback)) {
                console.error("Error: The provided Feedback ID is not a valid ObjectId.");
                throw new Error("Invalid Feedback ID.");
            }
            const filter = { _id: new ObjectId(std_feedback) };
            const result = await this.database.collection('Feedback').updateOne(filter, {
                $set: {
                    rating: rating,
                    comment: message,
                },
            });
            if (result.modifiedCount === 1) {
                console.log(`Successfully updated feedback with ID: ${std_feedback}`);
                return { success: true, message: "Feedback updated." };
            } else {
                console.log(`No feedback found with ID: ${std_feedback} or no changes were made.`);
                return { success: false, message: "Feedback not updated." };
            }
        }
        catch (error) {
            console.error("An unexpected error occurred during editing:", error);
            throw error
        }
    }
    async GetAdminDrivenFilteredFeedback(adminId, courseId, studentId, rating) {
        try {
            if (!ObjectId.isValid(adminId)) {
                throw new Error("Invalid admin ID.");
            }
            const filter = {};
            let targetCourseIds = [];
            if (courseId) {
                if (!ObjectId.isValid(courseId)) {
                    throw new Error("Invalid course ID.");
                }
                const course = await this.database.collection('Course').findOne({
                    _id: new ObjectId(courseId),
                    ad_id: new ObjectId(adminId)
                });
                if (!course) {
                    return [];
                }
                targetCourseIds = [new ObjectId(courseId)];
            } else {
                const courses = await this.database.collection('Course').find({ ad_id: new ObjectId(adminId) }, { _id: 1 }).toArray();
                targetCourseIds = courses.map(c => c._id);
            }
            if (targetCourseIds.length === 0) {
                return [];
            }
            filter.course_id = { $in: targetCourseIds };
            if (studentId) {
                if (!ObjectId.isValid(studentId)) {
                    throw new Error("Invalid student ID.");
                }
                filter.std_id = new ObjectId(studentId);
            }
            if (rating) {
                filter.rating = parseInt(rating);
            }
            const result = await this.database.collection('Feedback').find(filter).toArray();
            return result;
        } catch (error) {
            console.error("An unexpected error occurred during filtered feedback retrieval:", error);
            throw error;
        }
    }
    async GetStudentFilteredFeedback(studentId, rating) {
        try {
            if (!ObjectId.isValid(studentId)) {
                throw new Error("Invalid student ID.");
            }
            const filter = {
                std_id: new ObjectId(studentId)
            };
            if (rating) {
                filter.rating = parseInt(rating);
            }
            const result = await this.database.collection('Feedback').find(filter).toArray();
            return result;
        } catch (error) {
            console.error("An unexpected error occurred during filtered feedback retrieval:", error);
            throw error;
        }
    }
    async SetStudentphonenum(stdid, phno) {
        try {
            if (!ObjectId.isValid(stdid)) {
                throw new Error("Invalid student ID.");
            }
            const filter = {
                _id: new ObjectId(stdid)
            };

            if (!validator.isMobilePhone(phno, 'any')) {
                throw new Error("Invalid phone number format.");
            }
            const result = await this.database.collection('Student').updateOne(filter, { $set: { std_phoneno: phno } });
            if (result.matchedCount === 0) {
                throw new Error("Student not found.");
            }
            return { message: "Phone number updated successfully." };
        } catch (error) {
            throw error;
        }
    }
    async SetStudentDOB(stdid, dob) {
        try {
            if (!ObjectId.isValid(stdid)) {
                throw new Error("Invalid student ID.");
            }
            const filter = {
                _id: new ObjectId(stdid)
            };
            if (!validator.isDate(dob)) {
                throw new Error("Invalid date of birth format. Please use YYYY-MM-DD.");
            }

            const result = await this.database.collection('Student').updateOne(filter, { $set: { DOB: dob } });

            if (result.matchedCount === 0) {
                throw new Error("Student not found.");
            }

            return { message: "Date of birth updated successfully." };
        } catch (error) {
            throw error;
        }
    }
    async SetStudentAddress(stdid, address) {
        try {
            if (!ObjectId.isValid(stdid)) {
                throw new Error("Invalid student ID.");
            }
            const filter = {
                _id: new ObjectId(stdid)
            };

            const result = await this.database.collection('Student').updateOne(filter, { $set: { Address: address } });

            if (result.matchedCount === 0) {
                throw new Error("Student not found.");
            }

            return { message: "Address updated successfully." };
        } catch (error) {
            throw error;
        }
    }
    async SetPassword(std_id, oldpassword, newpassword) {
        try {
            if (!ObjectId.isValid(std_id)) {
                throw new Error("Invalid student ID.");
            }
            const filter = {
                _id: new ObjectId(std_id)
            };
            const user = await this.database.collection('Student').findOne(filter);
            if (!user) {
                throw new Error("Student not found.");
            }
            const passwordMatch = await bcrypt.compare(oldpassword, user.password);
            if (!passwordMatch) {
                throw new Error("Incorrect current password.");
            }
            if (!validator.isStrongPassword(newpassword, {
                minLength: 8,
                minNumbers: 1,
                minSymbols: 1,
                minLowercase: 0,
                minUppercase: 0
            })) {
                throw new Error("Password must be at least 8 characters long and contain at least 1 number and 1 special character.");
            }
            const hashedPassword = await bcrypt.hash(newpassword, 10);
            const result = await this.database.collection('Student').updateOne(filter, {
                $set: {
                    password: hashedPassword
                }
            });
            if (result.matchedCount === 0) {
                throw new Error("Password update failed. Document not found.");
            }
            return {
                message: "Password updated successfully."
            };
        } catch (error) {
            console.error("Error updating password:", error.message);
            throw error;
        }
    }
    async BlockUser(adid, stdid) {
        try {
            if (!ObjectId.isValid(stdid)) {
                throw new Error("Invalid student ID.");
            }
            if (!ObjectId.isValid(adid)) {
                throw new Error("Invalid Admin ID.");
            }
            await this.database.collection('Block_user').insertOne({
                std_id: stdid,
                ad_id: adid
            });
        }
        catch (error) {
            console.error("Error while inserting", error);
            throw error;
        }
    }
    async RemoveBlockUser(adid, stdid) {
        try {
            if (!ObjectId.isValid(stdid)) {
                throw new Error("Invalid student ID.");
            }
            if (!ObjectId.isValid(adid)) {
                throw new Error("Invalid Admin ID.");
            }
            const studentObjectId = new ObjectId(stdid);
            const adminObjectId = new ObjectId(adid);
            const result = await this.database.collection('Block_user').deleteOne({
                std_id: studentObjectId,
                ad_id: adminObjectId
            });
            if (result.deletedCount === 0) {
                throw new Error("Block record not found. User may not be blocked by this admin.");
            }
            return { message: "User unblocked successfully." };
        }
        catch (error) {
            console.error("Error while delting", error);
            throw error;
        }
    }
}
// (async () => {
//     const db = new Feedback_Database(process.env.MONGODB_URL);
//     await db.connectToDatabase();
//     const st_id = await db.Insert_Student("Mahan", "abcdefgh1@", "mahanshetty488@gmail.com");
//     const adm_id = await db.Insert_Admin("MAHANJ", "abcdefgh1@", "mahanshetty488@gmail.com");
//     const adm_id2 = await db.Insert_Admin("MAHANJ", "abcdefgh1@", "mahanshetty88@gmail.com");
//     const c_id = await db.Insert_Courses(adm_id, "Math");
//     const c_id2 = await db.Insert_Courses(adm_id, "Science");
//     const c_id22 = await db.Insert_Courses(adm_id2, "Dsa");
//     const stdlogin = await db.Student_Login_check("mahanshetty488@gmail.com", "abcdefgh1@");
//     console.log(stdlogin);
//     const adlogin = await db.Admin_Login_check("mahanshetty488@gmail.com", "abcdefgh1@");
//     console.log(adlogin);
//     const deletedcourses=await db.Delete_Course('68c5abcd803a4b1a29fcab6b');
//     console.log(deletedcourses);
//     const fed1 = await db.Insert_Feedback(st_id, c_id, 4, "Great course");
//     const fed2 = await db.Insert_Feedback(st_id, c_id2, 5, "Great course");
//     await db.Delete_Student_Feedback(fed1);
//     await db.Edit_Student_Feedback(fed2,2,"Not Good");
//     const feed_back = await db.GetAdminDrivenFilteredFeedback(adm_id2,null,null, null);
//     console.log(feed_back);
//     const std_feed_back=await db.GetStudentFilteredFeedback(st_id,null);
//     console.log(std_feed_back);
//     const uphone = await db.SetStudentphonenum(st_id, '6363647815');
//     const uDOB = await db.SetStudentDOB(st_id, '2004-08-16');
//     const uAdress = await db.SetStudentAddress(st_id, '#31 4th cross bapuji Layout');
//     const password=await db.SetPassword('68c68e03a8778a92b12199fa',"bbcdefgh1@","cbcdefgh1@");
//     await db.BlockUser(adm_id2, st_id);
//     const fed3 = await db.Insert_Feedback(st_id, c_id22, 3, "Okay");
//     const remblock=await db.RemoveBlockUser('68c6a2aec2fbf4ce31a30102','68c6a2aec2fbf4ce31a30101');
//     console.log(remblock);
//     await db.closeConnection();
// })();
module.exports = { Feedback_Database };