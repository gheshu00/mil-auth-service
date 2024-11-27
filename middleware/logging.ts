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
  const token = process.env.SHARED_TOKEN as string;
  console.log(token);
  try {
    const response = await fetch(
      `${process.env.LOGGING_SERVICE_URL}/api/logs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": token,
        },
        body: JSON.stringify(logData),
      }
    );
    const jsonResponse = await response.json(); // Await the JSON response
    console.log("Log sent successfully:", jsonResponse);
  } catch (error) {
    console.error("Failed to send log to logging service:", error);
  }
}

export default loggingMiddleware;
