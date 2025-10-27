import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthorsService } from '../authors/authors.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './schemas/book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @Inject(forwardRef(() => AuthorsService))
    private authorsService: AuthorsService,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book & { author: any }> {
    await this.validateAuthor(createBookDto.authorId);
    const book = new this.bookModel({
      ...createBookDto,
      author: createBookDto.authorId,
    });
    const savedBook = await book.save();
    return await savedBook.populate('author');
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    authorId?: string;
  }): Promise<(Book & { author: any })[]> {
    const { page = 1, limit = 10, search, authorId } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }
    if (authorId) {
      filter.author = new Types.ObjectId(authorId);
    }
    const books = await this.bookModel
      .find(filter)
      .populate('author')
      .skip(skip)
      .limit(limit)
      .exec();
    return books;
  }

  async findOne(id: string): Promise<Book & { author: any }> {
    const book = await this.bookModel.findById(id).populate('author').exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
  ): Promise<Book & { author: any }> {
    if (updateBookDto.authorId) {
      await this.validateAuthor(updateBookDto.authorId);
    }
    const update = { ...updateBookDto };
    if (updateBookDto.authorId) {
      update['author'] = updateBookDto.authorId as unknown as Types.ObjectId;
      delete update.authorId;
    }
    const book = await this.bookModel
      .findByIdAndUpdate(id, update, { new: true })
      .populate('author')
      .exec();
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async remove(id: string): Promise<void> {
    const result = await this.bookModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Book not found');
    }
  }

  async findByAuthorId(authorId: string): Promise<Book[]> {
    return this.bookModel.find({ author: authorId }).populate('author').exec();
  }

  private async validateAuthor(authorId: Types.ObjectId): Promise<void> {
    try {
      await this.authorsService.findOne(authorId.toString());
    } catch {
      throw new BadRequestException('Invalid authorId: Author does not exist');
    }
  }
}
