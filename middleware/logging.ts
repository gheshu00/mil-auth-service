import { Request } from "express";
import morgan from "morgan";

const loggingMiddleware = morgan((tokens, req: Request, res) => {
  const logData = {
    service: process.env.SERVICE_NAME || "unknown-service", // Unique identifier for the service
    ip: req.ip || "unknown",
    method: tokens.method(req, res) || "UNKNOWN",
    url: tokens.url(req, res) || "UNKNOWN",
    status: parseInt(tokens.status(req, res) || "0", 10),
    responseTime: parseFloat(tokens["response-time"](req, res) || "0"),
    userAgent: req.headers["user-agent"] || "UNKNOWN",
    timestamp: new Date(),
  };

  // Send log to the logging service asynchronously
  logToService(logData);

  // Optionally return log data for local console
  return `${tokens.method(req, res)} ${tokens.url(req, res)} - ${tokens.status(
    req,
    res
  )}`;
});

// Function to handle logging asynchronously
async function logToService(logData: any) {
  const token = process.env.SHARED_TOKEN || ("1234gg" as string);
  const url =
    process.env.LOGGING_SERVICE_URL || ("http://localhost:3001" as string);

  try {
    await fetch(`${url}/api/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(logData),
    });
  } catch (error: any) {
    console.error("Failed to send log to logging service:", error?.message);
  }
}

export default loggingMiddleware;
