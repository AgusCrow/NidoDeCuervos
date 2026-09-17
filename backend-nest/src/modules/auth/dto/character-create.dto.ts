import { CharacterClass } from '../../../entities/player.entity';

export class CharacterCreateDto {
  name: string;
  username: string;
  password: string;
  secretClass: CharacterClass;
  statStr: number;
  statDex: number;
  statInt: number;
  statCon: number;
  avatarUrl?: string;
  nfcUid?: string;
}

export class LoginDto {
  username?: string;
  password?: string;
  nfcUid?: string;
}
