import { Router } from "express";
import {
    login,
    oauthLogin,
    register,
    setPassword,
    getUser,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/oauth", oauthLogin);
router.post("/set-password", setPassword);
router.get("/user", getUser);

export default router;
