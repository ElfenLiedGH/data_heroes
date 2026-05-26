import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiNotFoundException } from '../../../../shared/exceptions/api-exceptions';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { API_ERROR } from '../../../../shared/constants';
import { CountResponseDto, resolvePagination } from '../../../../shared/dto/pagination.dto';
import { ApiErrorResponses } from '../../../../shared/openapi/api-error-responses.decorator';
import { CreateUserUseCase } from '../../application/users/create-user.use-case';
import { DeleteUserUseCase } from '../../application/users/delete-user.use-case';
import { GetUserPreferencesUseCase } from '../../application/users/get-user-preferences.use-case';
import { CountUsersUseCase, ListUsersUseCase } from '../../application/users/list-users.use-case';
import {
  UpdateUserPreferencesUseCase,
} from '../../application/users/update-user-preferences.use-case';
import {
  CreateUserResponseDto,
  UserPreferencesResponseDto,
  UsersListResponseDto,
} from './users.dto';
import {
  CreateUserBodyDto,
  resolveUserSearch,
  UpdateUserPreferencesBodyDto,
  UsersListQueryDto,
} from './users.validation.dto';

@ApiTags('users')
@ApiSecurity('apiKey')
@Controller('users')
export class PreferencesController {
  constructor(
   private readonly listUsersUseCase: ListUsersUseCase,
   private readonly countUsersUseCase: CountUsersUseCase,
   private readonly createUserUseCase: CreateUserUseCase,
   private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase,
   private readonly updateUserPreferencesUseCase: UpdateUserPreferencesUseCase,
   private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Get('count')
  @ApiOperation({ summary: 'Count users', operationId: 'getUsersCount' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Partial match filter by user id',
  })
  @ApiResponse({ status: 200, type: CountResponseDto })
  @ApiErrorResponses({
    status: 401,
    message: API_ERROR.INVALID_API_KEY,
    error: 'Unauthorized',
    description: 'Invalid or missing API key',
  })
  public async countUsers(@Query('search') search?: string): Promise<CountResponseDto> {
   return this.countUsersUseCase.execute(resolveUserSearch(search));
  }

  @Get()
  @ApiOperation({ summary: 'List users', operationId: 'getUsers' })
  @ApiResponse({ status: 200, type: UsersListResponseDto })
  @ApiErrorResponses({
    status: 401,
    message: API_ERROR.INVALID_API_KEY,
    error: 'Unauthorized',
    description: 'Invalid or missing API key',
  })
  public async listUsers(@Query() query: UsersListQueryDto): Promise<UsersListResponseDto> {
   const { offset, limit } = resolvePagination(query);
   const search = resolveUserSearch(query.search);
   return this.listUsersUseCase.execute(offset, limit, search);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user with default preferences', operationId: 'createUser' })
  @ApiBody({ type: CreateUserBodyDto })
  @ApiResponse({ status: 201, type: CreateUserResponseDto })
  @ApiErrorResponses(
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 404,
      message: API_ERROR.DEFAULT_PREFERENCE_NOT_FOUND,
      error: 'Not Found',
      description: 'No default preferences configured',
   },
   {
      status: 409,
      message: API_ERROR.USER_ALREADY_EXISTS,
      error: 'Conflict',
      description: 'User already exists',
   },
  )
  public createUser(@Body() body: CreateUserBodyDto): Promise<CreateUserResponseDto> {
   return this.createUserUseCase.execute(body);
  }

  @Get(':user_id/preferences')
  @ApiOperation({ summary: 'Get user preferences', operationId: 'getUserPreferences' })
  @ApiResponse({ status: 200, type: UserPreferencesResponseDto })
  @ApiErrorResponses(
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 404,
      message: API_ERROR.USER_NOT_FOUND,
      error: 'Not Found',
      description: 'User not found',
   },
  )
  public async getPreferences(
   @Param('user_id') userId: string,
  ): Promise<UserPreferencesResponseDto> {
   const result = await this.getUserPreferencesUseCase.execute(userId);
   if (!result) {
     throw new ApiNotFoundException(API_ERROR.USER_NOT_FOUND);
   }
   return result;
  }

  @Post(':user_id/preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user preferences', operationId: 'updateUserPreferences' })
  @ApiBody({ type: UpdateUserPreferencesBodyDto })
  @ApiResponse({ status: 200, type: UserPreferencesResponseDto })
  @ApiErrorResponses(
   {
      status: 400,
      message: API_ERROR.VALIDATION_FAILED,
      error: 'Bad Request',
      description: 'Validation failed',
   },
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 403,
      message: API_ERROR.BLOCKED_BY_GLOBAL_POLICY,
      error: 'Forbidden',
      description: 'Blocked by global policy',
   },
   {
      status: 404,
      message: API_ERROR.USER_NOT_FOUND,
      error: 'Not Found',
      description: 'User not found',
   },
  )
  public async updatePreferences(
   @Param('user_id') userId: string,
   @Body() body: UpdateUserPreferencesBodyDto,
  ): Promise<UserPreferencesResponseDto> {
   const result = await this.updateUserPreferencesUseCase.execute(
     userId,
     body.changes,
     body.quiet_hours,
     body.region,
   );
   if (!result) {
     throw new ApiNotFoundException(API_ERROR.USER_NOT_FOUND);
   }
   return result;
  }

  @Delete(':user_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user', operationId: 'deleteUser' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiErrorResponses(
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 404,
      message: API_ERROR.USER_NOT_FOUND,
      error: 'Not Found',
      description: 'User not found',
   },
  )
  public async deleteUser(@Param('user_id') userId: string): Promise<void> {
   await this.deleteUserUseCase.execute(userId);
  }
}
