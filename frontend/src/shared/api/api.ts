import { api as generatedApi } from './generated/api';

export const api = generatedApi.enhanceEndpoints({
  endpoints: {
    getUsers: {
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ user_id }) => ({
                type: 'Users' as const,
                id: user_id,
              })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    },
    getUsersCount: {
      providesTags: [{ type: 'Users', id: 'COUNT' }],
    },
    createUser: {
      invalidatesTags: [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'COUNT' },
      ],
    },
    deleteUser: {
      invalidatesTags: [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'COUNT' },
        { type: 'UserPreferences' },
      ],
    },
    getUserPreferences: {
      providesTags: (_result, _error, { userId }) => [
        { type: 'UserPreferences', id: userId },
      ],
    },
    updateUserPreferences: {
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'UserPreferences', id: userId },
      ],
    },
    getGlobalPolicies: {
      providesTags: [{ type: 'GlobalPolicies', id: 'LIST' }],
    },
    getGlobalPoliciesCount: {
      providesTags: [{ type: 'GlobalPolicies', id: 'COUNT' }],
    },
    createGlobalPolicy: {
      invalidatesTags: [
        { type: 'GlobalPolicies', id: 'LIST' },
        { type: 'GlobalPolicies', id: 'COUNT' },
        { type: 'Users', id: 'LIST' },
        { type: 'UserPreferences' },
      ],
    },
    updateGlobalPolicy: {
      invalidatesTags: [
        { type: 'GlobalPolicies', id: 'LIST' },
        { type: 'Users', id: 'LIST' },
        { type: 'UserPreferences' },
      ],
    },
    deleteGlobalPolicy: {
      invalidatesTags: [
        { type: 'GlobalPolicies', id: 'LIST' },
        { type: 'GlobalPolicies', id: 'COUNT' },
        { type: 'Users', id: 'LIST' },
        { type: 'UserPreferences' },
      ],
    },
    getDefaultPreferences: {
      providesTags: [{ type: 'DefaultPreferences', id: 'LIST' }],
    },
    getDefaultPreferencesCount: {
      providesTags: [{ type: 'DefaultPreferences', id: 'COUNT' }],
    },
    createDefaultPreference: {
      invalidatesTags: [
        { type: 'DefaultPreferences', id: 'LIST' },
        { type: 'DefaultPreferences', id: 'COUNT' },
        { type: 'Users', id: 'LIST' },
        { type: 'UserPreferences' },
      ],
    },
    updateDefaultPreference: {
      invalidatesTags: [
        { type: 'DefaultPreferences', id: 'LIST' },
        { type: 'Users', id: 'LIST' },
        { type: 'UserPreferences' },
      ],
    },
    deleteDefaultPreference: {
      invalidatesTags: [
        { type: 'DefaultPreferences', id: 'LIST' },
        { type: 'DefaultPreferences', id: 'COUNT' },
        { type: 'Users', id: 'LIST' },
        { type: 'UserPreferences' },
      ],
    },
  },
});

export type * from './generated/api';

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
} = api;
