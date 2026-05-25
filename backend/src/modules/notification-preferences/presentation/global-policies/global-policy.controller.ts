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
  CountGlobalPoliciesUseCase,
  CreateGlobalPolicyUseCase,
  DeleteGlobalPolicyUseCase,
  ListGlobalPoliciesUseCase,
  UpdateGlobalPolicyUseCase,
} from '../../application/global-policies/global-policy.use-cases';
import {
  GlobalPoliciesListResponseDto,
  GlobalPolicyItemDto,
} from './global-policies.dto';
import { GlobalPolicyBodyDto } from './global-policies.validation.dto';

@ApiTags('global-policies')
@ApiSecurity('apiKey')
@Controller('global-policies')
export class GlobalPolicyController {
  constructor(
   private readonly listGlobalPoliciesUseCase: ListGlobalPoliciesUseCase,
   private readonly countGlobalPoliciesUseCase: CountGlobalPoliciesUseCase,
   private readonly createGlobalPolicyUseCase: CreateGlobalPolicyUseCase,
   private readonly updateGlobalPolicyUseCase: UpdateGlobalPolicyUseCase,
   private readonly deleteGlobalPolicyUseCase: DeleteGlobalPolicyUseCase,
  ) {}

  @Get('count')
  @ApiOperation({ summary: 'Count global policies', operationId: 'getGlobalPoliciesCount' })
  @ApiResponse({ status: 200, type: CountResponseDto })
  @ApiErrorResponses({
    status: 401,
    message: API_ERROR.INVALID_API_KEY,
    error: 'Unauthorized',
    description: 'Invalid or missing API key',
  })
  public countPolicies(): Promise<CountResponseDto> {
   return this.countGlobalPoliciesUseCase.execute();
  }

  @Get()
  @ApiOperation({ summary: 'List global policies', operationId: 'getGlobalPolicies' })
  @ApiResponse({ status: 200, type: GlobalPoliciesListResponseDto })
  @ApiErrorResponses({
    status: 401,
    message: API_ERROR.INVALID_API_KEY,
    error: 'Unauthorized',
    description: 'Invalid or missing API key',
  })
  public listPolicies(@Query() query: PaginationQueryDto): Promise<GlobalPoliciesListResponseDto> {
   const { offset, limit } = resolvePagination(query);
   return this.listGlobalPoliciesUseCase.execute(offset, limit);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create global policy', operationId: 'createGlobalPolicy' })
  @ApiBody({ type: GlobalPolicyBodyDto })
  @ApiResponse({ status: 201, type: GlobalPolicyItemDto })
  @ApiErrorResponses(
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 409,
      message: API_ERROR.POLICY_ALREADY_EXISTS,
      error: 'Conflict',
      description: 'Policy for this type, channel and region already exists',
   },
  )
  public createPolicy(@Body() body: GlobalPolicyBodyDto): Promise<GlobalPolicyItemDto> {
   return this.createGlobalPolicyUseCase.execute(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update global policy', operationId: 'updateGlobalPolicy' })
  @ApiBody({ type: GlobalPolicyBodyDto })
  @ApiResponse({ status: 200, type: GlobalPolicyItemDto })
  @ApiErrorResponses(
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 404,
      message: API_ERROR.POLICY_NOT_FOUND,
      error: 'Not Found',
      description: 'Policy not found',
   },
   {
      status: 409,
      message: API_ERROR.POLICY_ALREADY_EXISTS,
      error: 'Conflict',
      description: 'Policy for this type, channel and region already exists',
   },
  )
  public updatePolicy(
   @Param('id') id: string,
   @Body() body: GlobalPolicyBodyDto,
  ): Promise<GlobalPolicyItemDto> {
   return this.updateGlobalPolicyUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete global policy', operationId: 'deleteGlobalPolicy' })
  @ApiResponse({ status: 204, description: 'Policy deleted' })
  @ApiErrorResponses(
   {
      status: 401,
      message: API_ERROR.INVALID_API_KEY,
      error: 'Unauthorized',
      description: 'Invalid or missing API key',
   },
   {
      status: 404,
      message: API_ERROR.POLICY_NOT_FOUND,
      error: 'Not Found',
      description: 'Policy not found',
   },
   {
      status: 409,
      message: API_ERROR.POLICY_HAS_REFERENCES,
      error: 'Conflict',
      description: 'Policy has evaluation log references',
   },
  )
  public async deletePolicy(@Param('id') id: string): Promise<void> {
   await this.deleteGlobalPolicyUseCase.execute(id);
  }
}
