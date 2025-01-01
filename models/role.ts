import { connectDB } from "../utils/db";
import { ObjectId } from "mongodb";
import { z } from "zod";

export interface AppConfig {
  _id: string; 
  defaultRolesInitialized: boolean;
}

const RoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  frontendRoutes: z.array(z.string()).min(1, "At least one accessible frontend route is required"),
  backendRoutes: z.array(z.string()).min(1, "At least one accessible backend route is required"),
});

export interface Role {
  _id?: string;
  name: string;
  frontendRoutes: string[];  // For actual frontend routes
  backendRoutes: string[];   // For backend access keys (e.g., AllProducts, GetAllProducts)
  createdAt?: Date;
  updatedAt?: Date;
}

export const createRole = async (body: Role) => {
  const parsedRole = RoleSchema.parse(body);
  const { name, frontendRoutes, backendRoutes } = parsedRole;

  const client = await connectDB();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection<Role>("roles");

  const role: Role = {
    _id: new ObjectId().toHexString(),
    name,
    frontendRoutes,
    backendRoutes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await collection.insertOne(role);
};

export const createDefaultRoles = async () => {
  const client = await connectDB();
  const db = client.db(process.env.DB_NAME);
  const rolesCollection = db.collection("roles");
  const configCollection = db.collection<AppConfig>("appConfig");

  const config = await configCollection.findOne({ _id: "defaultRoles" });

  if (config?.defaultRolesInitialized) {
    console.log("Default roles already initialized.");
    return;
  }

  const defaultRoles = [
    {
      name: "admin",
      frontendRoutes: ["*"],  // Frontend routes for admin
      backendRoutes: ["*"], // Backend routes for admin
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "customer",
      frontendRoutes: ["/home", "/profile", "/orders"],  // Frontend routes for customer
      backendRoutes: ["GetUserOrders", "GetProductDetails"], // Backend routes for customer
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const role of defaultRoles) {
    const existingRole = await rolesCollection.findOne({ name: role.name });
    if (!existingRole) {
      await rolesCollection.insertOne(role);
      console.log(`Default role '${role.name}' created.`);
    } else {
      console.log(`Role '${role.name}' already exists.`);
    }
  }

  await configCollection.updateOne(
    { _id: "defaultRoles" },
    { $set: { defaultRolesInitialized: true } },
    { upsert: true }
  );

  console.log("Default roles initialization completed.");
};

export const deleteRole = async (id: string) => {
  const client = await connectDB();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection<Role>("roles");

  // Delete the role from the database
  await collection.deleteOne({ _id: id });
};

export const fetchRoleByName = async (roleName: string) => {
  const client = await connectDB();
  const db = client.db(process.env.DB_NAME);
  const rolesCollection = db.collection("roles");

  const role = await rolesCollection.findOne({ name: roleName });

  if (!role) {
    return null;
  }

  return {
    frontendRoutes: role.frontendRoutes || [],
    backendRoutes: role.backendRoutes || [],
  };
};

