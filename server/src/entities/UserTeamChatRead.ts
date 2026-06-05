import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "./User.ts";
import { Team } from "./Team.ts";

@Entity('user_team_chat_read')
@Index(["user", "team"], { unique: true })
export class UserTeamChatRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_read_at!: Date;
}
