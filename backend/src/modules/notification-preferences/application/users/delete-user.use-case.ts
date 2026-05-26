import { Inject, Injectable } from '@nestjs/common';
import { API_ERROR } from '../../../../shared/constants';
import { ApiNotFoundException } from '../../../../shared/exceptions/api-exceptions';
import { USER_REPOSITORY } from '../../../../shared/tokens/repository.tokens';
import { UserRepositoryPort } from '../ports/users/user.repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort) {}

  public async execute(userId: string) {
   const deleted = await this.userRepository.delete(userId);
   if (!deleted) {
     throw new ApiNotFoundException(API_ERROR.USER_NOT_FOUND);
   }
  }
}
