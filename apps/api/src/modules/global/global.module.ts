import { Module } from "@nestjs/common";
import { CompaniesController } from "./companies/companies.controller";
import { CompaniesRepository } from "./companies/companies.repository";
import { CompaniesService } from "./companies/companies.service";
import { CountriesController } from "./countries/countries.controller";
import { CountriesRepository } from "./countries/countries.repository";
import { CountriesService } from "./countries/countries.service";
import { BrandsController } from "./brands/brands.controller";
import { BrandsRepository } from "./brands/brands.repository";
import { BrandsService } from "./brands/brands.service";
import { WebsitesController } from "./websites/websites.controller";
import { WebsitesRepository } from "./websites/websites.repository";
import { WebsitesService } from "./websites/websites.service";
import { CurrenciesController } from "./currencies/currencies.controller";
import { CurrenciesRepository } from "./currencies/currencies.repository";
import { CurrenciesService } from "./currencies/currencies.service";

/**
 * Company/Country/Brand/Website/Currency master data — see DECISIONS.md
 * "Global multi-country, multi-company, multi-brand architecture" and
 * ARCHITECTURE.md. Sub-phase A: master data CRUD only; scoping existing
 * domains (Customer, Quote, SalesOrder, ...) to Company/Country/Brand is
 * Sub-phase B.
 */
@Module({
  controllers: [CompaniesController, CountriesController, BrandsController, WebsitesController, CurrenciesController],
  providers: [
    CompaniesRepository,
    CompaniesService,
    CountriesRepository,
    CountriesService,
    BrandsRepository,
    BrandsService,
    WebsitesRepository,
    WebsitesService,
    CurrenciesRepository,
    CurrenciesService,
  ],
  exports: [CompaniesRepository, CountriesRepository, BrandsRepository],
})
export class GlobalModule {}
