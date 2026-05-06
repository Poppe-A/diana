import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByEmail(email: string, withPassword = false): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: withPassword,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  create(partial: Pick<User, 'email' | 'password'>): Promise<User> {
    return this.userRepository.save(this.userRepository.create(partial));
  }
}
