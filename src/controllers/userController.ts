import { Request, Response } from "express";
import * as userService from "../services/userService";

export async function getUsers(req: Request, res: Response) {
    try {
        const excludeId = req.query.excludeId as string | undefined;
        const users = await userService.getUsers(excludeId);
        res.json(users);
    } catch (error) {
        res.status(400).send(error);
    }
}

export async function getUsersById(req: Request, res: Response) {
    try {
        const userId = req.params.id;
        const user = await userService.getUsersById(userId);
        res.json(user);
    } catch (error) {
        res.status(400).send(error);
    }
}

export async function searchUsers(req: Request, res: Response) {
    try {
        const { name } = req.query;
        const user = await userService.searchUsers(name as string);
        res.json(user);
    } catch (error) {
        res.status(400).send(error);
    }
}
