const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require("dotenv");
dotenv.config();

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
}


(async()=>{
    const db=new Feedback_Database(process.env.MONGODB_URL);
    await db.connectToDatabase();
    await db.closeConnection();
})();
module.exports = { Feedback_Database };