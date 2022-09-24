import express, { Router } from "express";
import {
  checkReachable,
  postSignup,
  postSignin,
  postPanelMidMarks,
  postPanelFinalMarks,
  getAssignedPanelDetails,
} from "../controllers/panel";
import {
  isInPanel,
  isPanelAuthenticated,
} from "../middlewares/isRoleAuthenticated";

const router: Router = express.Router();

router.get("/", checkReachable);

router.post("/signup", postSignup);

router.post("/signin", postSignin);

router.get("/panel", isPanelAuthenticated, getAssignedPanelDetails);

router.post(
  "/contract/midmarks",
  isPanelAuthenticated,
  isInPanel,
  postPanelMidMarks
);

router.post(
  "/contract/finalmarks",
  isPanelAuthenticated,
  isInPanel,
  postPanelFinalMarks
);

export default router;
