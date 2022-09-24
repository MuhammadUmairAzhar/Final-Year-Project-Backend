import { Request, Response, NextFunction } from "express";
import {
  Signin,
  Signup,
  PanelMidMarks,
  PanelFinalMarks,
  AssignedPanelDetails
} from "../services/panel";

export const checkReachable = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return res.status(200).json({ message: "Student APIs reachabled" });
};

export const postSignup = (req: Request, res: Response, next: NextFunction) => {
  return Signup(req.body.user, res);
};

export const postSignin = (req: Request, res: Response, next: NextFunction) => {
  return Signin(req.body.user, res);
};

export const getAssignedPanelDetails = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return AssignedPanelDetails(req.context, res);
};

export const postPanelMidMarks = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return PanelMidMarks(req.context, req.body.contract, res);
};

export const postPanelFinalMarks = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return PanelFinalMarks(req.context, req.body.contract, res);
};
