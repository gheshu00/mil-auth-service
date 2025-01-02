import { MongoClient } from "mongodb";

let cachedClient: MongoClient | null = null;

/**
 * Establishes a connection to the MongoDB database and reuses the connection for future calls.
 */
export const connectDB = async (): Promise<MongoClient> => {
    if (!cachedClient) {
        // Initialize the MongoDB client only once.
        const client = new MongoClient(process.env.DB_URI as string, {
            // Options to optimize performance (use pooling, etc.)
            maxPoolSize: 10, // Adjust as per your application's load.
        });

        try {
            await client.connect();
            cachedClient = client;
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw error;
        }
    }

    return cachedClient;
};

export default connectDB;

// import { MongoClient } from 'mongodb';

// let cachedClient: MongoClient | null = null;

// export const connectDB = async (): Promise<MongoClient> => {
//     if (cachedClient) {
//         try {
//             // Check if the client is still connected
//             await cachedClient.db().admin().ping();
//             return cachedClient;
//         } catch (error) {
//             // If ping fails, create a new client
//             cachedClient = null;
//         }
//     }

//     const client = new MongoClient(process.env.DB_URI as string);
//     await client.connect();
//     cachedClient = client;
//     return client;
// };

// export default connectDB;