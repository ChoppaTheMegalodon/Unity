import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { getDb, schema } from '../db';
import { eq } from 'drizzle-orm';

export interface JwtPayload {
  sub: string; // user ID
  tier: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  /**
   * Register with email + password.
   */
  async registerEmail(email: string, password: string, displayName: string) {
    const db = getDb();
    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(schema.users)
      .values({ email, passwordHash, displayName })
      .returning();

    // Create default portfolio
    await db
      .insert(schema.portfolios)
      .values({ userId: user.id, name: 'Main Portfolio', isDefault: true });

    return this.issueToken(user.id, user.tier);
  }

  /**
   * Login with email + password.
   */
  async loginEmail(email: string, password: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user.id, user.tier);
  }

  /**
   * Authenticate via Telegram Mini App initData.
   *
   * Validates the hash signature using the bot token, per Telegram docs:
   * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  async authTelegram(initData: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new UnauthorizedException('Telegram auth not configured');
    }

    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Sort and create data check string
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    // Validate signature
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram signature');
    }

    // Check timestamp freshness (5 minute window)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 300) {
      throw new UnauthorizedException('Telegram auth data expired');
    }

    // Extract user info
    const userJson = params.get('user');
    if (!userJson) {
      throw new UnauthorizedException('No user data in initData');
    }

    const tgUser = JSON.parse(userJson);
    const telegramId = String(tgUser.id);
    const displayName =
      [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') ||
      tgUser.username ||
      `User ${telegramId}`;

    // Upsert user
    const db = getDb();
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.telegramId, telegramId))
      .limit(1);

    if (existing) {
      return this.issueToken(existing.id, existing.tier);
    }

    // New user
    const [user] = await db
      .insert(schema.users)
      .values({
        telegramId,
        displayName,
        avatarUrl: tgUser.photo_url || null,
      })
      .returning();

    // Create default portfolio
    await db
      .insert(schema.portfolios)
      .values({ userId: user.id, name: 'Main Portfolio', isDefault: true });

    return this.issueToken(user.id, user.tier);
  }

  private issueToken(userId: string, tier: string) {
    const payload: JwtPayload = { sub: userId, tier };
    return {
      accessToken: this.jwtService.sign(payload),
      userId,
      tier,
    };
  }
}
