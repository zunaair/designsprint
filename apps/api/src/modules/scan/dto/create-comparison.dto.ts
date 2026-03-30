import { IsArray, IsEmail, IsUrl, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class CreateComparisonDto {
  @IsUrl({ require_tld: true, require_protocol: true })
  primaryUrl!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsUrl({ require_tld: true, require_protocol: true }, { each: true })
  competitorUrls!: string[];

  @IsEmail()
  email!: string;
}
