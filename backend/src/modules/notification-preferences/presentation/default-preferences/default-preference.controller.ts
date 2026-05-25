import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { API_ERROR } from '../../../../shared/constants';
import { CountResponseDto, PaginationQueryDto, resolvePagination } from '../../../../shared/dto/pagination.dto';
import { ApiErrorResponses } from '../../../../shared/openapi/api-error-responses.decorator';
import {
  CountDefaultPreferencesUseCase,
  CreateDefaultPreferenceUseCase,
  DeleteDefaultPreferenceUseCase,
  ListDefaultPreferencesUseCase,
  UpdateDefaultPreferenceUseCase,
} from '../../application/default-preferences/default-preference.use-cases';
import {
  DefaultPreferencesListResponseDto,
  DefaultPreferenceItemDto,
} from './default-preferences.dto';
import { DefaultPreferenceBodyDto, UpdateDefaultPreferenceBodyDto } from './default-preferences.validation.dto';

@ApiTags('default-preferences')
@ApiSecurity('apiKey')
@Controller('default-preferences')
export class DefaultPreferenceController {
  constructor(
   private readonly listDefaultPreferencesUseCase: ListDefaultPreferencesUseCase,
   private readonly countDefaultPreferencesUseCase: CountDefaultPreferencesUseCase,
   private readonly createDefaultPreferenceUseCase: CreateDefaultPreferenceUseCase,
   private readonly updateDefaultPreferenceUseCase: UpdateDefaultPreferenceUseCase,
   private readonly deleteDefaultPreferenceUseCase: DeleteDefaultPreferenceUseCase,
  ) {}

  @Get('count')
  @ApiOperation({ summary: 'Count default preferences', operationId: 'getDefaultPreferencesCount' })
  @ApiResponse({ status: 200, type: CountResponseDto })
  @ApiErrorResponses({
    status: 401,
    message: API_ERROR.INVALID_API_KEY,
    error: 'Unauthorized',
    description: 'Invalid or missing API key',
  })
  public countPreferences(): Promise<CountResponseDto> {
   return this.countDefaultPreferencesUseCase.execute();
  }

  @Get()
  @ApiOperation({ summary: 'List default preferences', operationId: 'getDefaultPreferences' })
  @ApiResponse({ status: 200, type: DefaultPreferencesListResponseDto })
  @ApiErrorResponses({
    status: 401,
    message: API_ERROR.INVALID_API_KEY,
    error: 'Unauthorized',
    description: 'Invalid or missing API key',
  })
  public listPreferences(@Query() query: PaginationQueryDto): Promise<DefaultPreferencesListResponseDto> {
   const { offset, limit } = resolvePagination(query);
   return this.listDefaultPreferencesUseCase.execute(offset, limit);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create default preference', operationId: 'createDefaultPreference' })
  @ApiBody({ type: DefaultPreferenceBodyDto })
  @ApiResponse({ status: 201, type: DefaultPreferenceItemDto })
  @ApiErrorResponses(
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 409,
      message: API_ERROR.DEFAULT_PREFERENCE_ALREADY_EXISTS,
      error: 'Conflict',
      description: 'Default preference for this type and channel already exists',
   },
  )
  public createPreference(@Body() body: DefaultPreferenceBodyDto): Promise<DefaultPreferenceItemDto> {
   return this.createDefaultPreferenceUseCase.execute({
      region: body.region ?? null,
      notification_type: body.notification_type,
      channel: body.channel,
      enabled: body.enabled,
   });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update default preference', operationId: 'updateDefaultPreference' })
  @ApiBody({ type: UpdateDefaultPreferenceBodyDto })
  @ApiResponse({ status: 200, type: DefaultPreferenceItemDto })
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
      description: 'Default preference not found',
   },
   {
      status: 409,
      message: API_ERROR.DEFAULT_PREFERENCE_ALREADY_EXISTS,
      error: 'Conflict',
      description: 'Default preference for this type and channel already exists',
   },
  )
  public updatePreference(
   @Param('id') id: string,
   @Body() body: UpdateDefaultPreferenceBodyDto,
  ): Promise<DefaultPreferenceItemDto> {
   return this.updateDefaultPreferenceUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete default preference', operationId: 'deleteDefaultPreference' })
  @ApiResponse({ status: 204, description: 'Default preference deleted' })
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
      description: 'Default preference not found',
   },
  )
  public async deletePreference(@Param('id') id: string): Promise<void> {
   await this.deleteDefaultPreferenceUseCase.execute(id);
  }
}
