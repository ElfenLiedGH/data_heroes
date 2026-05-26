import { Inject, Injectable } from '@nestjs/common';
import { Region } from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import {
  ApiConflictException,
  ApiNotFoundException,
} from '../../../../shared/exceptions/api-exceptions';
import {
  DEFAULT_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../../shared/tokens/repository.tokens';
import { DefaultPreferenceRepositoryPort } from '../ports/default-preferences/default-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';

export type CreateUserInput = {
  readonly user_id: string;
  readonly region: Region;
};

@Injectable()
export class CreateUserUseCase {
  constructor(
   @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
   @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly preferenceRepository: DefaultPreferenceRepositoryPort,
  ) {}

  public async execute(input: CreateUserInput) {
   const existing = await this.userRepository.findById(input.user_id);
   if (existing) {
     throw new ApiConflictException(API_ERROR.USER_ALREADY_EXISTS);
   }

   const resolved = await this.preferenceRepository.resolveDefaultsForRegion(input.region);
   if (!resolved) {
     throw new ApiNotFoundException(API_ERROR.DEFAULT_PREFERENCE_NOT_FOUND);
   }

   await this.userRepository.createWithDefaults(input.user_id, input.region, resolved);

   return {
      user_id: input.user_id,
      region: input.region,
   };
  }
}
