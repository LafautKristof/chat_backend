import { Request, Response } from "express";
import * as authService from "../services/authService";

export async function register(req: Request, res: Response) {
    try {
        const user = await authService.register(req.body);

        res.json(user);
    } catch (error) {
        res.status(400).send(error);
    }
}

export async function login(req: Request, res: Response) {
    try {
        const user = await authService.login(req.body);
        res.json(user);
    } catch (error) {
        res.status(400).send(error);
    }
}

export async function oauthLogin(req: Request, res: Response) {
    try {
        const user = await authService.oauthLogin(req.body);
        res.json(user);
    } catch (error) {
        res.status(400).send(error);
    }
}

export async function setPassword(req: Request, res: Response) {
    try {
        const user = await authService.setPassword(req.body);
        res.json(user);
    } catch (error) {
        res.status(400).send(error);
    }
}

export async function getUser(req: Request, res: Response) {
    try {
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }
        const user = await authService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error: any) {
        console.error("❌ getUser failed:", error.message, error);
        res.status(500).json({ error: "Server Error", detail: error.message });
    }
}
