import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { API_ERROR } from '../../../../shared/constants';
import { ApiErrorResponses } from '../../../../shared/openapi/api-error-responses.decorator';
import { EvaluateNotificationUseCase } from '../../application/evaluation/evaluate-notification.use-case';
import { EvaluateResponseDto } from './evaluation.dto';
import { EvaluateBodyDto } from './evaluation.validation.dto';

@ApiTags('evaluate')
@ApiSecurity('apiKey')
@Controller('evaluate')
export class EvaluationController {
  constructor(
   private readonly evaluateNotificationUseCase: EvaluateNotificationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate notification delivery', operationId: 'evaluateNotification' })
  @ApiBody({ type: EvaluateBodyDto })
  @ApiResponse({ status: 200, type: EvaluateResponseDto })
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
      status: 404,
      message: API_ERROR.USER_NOT_FOUND,
      error: 'Not Found',
      description: 'User not found',
   },
  )
  public async evaluate(@Body() body: EvaluateBodyDto): Promise<EvaluateResponseDto> {
   return this.evaluateNotificationUseCase.execute(body);
  }
}
