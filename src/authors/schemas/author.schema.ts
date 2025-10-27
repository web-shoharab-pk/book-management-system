import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
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
  return this._id;
});

export { AuthorSchema };
