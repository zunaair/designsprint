import { IsEnum } from 'class-validator';

export enum PlanId {
  STARTER = 'starter',
  PRO = 'pro',
}

export class CreateCheckoutDto {
  @IsEnum(PlanId)
  plan!: PlanId;
}
