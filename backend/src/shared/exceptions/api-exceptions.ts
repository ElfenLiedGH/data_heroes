import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

type ApiBody = {
  status_code: number;
  message: string;
  error: string;
};

function body(status: HttpStatus, message: string, error: string): ApiBody {
  return { status_code: status, message, error };
}

export class ApiNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(body(HttpStatus.NOT_FOUND, message, 'Not Found'));
  }
}

export class ApiConflictException extends ConflictException {
  constructor(message: string) {
    super(body(HttpStatus.CONFLICT, message, 'Conflict'));
  }
}

export class ApiForbiddenException extends ForbiddenException {
  constructor(message: string) {
    super(body(HttpStatus.FORBIDDEN, message, 'Forbidden'));
  }
}

export class ApiBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(body(HttpStatus.BAD_REQUEST, message, 'Bad Request'));
  }
}

export class ApiUnauthorizedException extends UnauthorizedException {
  constructor(message: string) {
    super(body(HttpStatus.UNAUTHORIZED, message, 'Unauthorized'));
  }
}

export type { ApiBody };
export type ApiException = HttpException;
