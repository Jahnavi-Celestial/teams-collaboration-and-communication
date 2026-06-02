import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from './Task.ts';
import { User } from './User.ts';

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
registerEnumType(RequestStatus, { name: 'RequestStatus' });

@ObjectType()
@Entity('deadline_extension_requests')
export class DeadlineExtensionRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => Task)
  @ManyToOne(() => Task, (task) => task.extension_requests, { onDelete: 'CASCADE' })
  task!: Task;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  requested_by!: User;

  @Field(()=>String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  message!: string;

  @Field(() => RequestStatus)
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status!: RequestStatus;

  @Field(()=>Date)
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Field(()=>Date,{ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  resolved_at!: Date;
}