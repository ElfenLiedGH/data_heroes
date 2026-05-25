/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
const config = {
  schemaFile: process.env.OPENAPI_URL ?? './openapi.json',
  apiFile: './src/shared/api/base-api.ts',
  apiImport: 'baseApi',
  outputFile: './src/shared/api/generated/api.ts',
  exportName: 'api',
  hooks: true,
};

export default config;
