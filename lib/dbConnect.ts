import mongoose from "mongoose";

let isConnected = false; // Track the connection status

const dbConnect = async () => {
  if (isConnected) {
    console.log("MongoDB is already connected.");
    return;
  }

  try {
    // Use your database name in the connection URI
    const mongoUri = process.env.DB_URI;
    if (!mongoUri) {
      throw new Error("DB_URI is not defined in the environment variables.");
    }

    // Connect to MongoDB with the provided URI
    const connection = await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME, // Specify the database name
    });

    isConnected = connection.connection.readyState === 1; // Set the connection status
    console.log("MongoDB connected successfully to database:", process.env.DB_NAME);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; // Throw the error to prevent execution in case of failure
  }
};

export default dbConnect;
