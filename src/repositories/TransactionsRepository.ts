import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    function getSum(totalValue: number, value: number): number {
      return Number(totalValue) + Number(value);
    }

    const outcomes: number[] = [];
    const incomes: number[] = [];

    const transactions = await this.find();

    transactions.map(trans => {
      if (trans.type === 'income') {
        incomes.push(trans.value);
        return incomes;
      }
      outcomes.push(trans.value);
      return outcomes;
    });

    const income = incomes.reduce(getSum, 0);
    const outcome = outcomes.reduce(getSum, 0);

    const total = income - outcome;

    const balance = { income, outcome, total };

    return balance;
  }
}

export default TransactionsRepository;
