import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timestamp: string; // ISO String

  @Column()
  type: string; // 'INFO', 'WARNING', 'ERROR', 'SUCCESS'

  @Column()
  message: string;

  @Column({ nullable: true })
  action: string; // e.g. 'training_started', 'serving_started', 'inference_retry'

  @Column({ nullable: true })
  metadata: string; // JSON string for extra context

  @CreateDateColumn()
  createdAt: Date;
}
