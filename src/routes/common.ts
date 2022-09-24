import express, { Router } from "express";
import { getProfile } from "../controllers/common";
import { isAuthenticated } from "../middlewares/isRoleAuthenticated";

const router: Router = express.Router();

router.get("/profile", isAuthenticated, getProfile);

export default router;
