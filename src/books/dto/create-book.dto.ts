import {
  IsDateString,
  IsISBN,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  @IsISBN()
  isbn: string;

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsMongoId()
  authorId: Types.ObjectId;
}
