import { ObjectId } from "mongodb";
import { connectDB } from "../utils/db";
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

const UserSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }), // Validate email format
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }), // Validate password with a minimum length of 6
    name: z.string().optional(), // Name is optional
    role: z.string().min(1, { message: 'Role is required' }),
    isVerified: z.boolean().default(false), // isVerified defaults to false
    createdAt: z.date().optional(), // Optional timestamps
    updatedAt: z.date().optional(), // Optional timestamps
  });

export interface User {
    _id?: string; // Using UUID as the unique ID
    email: string;
    password: string;
    name?: string;
    role: string;
    isVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export const createUser = async (body: User) => {
    const parsedUser = UserSchema.parse(body);
    const {email, password, name, role} = parsedUser;

    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<User>('users');

    // Prepare the user data
    const user: User = {
        _id: new ObjectId().toHexString(),
        email,
        password,
        name,
        role,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Insert the user into the database
    await collection.insertOne(user);

    return user;
}

export const getUserByEmail = async (email: string) => {
    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<User>('users');

    return collection.findOne({ email });
}

export const getUserById = async (id: string) => {
    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<User>('users');

    return collection.findOne({ _id: id });
}

export const updateUser = async (id: string, body: Partial<User>) => {
    const parsedUser = UserSchema.partial().parse(body);
    const {email, password, name, role, isVerified} = parsedUser;

    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<User>('users');

    // Prepare the user data
    const user: Partial<User> = {
        email,
        password,
        name,
        role,
        isVerified,
        updatedAt: new Date(),
    };

    // Update the user in the database
    await collection.updateOne({ _id: id }, { $set: user });
}

export const deleteUser = async (id: string) => {
    const client = await connectDB();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection<User>('users');

    // Delete the user from the database
    await collection.deleteOne({ _id: id });
}

