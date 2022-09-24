import { NextFunction, Request, Response } from "express";
import { JWTTokenPayloadModel } from "../models/jwtTokenPayload.model";
import jwt from "jsonwebtoken";
import User from "../schema/user";
import { ContextModel } from "../models/context.model";
import { isAdmin, isAdvisor, isPanel, isStudent } from "../enums/roles.enum";
import { ContractModel } from "../models/contract.model";
import Panel from "../schema/panel";

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const token: string | null = getToken(req);
        if(!token){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const payload: JWTTokenPayloadModel = jwt.verify(token, process.env.SECRET_KEY as string) as JWTTokenPayloadModel;
        const result = await User.findById(payload.id);        
        if(!result){
            return res.status(404).json({
                message: "User does not exist!",
            })
        }
        
        req.context  = getContext(result);
        return next();
    }catch(error){
        return res.status(500).json({
            message: "Internal Server Error!"
        })
    }
}

export const isAdminAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const token: string | null = getToken(req);
        if(!token){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const payload: JWTTokenPayloadModel = jwt.verify(token, process.env.SECRET_KEY as string) as JWTTokenPayloadModel;
        if(!isAdmin(payload.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const result = await User.findById(payload.id);        
        if(!result){
            return res.status(404).json({
                message: "User does not exist!",
            })
        }

        if(!isAdmin(result.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }
        
        req.context  = getContext(result);
        return next();
    }catch(error){
        console.log(error)
        return res.status(500).json({
            message: "Internal Server Error!"
        })
    }
}

export const isStudentAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const token: string | null = getToken(req);
        if(!token){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const payload: JWTTokenPayloadModel = jwt.verify(token, process.env.SECRET_KEY as string) as JWTTokenPayloadModel;
        if(!isStudent(payload.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const result = await User.findById(payload.id);        
        if(!result){
            return res.status(404).json({
                message: "User does not exist!",
            })
        }

        if(!isStudent(result.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        req.context  = getContext(result);
        return next();
    }catch(error){
        return res.status(500).json({
            message: "Internal Server Error!"
        })
    }
}

export const isAdvisorAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const token: string | null = getToken(req);
        if(!token){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const payload: JWTTokenPayloadModel = jwt.verify(token, process.env.SECRET_KEY as string) as JWTTokenPayloadModel;
        if(!isAdvisor(payload.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const result = await User.findById(payload.id);        
        if(!result){
            return res.status(404).json({
                message: "User does not exist!",
            })
        }

        if(!isAdvisor(result.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        req.context  = getContext(result);
        return next();
    }catch(error){
        return res.status(500).json({
            message: "Internal Server Error!"
        })
    }
}

export const isPanelAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const token: string | null = getToken(req);
        if(!token){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const payload: JWTTokenPayloadModel = jwt.verify(token, process.env.SECRET_KEY as string) as JWTTokenPayloadModel;
        if(!isPanel(payload.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        const result = await User.findById(payload.id);        
        if(!result){
            return res.status(404).json({
                message: "User does not exist!",
            })
        }

        if(!isPanel(result.role)){
            return res.status(401).json({
                message: "Unauthorized Access!"
            })
        }

        req.context  = getContext(result);
        return next();
    }catch(error){
        return res.status(500).json({
            message: "Internal Server Error!"
        })
    }
}

export const isInPanel = async (req: Request, res: Response, next: NextFunction) =>{
    try{
        const context = req.context;
        const contract = req.body.contract;
        
        const panel = await Panel.findById(contract.panel).lean();
        if(!panel){
            return res.status(400).json({
                status: false,
                message: 'Panel does not exist!'
            })
        }

        let inPanel = false;
        for(const id of panel.members){
            if(context.user._id.toString() === id.toString()){
                inPanel = true;
            }
        }
        if(!inPanel){
            return res.status(400).json({
                status: false,
                message: 'You are not in that panel!'
            })
        }

        return next();
    }catch(error){
        return res.status(500).json({
            status: false,
            message: "Internal server error!"
        })
    }
}

const getToken = (req: Request): string | null => {
    const token = req.headers.authorization?.split(" ") 
    if (token && token[0] === "Bearer") {
      return token[1];
    } 
    return null;
}

const getContext = (user: any): ContextModel => {
    return {
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department !== undefined ? user.department : null,
            ID: user.ID !== undefined ? user.ID : null
        }
    } as const
}