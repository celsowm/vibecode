import { IsInt, IsNumber, IsPositive, IsString, Max, Min } from 'class-validator';

export class CreateFeeDto {
  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsInt()
  @Min(1)
  @Max(12)
  referenceMonth: number;

  @IsInt()
  @Min(2000)
  referenceYear: number;

  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;
}
