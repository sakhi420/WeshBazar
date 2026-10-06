/**
 * Current-user profile read/update (spec §107: `GET /me`, `PATCH /me`).
 *
 * The profile combines the user account with its personal seller account.
 * Suspended/banned/deactivated accounts are refused (same policy as
 * `/auth/me`); deleted accounts are treated as signed out.
 */
import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { toSafeUser, type SafeUser } from '../../common/presenters/user.presenter';
import type { MySellerAccount } from '../../common/presenters/seller.presenter';
import { PrismaService } from '../../database/prisma.service';
import type { User } from '../../generated/prisma/client';
import { SellerAccountsService } from '../sellers/seller-accounts.service';
import type { UpdateMeDto } from './dto/update-me.dto';

export interface MyProfile extends SafeUser {
  avatarKey: string | null;
  seller: MySellerAccount;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sellerAccounts: SellerAccountsService,
  ) {}

  async getMyProfile(userId: string): Promise<MyProfile> {
    const user = await this.requireActiveAccount(userId);
    const seller = await this.sellerAccounts.getForOwner(userId);
    return {
      ...toSafeUser(user),
      avatarKey: user.avatarKey,
      seller,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateMeDto): Promise<MyProfile> {
    const user = await this.requireActiveAccount(userId);

    // `''` clears the value; anything else is stored as given (already trimmed).
    const userData: { displayName?: string; avatarKey?: string | null } = {};
    if (dto.displayName !== undefined) {
      userData.displayName = dto.displayName;
    }
    if (dto.avatarKey !== undefined) {
      userData.avatarKey = dto.avatarKey === '' ? null : dto.avatarKey;
    }

    const sellerData: { displayName?: string; bio?: string | null } = {};
    if (dto.seller?.displayName !== undefined) {
      sellerData.displayName = dto.seller.displayName;
    }
    if (dto.seller?.bio !== undefined) {
      sellerData.bio = dto.seller.bio === '' ? null : dto.seller.bio;
    }

    const hasUserChanges = Object.keys(userData).length > 0;
    const hasSellerChanges = Object.keys(sellerData).length > 0;
    if (hasUserChanges || hasSellerChanges) {
      await this.prisma.$transaction(async (tx) => {
        if (hasUserChanges) {
          await tx.user.update({ where: { id: user.id }, data: userData });
        }
        if (hasSellerChanges) {
          await this.sellerAccounts.updateForOwner(user.id, sellerData, tx);
        }
      });
    }

    return this.getMyProfile(userId);
  }

  /**
   * Fetch the caller's own user row. Deleted accounts are treated as signed
   * out; suspended/banned/deactivated accounts are refused with the same
   * policy as `/auth/me` (ACCOUNT_NOT_ACTIVE).
   */
  private async requireActiveAccount(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt !== null) {
      throw new AppException('UNAUTHORIZED');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }
    return user;
  }
}
