import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserListRow {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  suspended: boolean;
  banned: boolean;
  created_at: Date;
}

@Injectable()
export class UsersService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listUsers(): Promise<UserListRow[]> {
    const result = await this.pool.query<UserListRow>(
      `SELECT id, username, email, is_admin, suspended, banned, created_at
       FROM accounts
       ORDER BY created_at ASC`,
    );
    return result.rows;
  }

  async createUser(dto: CreateUserDto): Promise<UserListRow> {
    const existing = await this.pool.query(
      'SELECT id FROM accounts WHERE lower(username) = lower($1)',
      [dto.username],
    );
    if (existing.rowCount && existing.rowCount > 0)
      throw new ConflictException('Username is already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      const result = await this.pool.query<UserListRow>(
        `INSERT INTO accounts (username, password_hash, email, is_admin)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, is_admin, suspended, banned, created_at`,
        [dto.username, passwordHash, dto.email ?? null, dto.isAdmin ?? false],
      );
      return result.rows[0];
    } catch (err) {
      if ((err as { code?: string }).code === '23505')
        throw new ConflictException('Username is already taken');
      throw new InternalServerErrorException('User creation failed');
    }
  }

  async updateUser(
    targetId: number,
    actorId: number,
    dto: UpdateUserDto,
  ): Promise<UserListRow> {
    // Prevent an admin from banning or removing their own admin status.
    if (targetId === actorId) {
      if (dto.isAdmin === false)
        throw new ForbiddenException('You cannot remove your own admin status.');
      if (dto.banned === true)
        throw new ForbiddenException('You cannot ban your own account.');
      if (dto.suspended === true)
        throw new ForbiddenException('You cannot suspend your own account.');
    }

    // Fetch target
    const check = await this.pool.query<UserListRow>(
      'SELECT id, is_admin FROM accounts WHERE id = $1',
      [targetId],
    );
    if (!check.rowCount || check.rowCount === 0)
      throw new NotFoundException('User not found.');

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.email !== undefined) {
      sets.push(`email = $${idx++}`);
      values.push(dto.email);
    }
    if (dto.password !== undefined) {
      sets.push(`password_hash = $${idx++}`);
      values.push(await bcrypt.hash(dto.password, 12));
    }
    if (dto.isAdmin !== undefined) {
      sets.push(`is_admin = $${idx++}`);
      values.push(dto.isAdmin);
    }
    if (dto.suspended !== undefined) {
      sets.push(`suspended = $${idx++}`);
      values.push(dto.suspended);
    }
    if (dto.banned !== undefined) {
      sets.push(`banned = $${idx++}`);
      values.push(dto.banned);
    }

    if (sets.length === 0) throw new BadRequestException('No fields to update.');

    values.push(targetId);
    const result = await this.pool.query<UserListRow>(
      `UPDATE accounts SET ${sets.join(', ')}
       WHERE id = $${idx}
       RETURNING id, username, email, is_admin, suspended, banned, created_at`,
      values,
    );
    return result.rows[0];
  }
}
