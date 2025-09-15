# STUDENT_FEEDBACK_SYSTEM
The Student Course Feedback Portal is a full-stack web app where students can sign up, log in, manage profiles, and submit course feedback. Admins can view analytics, manage users and courses, and monitor instructor performance and student satisfaction.

Instructions to Run My Project


Clone or fork the repository.


Open the terminal and navigate to the backend folder:
cd Back-Endd


Install the dependencies:
npm install


Create an account in MongoDB Atlas and create a new cluster.


Copy the MongoDB connection string from your cluster and paste it into the .env file as the value for MONGODB_URL.


Generate a secret key for JWT by running the following command in the terminal:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"


Copy the generated string and paste it as the value for JWT_SECRET in the .env file.


Start the backend server by running:
node server.js


For the frontend, open the index.html file in a browser to run the application