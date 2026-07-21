import { Injectable } from "@nestjs/common";
import { CurrenciesRepository } from "./currencies.repository";

@Injectable()
export class CurrenciesService {
  constructor(private readonly currencies: CurrenciesRepository) {}

  findAll() {
    return this.currencies.findAll();
  }
}
