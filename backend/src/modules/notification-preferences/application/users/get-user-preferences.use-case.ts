import { Injectable } from '@nestjs/common';
import { PreferenceResolver } from '../../domain/users/preference-resolver';
import { UserPreferenceContextService } from './user-preference-context.service';

@Injectable()
export class GetUserPreferencesUseCase {
  constructor(private readonly contextService: UserPreferenceContextService) {}

  public async execute(userId: string) {
   const context = await this.contextService.load(userId);
   if (!context) {
     return null;
   }

   const preferences = PreferenceResolver.resolveEffectivePreferences(
     context.user.region,
     [...context.userPreferences],
     [...context.globalPolicies],
   );

   return {
      user_id: context.user.id,
      region: context.user.region,
     preferences,
      quiet_hours: context.quietHours
       ? {
            start_time: context.quietHours.start_time,
            end_time: context.quietHours.end_time,
            timezone: context.quietHours.timezone,
            enabled: context.quietHours.enabled,
         }
       : null,
   };
  }
}
