import { Request, Response, NextFunction } from 'express';  
import { Profile } from '../services/common';

const getProfile = (req: Request, res: Response, next: NextFunction) => {
    return Profile(req.context, res)
}

export {
    getProfile
}