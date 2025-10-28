import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Author } from '../../authors/schemas/author.schema';

@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Book extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  isbn: string;

  @Prop()
  publishedDate?: Date;

  @Prop()
  genre?: string;

  @Prop({ type: Types.ObjectId, ref: Author.name, required: true })
  author: Types.ObjectId;
}

export const BookSchema = SchemaFactory.createForClass(Book);

BookSchema.virtual('id').get(function (this: Book) {
  return (this._id as Types.ObjectId).toString();
});

BookSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc: any, ret: any): void {
    delete ret._id;
    delete ret.__v;
  },
});
