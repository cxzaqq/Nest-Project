import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('emailCheckCode')
export class EmailCheckCodeEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  email: string;

  @Column()
  code: string;

  @Column()
  check: boolean;
}
