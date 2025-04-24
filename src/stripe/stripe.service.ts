import {
	BadRequestException,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { JwtService } from '@nestjs/jwt';
import {
	INVALID_TOKEN_ERROR,
	UNAUTHORIZED_ERROR,
} from '../auth/auth.constants';
import {
	CheckoutSession,
	ResponseWithURL,
	StripePrice,
	StripeProduct,
	SubscriptionEnum,
} from './stripe.types';
import { UserAccessToken } from '../user/user.types';
import { CUSTOMER_NOT_FOUND_ERROR } from './stripe.constants';
import { User } from '../entities/user.entity';

@Injectable()
export class StripeService {
	private stripe;

	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		private jwtService: JwtService,
	) {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			apiVersion: '2025-02-24.acacia',
		});
	}

	async getPricesAndProducts(): Promise<StripePrice[]> {
		const products: Stripe.ApiList<StripePrice> = await this.stripe.prices.list(
			{
				expand: ['data.product'],
			},
		);
		return products.data;
	}

	async checkout(price: string): Promise<ResponseWithURL> {
		if (!price) {
			throw new BadRequestException('Product not found');
		}
		const session: CheckoutSession = await this.stripe.checkout.sessions.create(
			{
				line_items: [
					{
						price,
						quantity: 1,
					},
				],
				mode: 'subscription',
				success_url:
					'http://127.0.0.1:5500/success.html?session_id={CHECKOUT_SESSION_ID}',
				cancel_url: 'http://127.0.0.1:5500',
			},
		);

		return { url: session.url };
	}

	async success(
		session_id: string,
		bearerToken: string,
	): Promise<UserAccessToken> {
		const token = bearerToken.split(' ').pop();
		const tailUser = await this.jwtService.decode(token);

		if (!tailUser) {
			throw new UnauthorizedException(INVALID_TOKEN_ERROR);
		}

		const user = await this.userRepository.findOne({
			where: { id: tailUser.id },
		});

		if (user.subscriptionId) {
			const sub = await this.stripe.subscriptions.cancel(user.subscriptionId);
		}
		const session: CheckoutSession =
			await this.stripe.checkout.sessions.retrieve(session_id, {
				expand: ['subscription', 'subscription.plan.product'],
			});

		let newFolderSize = this.returnNewFolderSize(
			session.subscription.plan.product.name,
		);

		user.subscription = session.subscription.plan.product.name;
		user.maxFolderSize = newFolderSize;
		user.stripeCustomerId = session?.customer || null;
		user.subscriptionId = session.subscription.id;

		await user.save();

		const newUser = {
			id: user.id,
			email: user.email,
			subscription: user.subscription,
			stripeCustomerId: user.stripeCustomerId,
		};
		return {
			access_token: await this.jwtService.signAsync(newUser),
		};
	}

	async customerInfo(
		customerId: string,
		bearerToken: string,
	): Promise<ResponseWithURL> {
		const token = bearerToken.split(' ').pop();
		const decodeUser = await this.jwtService.decode(token);

		if (!decodeUser) {
			throw new UnauthorizedException(UNAUTHORIZED_ERROR);
		}
		const user = await this.userRepository.findOne({
			where: { id: decodeUser.id },
		});

		if (user.stripeCustomerId !== customerId) {
			throw new BadRequestException(CUSTOMER_NOT_FOUND_ERROR);
		}
		const portalSession = await this.stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: 'http://127.0.0.1:5500',
		});

		return { url: portalSession.url };
	}

	async webhook(payload: any, signature: string) {
		let event;
		const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

		try {
			event = await this.stripe.webhooks.constructEvent(
				payload,
				signature,
				endpointSecret,
			);
		} catch (err) {
			throw new BadRequestException(`Webhook error: ${err.message}`);
		}

		const user = await this.userRepository.findOne({
			where: { stripeCustomerId: event.data.object.customer },
		});

		switch (event.type) {
			// Событие при оформлении подписки
			case 'checkout.session.completed':
				console.log(`New Subscription started`);
				console.log(event.data);
				break;

			// При успешном платеже каджый месяц (проходит успешно)
			case 'invoice.paid':
				console.log('Invoide paid');
				console.log(event.data);
				break;

			// Не удалось совершить платеж (проблемы с картой и недостаточно средств)
			case 'invoice.payment_failed':
				console.log('Invoice payment failed');

				if (user) {
					user.subscription = SubscriptionEnum.free;
					user.maxFolderSize = 50;
					await user.save();
				}

				console.log(event.data); // cus_S1ehwhyQOayzig
				break;
			// Отмена или продление подписки (изменения в подписке)
			case 'customer.subscription.updated':
				console.log('Subscription updated');

				if (!user) {
					throw new UnauthorizedException(CUSTOMER_NOT_FOUND_ERROR);
				}

				if (!event.data.object.cancellation_details.reason) {
					const productId = event.data.object.plan.product;
					const productsResponse =
						(await this.stripe.products.list()) as Stripe.ApiList<StripeProduct>;
					const product = productsResponse.data.find(
						(item) => item.id === productId,
					);
					let newFolderSize = this.returnNewFolderSize(product.name);

					user.subscription = product.name;
					user.maxFolderSize = newFolderSize;
					user.save();

					break;
				} else {
					user.subscription = SubscriptionEnum.free;
					user.maxFolderSize = 50;
					await user.save();
					break;
				}
			// console.log(event.data.object.cancellation_details.reason);
			default:
				// Unexpected event type
				console.log(`Unhandled event type ${event.type}.`);
		}

		return { received: true };
	}

	returnNewFolderSize(subscriptionName: string) {
		let newFolderSize = 50;
		switch (subscriptionName.toLowerCase()) {
			case SubscriptionEnum.free:
				newFolderSize = 100;
				break;
			case SubscriptionEnum.pro:
				newFolderSize = 150;
				break;
			default:
				newFolderSize = 50;
		}

		return newFolderSize;
	}
}
