import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

@Injectable()
export class SetupService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async needsSetup(): Promise<boolean> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM accounts',
    );
    return parseInt(result.rows[0].count, 10) === 0;
  }

  async createFirstAdmin(
    username: string,
    password: string,
    email: string,
  ): Promise<{ username: string }> {
    const alreadySetup = !(await this.needsSetup());
    if (alreadySetup)
      throw new ConflictException('Setup already completed — an admin account already exists.');

    const passwordHash = await bcrypt.hash(password, 12);
    try {
      await this.pool.query(
        `INSERT INTO accounts (username, password_hash, email, is_admin)
         VALUES ($1, $2, $3, TRUE)`,
        [username, passwordHash, email],
      );
    } catch {
      throw new InternalServerErrorException('Failed to create admin account.');
    }
    return { username };
  }
}
