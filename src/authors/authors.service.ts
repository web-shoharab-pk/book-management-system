import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BooksService } from '../books/books.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Author } from './schemas/author.schema';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name) private authorModel: Model<Author>,
    @Inject(forwardRef(() => BooksService))
    private booksService: BooksService,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    const author = new this.authorModel(createAuthorDto);
    return author.save();
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Author[]> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ],
      };
    }
    return this.authorModel.find(filter).skip(skip).limit(limit).exec();
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.authorModel.findById(id).exec();
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    const author = await this.authorModel
      .findByIdAndUpdate(id, updateAuthorDto, { new: true })
      .exec();
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    return author;
  }

  async remove(id: string): Promise<void> {
    const books = await this.booksService.findByAuthorId(id);
    if (books.length > 0) {
      throw new ConflictException('Cannot delete author with associated books');
    }
    const result = await this.authorModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Author not found');
    }
  }
}
