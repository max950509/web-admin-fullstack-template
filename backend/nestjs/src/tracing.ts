import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'backend-nestjs';
if (!process.env.OTEL_SERVICE_NAME) {
  process.env.OTEL_SERVICE_NAME = serviceName;
}

const serviceVersion = process.env.SERVICE_VERSION ?? 'dev';
const deploymentEnv = process.env.DEPLOYMENT_ENV ?? 'local';
const resourceAttrs = (process.env.OTEL_RESOURCE_ATTRIBUTES ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const hasAttr = (key: string) =>
  resourceAttrs.some((value) => value.startsWith(`${key}=`));

if (!hasAttr('service.version')) {
  resourceAttrs.push(`service.version=${serviceVersion}`);
}
if (!hasAttr('deployment.environment')) {
  resourceAttrs.push(`deployment.environment=${deploymentEnv}`);
}

process.env.OTEL_RESOURCE_ATTRIBUTES = resourceAttrs.join(',');

const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations(),
    new PrismaInstrumentation(),
  ],
});

process.on('SIGTERM', () => {
  sdk.shutdown().catch((err) => console.error('OTel SDK shutdown error', err));
});

export default sdk;
