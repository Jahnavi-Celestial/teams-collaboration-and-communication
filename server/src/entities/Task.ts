import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "./Team.ts";
import { User } from "./User.ts";
import { DeadlineExtensionRequest } from "./DeadLineExtensionRequest.ts";

export enum TaskStatus{
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    MISSED_DEADLINE = 'MISSED_DEADLINE'
}
registerEnumType(TaskStatus, {name: 'TaskStatus'});

@ObjectType()
@Entity('tasks')
@Index(["team"])
@Index(["assigned_to"])
export class Task{
    @Field(()=>ID)
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Field(()=>String)
    @Column({type: 'varchar', length: 255})
    subject!: string;

    @Field(()=>String)
    @Column({type: 'text'})
    description!: string;

    @Field(()=>Date)
    @Column({type: 'timestamptz'})
    deadline!: Date;
    
    @Field(()=>Team)
    @ManyToOne(()=>Team, team=>team.tasks, {onDelete: 'CASCADE'})
    team!: Team;

    @Field(()=>Date)
    @CreateDateColumn({type: 'timestamptz'})
    created_at!: Date;

    @Field(()=>User)
    @ManyToOne(()=>User, {onDelete: 'SET NULL'})
    @JoinColumn({name: 'assigned_to'})
    assigned_to!: User;

    @Field(()=>User)
    @ManyToOne(()=>User, {onDelete: 'SET NULL'})
    @JoinColumn({name: 'assigned_by'})
    assigned_by!: User;

    @Field(()=>TaskStatus, {nullable: false})
    @Column({type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING})
    status!: TaskStatus;

    @Field(()=>Boolean)
    @Column({type: 'boolean', default: false})
    deadline_unlocked!: boolean;

    @Field(()=> Date,{nullable: true})
    @Column({type: 'timestamptz', nullable: true})
    deadline_missed_at!: Date;

    @Field(()=>[DeadlineExtensionRequest])
    @OneToMany(()=>DeadlineExtensionRequest, req=>req.task)
    extension_requests!: DeadlineExtensionRequest[];
}