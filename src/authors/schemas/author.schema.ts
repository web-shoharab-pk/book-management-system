import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Author extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  bio?: string;

  @Prop()
  birthDate?: Date;
}

const AuthorSchema = SchemaFactory.createForClass(Author);

AuthorSchema.virtual('id').get(function (this: Author) {
  return (this._id as Types.ObjectId).toString();
});

AuthorSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc: any, ret: any): void {
    delete ret._id;
    delete ret.__v;
  },
});

export { AuthorSchema };
