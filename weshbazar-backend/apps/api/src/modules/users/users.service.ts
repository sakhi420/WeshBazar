/**
 * Current-user profile read/update (spec §107: `GET /me`, `PATCH /me`).
 *
 * The profile combines the user account with its personal seller account.
 * Suspended/banned/deactivated accounts are refused (same policy as
 * `/auth/me`); deleted accounts are treated as signed out.
 */
import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { toSafeUser, type SafeUser } from '../../common/presenters/user.presenter';
import type { MySellerAccount } from '../../common/presenters/seller.presenter';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { PrismaService } from '../../database/prisma.service';
import type { User } from '../../generated/prisma/client';
import { ImageProcessor } from '../media/image-processor';
import { SellerAccountsService } from '../sellers/seller-accounts.service';
import type { UpdateMeDto } from './dto/update-me.dto';

export interface MyProfile extends SafeUser {
  avatarKey: string | null;
  /** Public URL of the avatar image, or null when none is set. */
  avatarUrl: string | null;
  seller: MySellerAccount;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sellerAccounts: SellerAccountsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    private readonly imageProcessor: ImageProcessor,
  ) {}

  async getMyProfile(userId: string): Promise<MyProfile> {
    const user = await this.requireActiveAccount(userId);
    const seller = await this.sellerAccounts.getForOwner(userId);
    return {
      ...toSafeUser(user),
      avatarKey: user.avatarKey,
      avatarUrl: user.avatarKey ? this.storage.getPublicUrl(user.avatarKey) : null,
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
    let removedAvatarKey: string | null = null;
    if (dto.avatarKey !== undefined) {
      const nextAvatarKey = dto.avatarKey === '' ? null : dto.avatarKey;
      userData.avatarKey = nextAvatarKey;
      if (nextAvatarKey === null && user.avatarKey !== null) {
        removedAvatarKey = user.avatarKey;
      }
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

    if (removedAvatarKey !== null) {
      await this.storage.delete(removedAvatarKey).catch(() => undefined);
    }

    return this.getMyProfile(userId);
  }

  /**
   * Upload (or replace) the caller's profile photo. The incoming bytes are
   * validated and re-encoded by the shared ImageProcessor; the small WebP
   * thumbnail is written under a checksum-addressed `avatars/` key (so a new
   * upload is cache-busted) and `User.avatarKey` is pointed at it. The previous
   * object is removed after the DB update so a replaced avatar never leaves a
   * stale object behind.
   */
  async uploadAvatar(userId: string, file: Buffer): Promise<MyProfile> {
    const user = await this.requireActiveAccount(userId);
    const processed = await this.imageProcessor.process(file);
    const key = `avatars/${userId}/${processed.original.checksum}.webp`;
    try {
      await this.storage.put(key, processed.variants.thumbnail.data, 'image/webp');
    } catch (error) {
      await this.storage.delete(key).catch(() => undefined);
      throw new AppException('MEDIA_STORAGE_FAILED', { cause: error });
    }

    await this.prisma.user.update({ where: { id: userId }, data: { avatarKey: key } });

    if (user.avatarKey !== null && user.avatarKey !== key) {
      await this.storage.delete(user.avatarKey).catch(() => undefined);
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
