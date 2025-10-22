import { Module, forwardRef } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { userProviders } from '../user/user.providers';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../auth/config/jwt.config';
import { StripeWebhookService } from './stripe-webhook.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
	imports: [
		forwardRef(() => AuthModule),
		JwtModule.registerAsync(jwtConfig.asProvider()),
	],
	controllers: [StripeController],
	providers: [StripeService, StripeWebhookService, ...userProviders],
	exports: [StripeService],
})
export class StripeModule {}
