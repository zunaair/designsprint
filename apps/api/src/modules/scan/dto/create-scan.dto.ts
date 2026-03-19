import { IsEmail, IsEnum, IsUrl } from 'class-validator';

export enum ViewportOption {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  BOTH = 'both',
}

export class CreateScanDto {
  @IsUrl({ require_tld: true, require_protocol: true })
  url!: string;

  @IsEmail()
  email!: string;

  @IsEnum(ViewportOption)
  viewport!: ViewportOption;
}
