import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.ts";
import { Team } from "./Team.ts";

export enum UserRole{
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}
registerEnumType(UserRole, {name: 'UserRole'});

@ObjectType()
@Entity('team_members')
export class TeamMember{
    @Field(()=>ID)
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Field(()=>UserRole)
    @Column({type: 'enum', enum: UserRole, default: UserRole.MEMBER})
    role!: UserRole;

    @Field(()=>Team)
    @ManyToOne(()=>Team, (team)=>team.members, {onDelete: 'CASCADE'})
    team!: Team;

    @Field(()=>User)
    @ManyToOne(()=>User, (user)=>user.team_memberships, {onDelete: 'CASCADE'})
    user!: User;
}