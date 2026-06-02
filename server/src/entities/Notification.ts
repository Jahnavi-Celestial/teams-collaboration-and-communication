import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User.ts';
import { Team } from './Team.ts';
import { Task } from './Task.ts';

export enum NotificationType {
  TEAM_JOINED = 'TEAM_JOINED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DEADLINE_MISSED = 'TASK_DEADLINE_MISSED',
  EXTENSION_REQUESTED = 'EXTENSION_REQUESTED',
  EXTENSION_RESOLVED = 'EXTENSION_RESOLVED'
}
registerEnumType(NotificationType, { name: 'NotificationType' });

@ObjectType()
@Entity('notifications')
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Field(() => NotificationType)
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Field(()=>String, {nullable: false})
  @Column({type: "varchar", length:225, nullable: false})
  title!: string;

  @Field(()=>String,{ nullable: true })
  @Column({ type: 'text', nullable: true })
  body!: string;

  @Field(()=>String)
  @Column({type:'boolean', default: false })
  is_read!: boolean;

  @Field(()=>Date)
  @CreateDateColumn({type: 'timestamptz'})
  created_at!: Date;

  @Field(()=>Team, {nullable:true})
  @ManyToOne(()=>Team, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'team_id'})
  team?:Team;
  
  @Field(()=>Task, {nullable: true})
  @ManyToOne(()=>Task, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'task_id'})
  task?: Task;
}