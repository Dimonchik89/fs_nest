import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { userProviders } from '../user/user.providers';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../auth/config/jwt.config';

@Module({
	imports: [JwtModule.registerAsync(jwtConfig.asProvider())],
	controllers: [StripeController],
	providers: [StripeService, ...userProviders],
})
export class StripeModule {}
