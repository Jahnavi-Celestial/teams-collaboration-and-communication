import { AuthChecker } from "type-graphql";
import jwt from "jsonwebtoken";
import {Request, Response} from "express";
import { Server } from "socket.io";

export interface MyContext{
    req: Request;
    res: Response;
    io: Server;
    user?: {
        userId: string,
        email: string,
    }
}

export const authChecker: AuthChecker<MyContext> = ({context}) => {
    const ctx = context as any
    const token = ctx.req.headers.authorization?.split(" ")[1];

    if(!token) return false;

    try{
        const decoded = jwt.verify(token, String(process.env.JWT_SECRET)) as any;
        ctx.user = decoded

        return true;
    }
    catch(err: any){
        console.log("error in authorization", err.message)
        return false
    }
}