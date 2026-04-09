import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
	constructor(private readonly referralsRepository: ReferralsService) {}

	@Post()
	createReferral(@Body() dto: CreateReferralDto) {
		return this.referralsRepository.createReferral(dto);
	}
}
