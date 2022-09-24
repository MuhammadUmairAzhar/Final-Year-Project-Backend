import { NextFunction, Request, Response } from "express";
import Contract from "../schema/contract";

export const isAdvisorsContract = async (req: Request, res: Response, next: NextFunction) => {
    try{
        let id: string;
        if(req && req.body && req.body.contract && req.body.contract.id){
            id = req.body.contract.id;
        }else{
            id = req.params.id
        }

        const contract = await Contract.findById(id)
        if(!contract){
            return res.status(404).json({
                success: false,
                message: "Entity does not exist!"
            })
        }
        if((contract.advisor as string).toString() !== (req.context.user._id as string).toString()){
            return res.status(401).json({
                success: false,
                message: "Unauthorized Access!"
            })
        }
        
        return next();
    }catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        })
    }
}