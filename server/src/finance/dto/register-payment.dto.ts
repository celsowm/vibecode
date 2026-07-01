import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RegisterPaymentDto {
  @IsString()
  chargeId: string;

  @IsNumber()
  @IsPositive()
  amountPaid: number;

  @IsOptional()
  @IsString()
  method?: string;
}
