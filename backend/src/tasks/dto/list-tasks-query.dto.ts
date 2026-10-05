import { IsOptional, IsIn, IsString, IsNumberString } from 'class-validator';

export class ListTasksQueryDto {
  /** Filter by status: open (not completed) or done (completed) */
  @IsOptional()
  @IsIn(['open', 'done'])
  status?: 'open' | 'done';

  /** Filter by priority level */
  @IsOptional()
  @IsNumberString()
  priority?: string;

  /** Filter by tag */
  @IsOptional()
  @IsString()
  tag?: string;

  /** Search query (title substring) */
  @IsOptional()
  @IsString()
  q?: string;
}
