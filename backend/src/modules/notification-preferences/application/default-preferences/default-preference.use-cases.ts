import { Inject, Injectable } from '@nestjs/common';
import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import {
  ApiConflictException,
  ApiNotFoundException,
} from '../../../../shared/exceptions/api-exceptions';
import { isPrismaUniqueViolation } from '../../../../shared/utils/prisma-errors';
import { DEFAULT_PREFERENCE_REPOSITORY } from '../../../../shared/tokens/repository.tokens';
import { DefaultPreferenceRepositoryPort } from '../ports/default-preferences/default-preference.repository.port';

export type CreateDefaultPreferenceInput = {
  readonly region: Region | null;
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
};

export type UpdateDefaultPreferenceInput = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
};

function mapDefaultPreference(p: Readonly<{
  id: string;
  region: Region | null;
  notification_type: NotificationType;
  channel: Channel;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}>) {
  return {
    id: p.id,
    region: p.region,
    notification_type: p.notification_type,
    channel: p.channel,
    enabled: p.enabled,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  };
}

@Injectable()
export class ListDefaultPreferencesUseCase {
  constructor(
   @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly preferenceRepository: DefaultPreferenceRepositoryPort,
  ) {}

  public async execute(offset: number, limit: number) {
   const items = await this.preferenceRepository.findDefaultsPage(offset, limit);
   return {
      preferences: items.map(mapDefaultPreference),
   };
  }
}

@Injectable()
export class CountDefaultPreferencesUseCase {
  constructor(
   @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly preferenceRepository: DefaultPreferenceRepositoryPort,
  ) {}

  public async execute() {
   const count = await this.preferenceRepository.countDefaults();
   return { count };
  }
}

@Injectable()
export class CreateDefaultPreferenceUseCase {
  constructor(
   @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly preferenceRepository: DefaultPreferenceRepositoryPort,
  ) {}

  public async execute(input: CreateDefaultPreferenceInput) {
   try {
     const pref = await this.preferenceRepository.createDefault(input);
     return mapDefaultPreference(pref);
   } catch (error) {
     if (isPrismaUniqueViolation(error)) {
       throw new ApiConflictException(API_ERROR.DEFAULT_PREFERENCE_ALREADY_EXISTS);
     }
     throw error;
   }
  }
}

@Injectable()
export class UpdateDefaultPreferenceUseCase {
  constructor(
   @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly preferenceRepository: DefaultPreferenceRepositoryPort,
  ) {}

  public async execute(id: string, input: UpdateDefaultPreferenceInput) {
   const existing = await this.preferenceRepository.findDefaultById(id);
   if (!existing) {
     throw new ApiNotFoundException(API_ERROR.DEFAULT_PREFERENCE_NOT_FOUND);
   }

   try {
     const pref = await this.preferenceRepository.updateDefault(id, input);
     return mapDefaultPreference({ ...pref, region: existing.region });
   } catch (error) {
     if (isPrismaUniqueViolation(error)) {
       throw new ApiConflictException(API_ERROR.DEFAULT_PREFERENCE_ALREADY_EXISTS);
     }
     throw error;
   }
  }
}

@Injectable()
export class DeleteDefaultPreferenceUseCase {
  constructor(
   @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly preferenceRepository: DefaultPreferenceRepositoryPort,
  ) {}

  public async execute(id: string) {
   const existing = await this.preferenceRepository.findDefaultById(id);
   if (!existing) {
     throw new ApiNotFoundException(API_ERROR.DEFAULT_PREFERENCE_NOT_FOUND);
   }

   await this.preferenceRepository.deleteDefault(id);
  }
}
