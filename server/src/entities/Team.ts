import { Field, ID, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TeamMember } from "./TeamMember.ts";
import { Task } from "./Task.ts";
import { User } from "./User.ts";

@ObjectType()
@Entity('teams')
export class Team{
    @Field(()=>ID)
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Field(()=>String)
    @Column({type: 'varchar', length: 100})
    name!: string;

    @Field(()=>String, {nullable: true})
    @Column({type:'text', nullable: true})
    description!: string;

    @Field(()=>Boolean)
    @Column({type: 'boolean', default: true})
    is_public!: boolean;

    @Field(()=>Date)
    @CreateDateColumn({type: 'timestamptz'})
    created_at!: Date;
    
    @Field(()=>Date)
    @UpdateDateColumn({type: 'timestamptz'})
    updated_at!: Date;

    @Field(()=>User)
    @ManyToOne(()=>User)
    @JoinColumn({name: 'created_by'})
    created_by!: User;

    @Field(()=>[TeamMember])
    @OneToMany(()=>TeamMember, (member)=>member.team, { cascade: true })
    members!: TeamMember[];

    @Field(()=>[Task])
    @OneToMany(()=>Task, task=>task.team)
    tasks!: Task[]
}