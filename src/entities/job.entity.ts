import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('job')
export class JobEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 10 })
  job: string;

  @OneToMany((type) => UserEntity, (userEntity) => userEntity.job)
  userEntities: UserEntity[];
}
