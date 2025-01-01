import { MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;

export const connectDB = async (): Promise<MongoClient> => {
    if (cachedClient) {
        try {
            // Check if the client is still connected
            await cachedClient.db().admin().ping();
            return cachedClient;
        } catch (error) {
            // If ping fails, create a new client
            cachedClient = null;
        }
    }

    const client = new MongoClient(process.env.DB_URI as string);
    await client.connect();
    cachedClient = client;
    return client;
};

export default connectDB;