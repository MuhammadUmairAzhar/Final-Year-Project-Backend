import { Request, Response, NextFunction } from "express";
import {
  AllAdvisors,
  Signin,
  Signup,
  SelectAdvisor,
  CloseAdvisorRequest,
  AllAdvisorsRequest,
  AdvisorRequest,
  SubmitAdvisorForm,
  AdvisorForm,
  AssignedPanelDetails,
  GetLogform,
} from "../services/student";

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

export const getAdvisors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return AllAdvisors(res);
};

export const postSelectAdvisor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return SelectAdvisor(req.body.contract, req.context, res);
};

export const postCloseAdvisorRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return CloseAdvisorRequest(req.body.contract, res);
};

export const getAllAdvisorsRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return AllAdvisorsRequest(
    req.query.acceptance_status as string,
    req.context,
    res
  );
};

export const getAdvisorRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return AdvisorRequest(req.params.id as string, res);
};

export const postSubmitAdvisorForm = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return SubmitAdvisorForm(req.body.contract, res);
};

export const getAdvisorForm = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return AdvisorForm(req.params.id as string, res);
};

export const getAssignedPanelDetails = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return AssignedPanelDetails(req.params.id as string, res);
};

export const getTasks = (req: Request, res: Response, next: NextFunction) => {
  return GetLogform(req.params.id, res);
};
