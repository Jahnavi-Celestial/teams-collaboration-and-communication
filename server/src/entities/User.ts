import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany} from "typeorm";
import {TeamMember} from "./TeamMember.ts";
import {Task} from "./Task.ts";
import { Field, ID, ObjectType } from "type-graphql";
import { Message } from "./Message.ts";

@ObjectType()
@Entity('users')
export class User{
    @Field(()=>ID)
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Field(()=>String)
    @Column({type: 'varchar', length: 100})
    name!: string;

    @Field(()=>String)
    @Column({type: 'varchar', length: 255, unique: true})
    email!: string;

    @Field(()=>String, {nullable: true})
    @Column({type: 'varchar', length: 255, nullable: true})
    password_hash!: string;

    @Field(()=>String, {nullable: true})
    @Column({type: 'varchar', length: 500, nullable: true, unique: true})
    google_id!: string

    @Field(()=>String, {nullable: true})
    @Column({type: 'varchar', length: 500, nullable: true})
    avatar_url!: string;

    @Field(()=>[TeamMember])
    @OneToMany(()=>TeamMember, (member)=>member.user)
    team_memberships!: TeamMember[];

    @Field(()=>[Task])
    @OneToMany(()=>Task, (task)=>task.assigned_to)
    assigned_tasks!: Task[];

    @Field(()=>[Message])
    @OneToMany(()=>Message, (message)=>message.sender)
    messages!: Message[];

    @Field(()=>Date)
    @CreateDateColumn({type: 'timestamptz'})
    created_at!: Date;

    @Field(()=>Date)
    @UpdateDateColumn({type: 'timestamptz'})
    updated_at!: Date;
}