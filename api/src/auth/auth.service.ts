import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { signJwt } from './jwt';

export interface AccountRow {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  suspended: boolean;
  banned: boolean;
  password_hash: string;
}

@Injectable()
export class AuthService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async register(dto: RegisterDto): Promise<{ username: string }> {
    const { username, password, email } = dto;
    const existing = await this.pool.query(
      'SELECT id FROM accounts WHERE lower(username) = lower($1)',
      [username],
    );
    if (existing.rowCount && existing.rowCount > 0)
      throw new ConflictException('Username is already taken');

    const passwordHash = await bcrypt.hash(password, 12);
    try {
      await this.pool.query(
        'INSERT INTO accounts (username, password_hash, email) VALUES ($1, $2, $3)',
        [username, passwordHash, email],
      );
    } catch (err) {
      if ((err as { code?: string }).code === '23505')
        throw new ConflictException('Username is already taken');
      throw new InternalServerErrorException('Registration failed');
    }
    return { username };
  }

  async login(dto: LoginDto): Promise<{ token: string; username: string; email: string; isAdmin: boolean }> {
    const { username, password } = dto;
    const result = await this.pool.query<AccountRow>(
      'SELECT id, username, password_hash, email, is_admin, suspended, banned FROM accounts WHERE lower(username) = lower($1)',
      [username],
    );
    if (!result.rowCount || result.rowCount === 0)
      throw new UnauthorizedException('Invalid username or password');

    const row = result.rows[0];
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid username or password');

    if (row.banned) throw new UnauthorizedException('Your account has been banned.');
    if (row.suspended) throw new UnauthorizedException('Your account is currently suspended.');

    const token = signJwt({ sub: row.id, username: row.username, isAdmin: row.is_admin });
    return { token, username: row.username, email: row.email ?? '', isAdmin: row.is_admin };
  }

  async getMe(accountId: number): Promise<{ username: string; email: string; isAdmin: boolean }> {
    const result = await this.pool.query<AccountRow>(
      'SELECT username, email, is_admin FROM accounts WHERE id = $1',
      [accountId],
    );
    if (!result.rowCount || result.rowCount === 0) throw new NotFoundException('Account not found');
    const row = result.rows[0];
    return { username: row.username, email: row.email ?? '', isAdmin: row.is_admin };
  }

  async updateEmail(accountId: number, email: string): Promise<void> {
    await this.pool.query('UPDATE accounts SET email = $1 WHERE id = $2', [email, accountId]);
  }

  async updatePassword(accountId: number, currentPassword: string, newPassword: string): Promise<void> {
    const result = await this.pool.query<AccountRow>(
      'SELECT password_hash FROM accounts WHERE id = $1',
      [accountId],
    );
    if (!result.rowCount || result.rowCount === 0) throw new NotFoundException('Account not found');
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const hash = await bcrypt.hash(newPassword, 12);
    await this.pool.query('UPDATE accounts SET password_hash = $1 WHERE id = $2', [hash, accountId]);
  }
}
