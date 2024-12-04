import mongoose from "mongoose";
import { randomBytes } from "crypto";

async function startServer(app: any, port: any) {
  const uri: string = process.env.DB_URI as string;

  await mongoose
    .connect(uri, {
      dbName: "MIL-AUTH-API",
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error: any) => console.log(error));

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

export default startServer;
