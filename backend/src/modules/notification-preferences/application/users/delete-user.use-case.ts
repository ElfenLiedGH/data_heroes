import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { API_ERROR } from '../../../../shared/constants';
import { USER_REPOSITORY } from '../../../../shared/tokens/repository.tokens';
import { UserRepositoryPort } from '../ports/users/user.repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort) {}

  public async execute(userId: string) {
   const deleted = await this.userRepository.delete(userId);
   if (!deleted) {
     throw new NotFoundException({
        status_code: 404,
        message: API_ERROR.USER_NOT_FOUND,
        error: 'Not Found',
     });
   }
  }
}
