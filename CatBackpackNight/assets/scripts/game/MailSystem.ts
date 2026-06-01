import { GameSaveData, MailSave, RewardPayload } from '../data/GameTypes';
import { GameConfigRepository } from './GameConfigRepository';
import { failure, GameLogicResult, success } from './GameLogicResult';
import { grantRewards } from './GameLogicUtils';

export interface MailClaimResult {
  mail: MailSave;
  rewards: RewardPayload[];
}

export interface MailClaimAllResult {
  claimed: string[];
  rewards: RewardPayload[];
}

export interface MailDeleteResult {
  deleted: string[];
}

export class MailSystem {
  public constructor(private readonly repo: GameConfigRepository) {}

  public claimMail(save: GameSaveData, mailId: string, now = Date.now()): GameLogicResult<MailClaimResult> {
    const mail = save.mails.find((row) => row.id === mailId);
    if (!mail) {
      return failure('config_missing', `missing mail: ${mailId}`);
    }
    if (mail.claimed) {
      return failure('already_claimed', 'mail already claimed');
    }
    if (mail.expireAt <= now) {
      return failure('unavailable', 'mail expired');
    }
    if (mail.attachments.length === 0) {
      mail.read = true;
      mail.claimed = true;
      return success({ mail, rewards: [] }, 'mail read');
    }

    const grant = grantRewards(save, mail.attachments, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }
    mail.read = true;
    mail.claimed = true;
    return success({ mail, rewards: mail.attachments }, 'mail claimed');
  }

  public claimAllMails(save: GameSaveData, now = Date.now()): GameLogicResult<MailClaimAllResult> {
    const claimed: string[] = [];
    const rewards: RewardPayload[] = [];
    for (const mail of save.mails) {
      if (mail.claimed || mail.expireAt <= now || mail.attachments.length === 0) {
        continue;
      }
      const grant = grantRewards(save, mail.attachments, this.repo);
      if (!grant.ok) {
        return failure(grant.reason ?? 'invalid_input', grant.message);
      }
      mail.read = true;
      mail.claimed = true;
      claimed.push(mail.id);
      rewards.push(...mail.attachments);
    }
    if (claimed.length === 0) {
      return failure('not_ready', 'no mail attachments can be claimed');
    }
    return success({ claimed, rewards }, 'mails claimed');
  }

  public deleteClaimedAndEmptyMails(save: GameSaveData): GameLogicResult<MailDeleteResult> {
    const deletable = save.mails.filter((mail) => mail.claimed || mail.attachments.length === 0);
    save.mails = save.mails.filter((mail) => !deletable.includes(mail));
    return success({ deleted: deletable.map((mail) => mail.id) }, 'mails deleted');
  }

  public deleteMail(save: GameSaveData, mailId: string): GameLogicResult<MailDeleteResult> {
    const mail = save.mails.find((row) => row.id === mailId);
    if (!mail) {
      return failure('config_missing', `missing mail: ${mailId}`);
    }
    if (!mail.claimed && mail.attachments.length > 0) {
      return failure('not_ready', 'mail has unclaimed attachments');
    }

    save.mails = save.mails.filter((row) => row.id !== mailId);
    return success({ deleted: [mailId] }, 'mail deleted');
  }
}
