import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient<
  Prisma.PrismaClientOptions,
  'query'
> {
  private readonly logger = new Logger(PrismaService.name);
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    const isProduction = process.env.NODE_ENV === 'production';
    super({
      adapter,
      log: isProduction ? [] : [{ emit: 'event', level: 'query' }],
    });
    if (!isProduction) {
      this.$on('query', (event: Prisma.QueryEvent) => {
        // query: SQL text, params: bound parameters, duration: execution time in ms.
        // this.logger.log(
        //   '[prisma]',
        //   event.query,
        //   event.params,
        //   `${event.duration}ms`,
        // );
        this.logger.log(event);
      });
    }
  }
}
