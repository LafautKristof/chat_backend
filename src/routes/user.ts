import { Router } from "express";
import {
    getUsers,
    getUsersById,
    searchUsers,
} from "../controllers/userController";

const router = Router();

router.get("/", getUsers);
router.get("/search", searchUsers);
router.get("/:id", getUsersById);

export default router;
