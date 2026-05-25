import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { API_ERROR } from '../constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
   const ctx = host.switchToHttp();
   const response = ctx.getResponse<Response>();

   if (exception instanceof HttpException) {
     const status = exception.getStatus();
     const exceptionResponse = exception.getResponse();

     if (
       typeof exceptionResponse === 'object' &&
       exceptionResponse !== null &&
       'status_code' in exceptionResponse
     ) {
       response.status(status).json(exceptionResponse);
       return;
     }

     response.status(status).json({
        status_code: status,
        message: API_ERROR.VALIDATION_FAILED,
        error: exception.message,
     });
     return;
   }

   this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);

   response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status_code: 500,
      message: 'internal_server_error',
      error: 'Internal Server Error',
   });
  }
}
