import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('runs')
export class Run {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: string; // Internal UUID from lightning_tune

  @Column()
  modelRepoId: string;

  @Column()
  status: string; // running, completed, failed

  @Column({ nullable: true })
  hfHubId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
