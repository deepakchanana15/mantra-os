import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

@Module({
  imports: [NotificationsModule],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService],
})
export class AuthModule {}
