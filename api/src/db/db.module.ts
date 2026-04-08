import { Module, Global, Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
    suspended     BOOLEAN      NOT NULL DEFAULT FALSE,
    banned        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email     VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_admin  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS banned    BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_username_lower_uq ON accounts (lower(username));

CREATE TABLE IF NOT EXISTS characters (
    id           SERIAL PRIMARY KEY,
    account_id   INTEGER      UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    display_name VARCHAR(64)  NOT NULL,
    allegiance   VARCHAR(16)  NOT NULL
        CHECK (allegiance IN ('Davion','Steiner','Liao','Marik','Kurita')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS characters_account_id_idx ON characters (account_id);
CREATE UNIQUE INDEX IF NOT EXISTS characters_display_name_lower_idx ON characters (lower(display_name));

CREATE TABLE IF NOT EXISTS messages (
    id                   SERIAL PRIMARY KEY,
    sender_account_id    INTEGER      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    recipient_account_id INTEGER      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    sender_comstar_id    INTEGER      NOT NULL,
    body                 TEXT         NOT NULL,
    sent_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    delivered_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS messages_recipient_undelivered_idx
    ON messages (recipient_account_id) WHERE delivered_at IS NULL;

CREATE TABLE IF NOT EXISTS articles (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(128) NOT NULL,
    title        VARCHAR(255) NOT NULL,
    summary      TEXT         NOT NULL,
    body         TEXT         NOT NULL,
    author_id    INTEGER      NOT NULL REFERENCES accounts(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_uq ON articles (slug);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles (published_at DESC);
`;

@Injectable()
class MigrateService implements OnModuleInit {
  private readonly logger = new Logger(MigrateService.name);
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    try {
      await this.pool.query(SCHEMA_SQL);
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
