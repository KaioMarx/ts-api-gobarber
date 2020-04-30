import parse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TrasanctionRepository from '../repositories/TransactionsRepository';

interface CSVFormat {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(path: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TrasanctionRepository);
    const categoryRepository = getRepository(Category);

    const stream = fs.createReadStream(path);

    const parserConfig = parse({
      from_line: 2,
    });

    const parseCSV = stream.pipe(parserConfig);

    const transactions: CSVFormat[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) {
        throw new AppError('It does not worked, your file missing right data');
      }

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategorys = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategorys.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategorys];

    const createdTrasactions = transactionRepository.create(
      transactions.map(orders => ({
        title: orders.title,
        type: orders.type,
        value: orders.value,
        category: finalCategories.find(
          category => category.title === orders.category,
        ),
      })),
    );

    await transactionRepository.save(createdTrasactions);

    await fs.promises.unlink(path);

    return createdTrasactions;
  }
}

export default ImportTransactionsService;
