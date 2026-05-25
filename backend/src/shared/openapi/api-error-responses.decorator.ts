import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

type ErrorSpec = {
  readonly status: number;
  readonly message: string;
  readonly error: string;
  readonly description: string;
};

export function ApiErrorResponses(...errors: ErrorSpec[]) {
  return applyDecorators(
   ...errors.map((e) =>
     ApiResponse({
       status: e.status,
       description: e.description,
       schema: {
         type: 'object',
         properties: {
           status_code: { type: 'number', example: e.status },
           message: { type: 'string', example: e.message },
           error: { type: 'string', example: e.error },
         },
       },
     }),
   ),
  );
}
