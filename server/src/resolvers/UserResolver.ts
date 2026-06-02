import { Resolver, Query, Mutation, Arg, Authorized, Ctx } from "type-graphql";
import { User } from "../entities/User.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { type MyContext } from "../middleware/authMiddleware.ts";
import { ILike, Not } from "typeorm";
import { AppDataSource } from "../config/db.ts";


@Resolver()
export class UserResolver {
  @Authorized()
  @Query(() => [User])
  async getAllUsers(
    @Ctx() context: MyContext,
    @Arg("searchTerm", ()=>String, {nullable: true}) searchTerm?: string,
  ){
    const userRepo = AppDataSource.getRepository(User)
    const currentUserId = context.user!.userId;

    const condition = searchTerm ? {name: ILike(`%${searchTerm}%`), id: Not(currentUserId)} : {id: Not(currentUserId)}

    const users = await userRepo.find({
      where: condition
    })
    return users
  }

  @Mutation(()=>String)
  async register(
    @Arg("name", () => String) name: string,
    @Arg("email", () => String) email: string,
    @Arg("password", () => String) password: string,
  ): Promise<string> {
      const userRepo = AppDataSource.getRepository(User);

      const isExist = await userRepo.findOne({where: {email: email}});

      if(isExist){
        throw new Error("User already exists!"); 
      }
      
      const hashPassword = await bcrypt.hash(password, 10);

      const user = await userRepo.save({name, email, password_hash: hashPassword});

      return user.email;
  }

  @Mutation(()=>String)
  async login(
    @Arg("email", ()=>String) email: string,
    @Arg("password", ()=>String) password: string
  ): Promise<string> {
      const userRepo = AppDataSource.getRepository(User);

      const isExist = await userRepo.findOne({where: {email: email}});

      if(!isExist){
        throw new Error("User not exist")
      }

      const matchPassword = await bcrypt.compare(password, isExist.password_hash)

      if(!matchPassword){
        throw new Error("Invalid Credentials")
      }

      const token = jwt.sign(
        { userId: isExist.id, email: isExist.email},
        String(process.env.JWT_SECRET),
        { expiresIn: "24h" },
      )

      return token;
  }

  @Mutation(() => String)
  async googleLogin(
    @Arg("idToken", () => String) idToken: string,
  ): Promise<string> {
    const userRepo = AppDataSource.getRepository(User);

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID || "",
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email_verified || !payload.email) {
      throw new Error("Invalid Google Account");
    }

    const { email, sub: google_id, name } = payload;

    let user = await userRepo.findOne({
      where: [{ email: email }, { google_id: google_id }],
    });

    if (!user) {
      user = userRepo.create({ name: name || "user", email, google_id });
      await userRepo.save(user);
    } else if (!user.google_id) {
      user.google_id = google_id;
      await userRepo.save(user);
    }

    const token = jwt.sign(
      { userId: user.id, email: email},
      String(process.env.JWT_SECRET),
      { expiresIn: "24h" },
    );

    return token;
  }
}