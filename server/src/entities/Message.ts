import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Team } from './Team.ts';
import { User } from './User.ts';

@ObjectType()
@Entity('messages')
export class Message {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => Team)
  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  team!: Team;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  sender!: User;

  @Field(()=>String)
  @Column({ type: 'text' })
  content_encrypted!: string;

  @Field(()=>String, {nullable: true})
  content?: string;

  @Field(()=>String)
  @Column({ type: 'varchar', length: 64 })
  initialization_vector!: string;

  @Field(()=>Date)
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}