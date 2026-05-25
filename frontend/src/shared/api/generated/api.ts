import { baseApi as api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUsersCount: build.query<GetUsersCountApiResponse, GetUsersCountApiArg>({
      query: (queryArg) => ({
        url: `/users/count`,
        params: {
          search: queryArg.search,
        },
      }),
    }),
    getUsers: build.query<GetUsersApiResponse, GetUsersApiArg>({
      query: (queryArg) => ({
        url: `/users`,
        params: {
          offset: queryArg.offset,
          limit: queryArg.limit,
          search: queryArg.search,
        },
      }),
    }),
    createUser: build.mutation<CreateUserApiResponse, CreateUserApiArg>({
      query: (queryArg) => ({
        url: `/users`,
        method: "POST",
        body: queryArg.createUserBodyDto,
      }),
    }),
    getUserPreferences: build.query<
      GetUserPreferencesApiResponse,
      GetUserPreferencesApiArg
    >({
      query: (queryArg) => ({ url: `/users/${queryArg.userId}/preferences` }),
    }),
    updateUserPreferences: build.mutation<
      UpdateUserPreferencesApiResponse,
      UpdateUserPreferencesApiArg
    >({
      query: (queryArg) => ({
        url: `/users/${queryArg.userId}/preferences`,
        method: "POST",
        body: queryArg.updateUserPreferencesBodyDto,
      }),
    }),
    deleteUser: build.mutation<DeleteUserApiResponse, DeleteUserApiArg>({
      query: (queryArg) => ({
        url: `/users/${queryArg.userId}`,
        method: "DELETE",
      }),
    }),
    evaluateNotification: build.mutation<
      EvaluateNotificationApiResponse,
      EvaluateNotificationApiArg
    >({
      query: (queryArg) => ({
        url: `/evaluate`,
        method: "POST",
        body: queryArg.evaluateBodyDto,
      }),
    }),
    getHealth: build.query<GetHealthApiResponse, GetHealthApiArg>({
      query: () => ({ url: `/health` }),
    }),
    getGlobalPoliciesCount: build.query<
      GetGlobalPoliciesCountApiResponse,
      GetGlobalPoliciesCountApiArg
    >({
      query: () => ({ url: `/global-policies/count` }),
    }),
    getGlobalPolicies: build.query<
      GetGlobalPoliciesApiResponse,
      GetGlobalPoliciesApiArg
    >({
      query: (queryArg) => ({
        url: `/global-policies`,
        params: {
          offset: queryArg.offset,
          limit: queryArg.limit,
        },
      }),
    }),
    createGlobalPolicy: build.mutation<
      CreateGlobalPolicyApiResponse,
      CreateGlobalPolicyApiArg
    >({
      query: (queryArg) => ({
        url: `/global-policies`,
        method: "POST",
        body: queryArg.globalPolicyBodyDto,
      }),
    }),
    updateGlobalPolicy: build.mutation<
      UpdateGlobalPolicyApiResponse,
      UpdateGlobalPolicyApiArg
    >({
      query: (queryArg) => ({
        url: `/global-policies/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.globalPolicyBodyDto,
      }),
    }),
    deleteGlobalPolicy: build.mutation<
      DeleteGlobalPolicyApiResponse,
      DeleteGlobalPolicyApiArg
    >({
      query: (queryArg) => ({
        url: `/global-policies/${queryArg.id}`,
        method: "DELETE",
      }),
    }),
    getDefaultPreferencesCount: build.query<
      GetDefaultPreferencesCountApiResponse,
      GetDefaultPreferencesCountApiArg
    >({
      query: () => ({ url: `/default-preferences/count` }),
    }),
    getDefaultPreferences: build.query<
      GetDefaultPreferencesApiResponse,
      GetDefaultPreferencesApiArg
    >({
      query: (queryArg) => ({
        url: `/default-preferences`,
        params: {
          offset: queryArg.offset,
          limit: queryArg.limit,
        },
      }),
    }),
    createDefaultPreference: build.mutation<
      CreateDefaultPreferenceApiResponse,
      CreateDefaultPreferenceApiArg
    >({
      query: (queryArg) => ({
        url: `/default-preferences`,
        method: "POST",
        body: queryArg.defaultPreferenceBodyDto,
      }),
    }),
    updateDefaultPreference: build.mutation<
      UpdateDefaultPreferenceApiResponse,
      UpdateDefaultPreferenceApiArg
    >({
      query: (queryArg) => ({
        url: `/default-preferences/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.updateDefaultPreferenceBodyDto,
      }),
    }),
    deleteDefaultPreference: build.mutation<
      DeleteDefaultPreferenceApiResponse,
      DeleteDefaultPreferenceApiArg
    >({
      query: (queryArg) => ({
        url: `/default-preferences/${queryArg.id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as api };
export type GetUsersCountApiResponse = /** status 200  */ CountResponseDto;
export type GetUsersCountApiArg = {
  /** Partial match filter by user id */
  search?: string;
};
export type GetUsersApiResponse = /** status 200  */ UsersListResponseDto;
export type GetUsersApiArg = {
  offset?: number;
  limit?: number;
  /** Partial match filter by user id */
  search?: string;
};
export type CreateUserApiResponse = /** status 201  */ CreateUserResponseDto;
export type CreateUserApiArg = {
  createUserBodyDto: CreateUserBodyDto;
};
export type GetUserPreferencesApiResponse =
  /** status 200  */ UserPreferencesResponseDto;
export type GetUserPreferencesApiArg = {
  userId: string;
};
export type UpdateUserPreferencesApiResponse =
  /** status 200  */ UserPreferencesResponseDto;
export type UpdateUserPreferencesApiArg = {
  userId: string;
  updateUserPreferencesBodyDto: UpdateUserPreferencesBodyDto;
};
export type DeleteUserApiResponse = unknown;
export type DeleteUserApiArg = {
  userId: string;
};
export type EvaluateNotificationApiResponse =
  /** status 200  */ EvaluateResponseDto;
export type EvaluateNotificationApiArg = {
  evaluateBodyDto: EvaluateBodyDto;
};
export type GetHealthApiResponse = /** status 200  */ HealthResponseDto;
export type GetHealthApiArg = void;
export type GetGlobalPoliciesCountApiResponse =
  /** status 200  */ CountResponseDto;
export type GetGlobalPoliciesCountApiArg = void;
export type GetGlobalPoliciesApiResponse =
  /** status 200  */ GlobalPoliciesListResponseDto;
export type GetGlobalPoliciesApiArg = {
  offset?: number;
  limit?: number;
};
export type CreateGlobalPolicyApiResponse =
  /** status 201  */ GlobalPolicyItemDto;
export type CreateGlobalPolicyApiArg = {
  globalPolicyBodyDto: GlobalPolicyBodyDto;
};
export type UpdateGlobalPolicyApiResponse =
  /** status 200  */ GlobalPolicyItemDto;
export type UpdateGlobalPolicyApiArg = {
  id: string;
  globalPolicyBodyDto: GlobalPolicyBodyDto;
};
export type DeleteGlobalPolicyApiResponse = unknown;
export type DeleteGlobalPolicyApiArg = {
  id: string;
};
export type GetDefaultPreferencesCountApiResponse =
  /** status 200  */ CountResponseDto;
export type GetDefaultPreferencesCountApiArg = void;
export type GetDefaultPreferencesApiResponse =
  /** status 200  */ DefaultPreferencesListResponseDto;
export type GetDefaultPreferencesApiArg = {
  offset?: number;
  limit?: number;
};
export type CreateDefaultPreferenceApiResponse =
  /** status 201  */ DefaultPreferenceItemDto;
export type CreateDefaultPreferenceApiArg = {
  defaultPreferenceBodyDto: DefaultPreferenceBodyDto;
};
export type UpdateDefaultPreferenceApiResponse =
  /** status 200  */ DefaultPreferenceItemDto;
export type UpdateDefaultPreferenceApiArg = {
  id: string;
  updateDefaultPreferenceBodyDto: UpdateDefaultPreferenceBodyDto;
};
export type DeleteDefaultPreferenceApiResponse = unknown;
export type DeleteDefaultPreferenceApiArg = {
  id: string;
};
export type CountResponseDto = {
  count: number;
};
export type PreferenceItemDto = {
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  enabled: boolean;
  source: ("user" | "global") | null;
  blocked_by_global: boolean;
};
export type UserListItemDto = {
  user_id: string;
  region: "EU" | "US" | "RU" | "GLOBAL";
  created_at: string;
  preferences: PreferenceItemDto[];
};
export type UsersListResponseDto = {
  users: UserListItemDto[];
};
export type CreateUserResponseDto = {
  user_id: string;
  region: "EU" | "US" | "RU" | "GLOBAL";
};
export type CreateUserBodyDto = {
  user_id: string;
  region: "EU" | "US" | "RU" | "GLOBAL";
};
export type QuietHoursDto = {
  start_time: string;
  end_time: string;
  timezone: string;
  enabled: boolean;
};
export type UserPreferencesResponseDto = {
  user_id: string;
  region: "EU" | "US" | "RU" | "GLOBAL";
  preferences: PreferenceItemDto[];
  quiet_hours: QuietHoursDto | null;
};
export type PreferenceChangeBodyDto = {
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  enabled: boolean;
};
export type QuietHoursBodyDto = {
  start_time: string;
  end_time: string;
  timezone: string;
  enabled: boolean;
};
export type UpdateUserPreferencesBodyDto = {
  changes: PreferenceChangeBodyDto[];
  quiet_hours?: QuietHoursBodyDto | null;
  region?: "EU" | "US" | "RU" | "GLOBAL";
};
export type EvaluateResponseDto = {
  decision: "allow" | "deny";
  reason:
    | "allowed"
    | "blocked_by_global_policy"
    | "disabled_by_user_preference"
    | "disabled_by_default"
    | "blocked_by_quiet_hours";
};
export type EvaluateBodyDto = {
  user_id: string;
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  region: "EU" | "US" | "RU" | "GLOBAL";
  datetime: string;
};
export type HealthResponseDto = {
  status: string;
  db?: string;
};
export type GlobalPolicyItemDto = {
  id: string;
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  region: "EU" | "US" | "RU" | "GLOBAL";
  action: "deny";
  reason_code:
    | "allowed"
    | "blocked_by_global_policy"
    | "disabled_by_user_preference"
    | "disabled_by_default"
    | "blocked_by_quiet_hours";
  created_at: string;
};
export type GlobalPoliciesListResponseDto = {
  policies: GlobalPolicyItemDto[];
};
export type GlobalPolicyBodyDto = {
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  region: "EU" | "US" | "RU" | "GLOBAL";
  action: "deny";
  reason_code:
    | "allowed"
    | "blocked_by_global_policy"
    | "disabled_by_user_preference"
    | "disabled_by_default"
    | "blocked_by_quiet_hours";
};
export type DefaultPreferenceItemDto = {
  id: string;
  region: ("EU" | "US" | "RU" | "GLOBAL") | null;
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  enabled: boolean;
  created_at: string;
  updated_at: string;
};
export type DefaultPreferencesListResponseDto = {
  preferences: DefaultPreferenceItemDto[];
};
export type DefaultPreferenceBodyDto = {
  region?: ("EU" | "US" | "RU" | "GLOBAL") | null;
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  enabled: boolean;
};
export type UpdateDefaultPreferenceBodyDto = {
  notification_type: "transactional" | "marketing";
  channel: "email" | "sms" | "push" | "messenger";
  enabled: boolean;
};
export const {
  useGetUsersCountQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useDeleteUserMutation,
  useEvaluateNotificationMutation,
  useGetHealthQuery,
  useGetGlobalPoliciesCountQuery,
  useGetGlobalPoliciesQuery,
  useCreateGlobalPolicyMutation,
  useUpdateGlobalPolicyMutation,
  useDeleteGlobalPolicyMutation,
  useGetDefaultPreferencesCountQuery,
  useGetDefaultPreferencesQuery,
  useCreateDefaultPreferenceMutation,
  useUpdateDefaultPreferenceMutation,
  useDeleteDefaultPreferenceMutation,
} = injectedRtkApi;
