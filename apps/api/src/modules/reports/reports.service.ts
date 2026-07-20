import { Injectable } from "@nestjs/common";
import { ReportsRepository } from "./reports.repository";

@Injectable()
export class ReportsService {
  constructor(private readonly reports: ReportsRepository) {}

  getDashboardSummary() {
    return this.reports.getDashboardSummary();
  }
}
