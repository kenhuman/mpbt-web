import { Module, Global, Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

export const PG_POOL = 'PG_POOL';

@Injectable()
class MigrateService implements OnModuleInit {
  private readonly logger = new Logger(MigrateService.name);
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    try {
      const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
      await this.pool.query(sql);
      this.logger.log('Schema migration applied successfully');
    } catch (err) {
      this.logger.error('Schema migration FAILED', err);
      throw err;
    }
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({ connectionString: config.getOrThrow<string>('DATABASE_URL') }),
    },
    MigrateService,
  ],
  exports: [PG_POOL],
})
export class DbModule {}
