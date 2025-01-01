import { connectDB } from "../utils/db";
import { ObjectId } from "mongodb";
import { z } from "zod";

const BanEventSchema = z.object({
    createdAt: z.date(),
    expiresAt: z.date().optional(),
    reason: z.string().min(1, "Reason is required"),
});

const BanSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    expiresAt: z.date().optional(),
    history: z.array(BanEventSchema).nonempty("At least one ban event is required"),
});

export interface BanEvent {
    createdAt: Date;
    expiresAt?: Date;
    reason: string;
}

export interface Ban {
    _id?: string;
    userId: string;
    history: BanEvent[];
    expiresAt?: Date;
    active?: boolean;
    count?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Ban a user
export const banUser = async (body: Ban) => {
    const parsedBan = BanSchema.parse(body);
    const { userId, history, expiresAt } = parsedBan;

    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<Ban>("bans");

    const existingBan = await collection.findOne({ userId });

    if (existingBan) {
        await collection.updateOne(
            { userId },
            {
                $set: {
                    active: true,
                    history: [...existingBan.history, ...history],
                    expiresAt,
                    updatedAt: new Date(),
                },
                $inc: { count: 1 },
            }
        );
    } else {
        const ban: Ban = {
            _id: new ObjectId().toHexString(),
            userId,
            history,
            expiresAt,
            active: true,
            count: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await collection.insertOne(ban);
    }
};

// Unban a user
export const unbanUser = async (userId: string) => {
    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<Ban>("bans");

    await collection.updateOne(
        { userId, active: true },
        {
            $set: { active: false, updatedAt: new Date() },
        }
    );
};

// Scheduled Task: Update expired bans
export const updateExpiredBans = async () => {
    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<Ban>("bans");

    const now = new Date();

    // Find expired and active bans
    const expiredBans = await collection.find({
        expiresAt: { $lte: now }, // Expired bans
        active: true,            // Only active bans
    }).toArray();

    if (expiredBans.length > 0) {
        // Update active status to false for expired bans
        await collection.updateMany(
            { expiresAt: { $lte: now }, active: true },
            { $set: { active: false, updatedAt: new Date() } }
        );
        console.log(`Updated ${expiredBans.length} expired bans to inactive.`);
    } else {
        console.log("No expired bans to update.");
    }
};
