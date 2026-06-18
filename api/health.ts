import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  return res.json({ status: "ok", timestamp: new Date().toISOString() });
}
