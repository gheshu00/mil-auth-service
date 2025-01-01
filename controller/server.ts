import { createDefaultRoles } from "../models/role";
import connectDB from "../utils/db";

export async function startServer(app: any, port: any) {
    await connectDB();
    await createDefaultRoles();
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}