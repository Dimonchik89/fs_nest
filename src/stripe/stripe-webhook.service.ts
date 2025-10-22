import {
	Injectable,
	Inject,
	BadRequestException,
	UnauthorizedException,
	forwardRef,
} from '@nestjs/common';
import Stripe from 'stripe';
import { User } from '../entities/user.entity';
import { StripeProduct, SubscriptionEnum } from './stripe.types';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class StripeWebhookService {
	private stripe: Stripe;

	constructor(
		@Inject('USER_REPOSITORY') private userRepository: typeof User,
		// private readonly authService: AuthService
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
	) {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			apiVersion: '2025-02-24.acacia',
		});
	}

	private returnNewFolderSize(subscriptionName: string): number {
		switch (subscriptionName?.toLowerCase()) {
			case SubscriptionEnum.pro:
				return 150;
			case SubscriptionEnum.started:
				return 100;
			default:
				return 50;
		}
	}

	async handleWebhook(event: Stripe.Event): Promise<{ received: boolean }> {
		const object = event.data.object as any;

		let user: User;
		if (object.customer) {
			user = await this.userRepository.findOne({
				where: { stripeCustomerId: object.customer },
			});
		}

		// console.log("user!!!!!!!!!!!!!!!1", user);

		if (!user && event.type !== 'checkout.session.completed') {
			console.error(`User not found for customer: ${object.customer}`);
			return { received: false };
		}

		switch (event.type) {
			// Событие срабатывает при первой успешной оплате, создающей подписку.
			// Именно здесь мы записываем данные о новой подписке в нашу базу.
			// case 'checkout.session.completed': {
			//     console.log(`Checkout session completed`);
			//     const session = object as Stripe.Checkout.Session;
			//     // Чтобы получить данные о продукте, нужно развернуть подписку
			//     const subscription = await this.stripe.subscriptions.retrieve(
			//         session.subscription as string,
			//         { expand: ['items.data.price.product'] }
			//     );
			//     const product = subscription.items.data[0].price.product as StripeProduct;
			//     console.log("completed product!!!!!!!!!!!!!!!", product);

			//     if (user) {
			//         user.subscription = product.name as SubscriptionEnum;
			//         user.maxFolderSize = this.returnNewFolderSize(product.name as string);
			//         user.subscriptionId = subscription.id;
			//         user.stripeCustomerId = session.customer as string;
			//         await user.save();
			//     } else {
			//         console.log(`New user via checkout, but not found in DB. Data:`, object);
			//     }
			//     break;
			// }

			case 'checkout.session.completed': {
				console.log(`Checkout session completed`);
				const session = object as Stripe.Checkout.Session;
				// Чтобы получить данные о продукте, нужно развернуть подписку
				// const subscription = await this.stripe.subscriptions.retrieve(
				//     session.subscription as string,
				//     { expand: ['items.data.price.product'] }
				// );
				// const product = subscription.items.data[0].price.product as StripeProduct;
				// console.log("completed subscription!!!!!!!!!!!!!!!", subscription);
				// console.log("completed product!!!!!!!!!!!!!!!", product);

				// if (subscription.status === 'canceled') {
				//     user.subscription = SubscriptionEnum.free;
				//     user.maxFolderSize = this.returnNewFolderSize(SubscriptionEnum.free);
				//     user.subscriptionId = null; // Обнуляем ID подписки
				//     await user.save();
				//     await this.stripe.subscriptions.cancel(user.subscriptionId);
				// } else if (user) {
				//     if (user.subscriptionId && user.subscriptionId !== subscription.id) {
				//         console.log(`User already has a subscription: ${user.subscriptionId}. Canceling it.`);
				//         try {
				//             await this.stripe.subscriptions.cancel(user.subscriptionId);
				//         } catch (error) {
				//             console.error('Failed to cancel old subscription:', error);
				//         }
				//     }

				//     user.subscription = product.name as SubscriptionEnum;
				//     user.maxFolderSize = this.returnNewFolderSize(product.name as string);
				//     user.subscriptionId = subscription.id;
				//     await user.save();
				// } else {
				//     console.log(`New user via checkout, but not found in DB. Data:`, object);
				// }

				break;
			}

			case 'customer.subscription.created': {
				console.log(`Subscription created`);
				const subscription = object as Stripe.Subscription;
				const product = subscription.items.data[0].price
					.product as StripeProduct;
				console.log('created product!!!!!!!!!!!!!!!', product);

				//  if(user) {
				//     if (user.subscriptionId && user.subscriptionId !== subscription.id) {
				//         console.log(`User already has a subscription: ${user.subscriptionId}. Canceling it.`);
				//         try {
				//             await this.stripe.subscriptions.cancel(user.subscriptionId);
				//         } catch (error) {
				//             console.error('Failed to cancel old subscription:', error);
				//         }
				//     }

				//     user.subscription = product.name as SubscriptionEnum;
				//     user.maxFolderSize = this.returnNewFolderSize(product.name as string);
				//     user.subscriptionId = subscription.id;
				//     await user.save();
				//  } else {
				//     console.log(`New user via created subscription, but not found in DB. Data:`, object);
				//  }

				//  if (user.subscriptionId && user.subscriptionId !== subscription.id) {
				//     console.log(`User already has a subscription. Canceling old one.`);
				//     try {
				//         await this.stripe.subscriptions.cancel(user.subscriptionId);
				//     } catch (error) {
				//         console.error('Failed to cancel old subscription:', error);
				//     }
				// }

				break;
			}

			// Событие срабатывает каждый раз, когда Stripe успешно снимает платеж по подписке.
			// Здесь можно добавить логику, если нужно. Например, отправить уведомление.
			case 'invoice.paid': {
				console.log('Invoice paid');
				break;
			}

			// Событие срабатывает, если Stripe не смог провести платеж (например, у карты истёк срок, или недостаточно средств).
			// Мы переводим пользователя на бесплатный тариф, чтобы ограничить его возможности.
			case 'invoice.payment_failed': {
				console.log('Invoice payment failed');
				if (user) {
					user.subscription = SubscriptionEnum.free;
					user.maxFolderSize = this.returnNewFolderSize(SubscriptionEnum.free);
					await user.save();
				}
				break;
			}

			// Событие срабатывает при любых изменениях в подписке (например, смене тарифа).
			// Здесь мы обновляем тариф и лимит памяти в зависимости от нового статуса подписки.
			case 'customer.subscription.updated': {
				console.log('Subscription updated');

				const session = object as Stripe.Checkout.Session;

				console.log('session!!!!!!!!!!!!!!!!!!!!!!!!', session);

				const subscription = await this.stripe.subscriptions.retrieve(
					session.id as string,
					{ expand: ['items.data.price.product'] },
				);
				const product = subscription.items.data[0].price
					.product as StripeProduct;

				console.log('updated subscription!!!!!!!!!!!!!!!!!!', subscription);

				if (
					subscription.status === 'canceled' ||
					subscription.cancellation_details.reason
				) {
					await this.stripe.subscriptions.cancel(user.subscriptionId);
					user.subscription = SubscriptionEnum.free;
					user.maxFolderSize = this.returnNewFolderSize(SubscriptionEnum.free);
					user.subscriptionId = null; // Обнуляем ID подписки
					await user.save();
				} else if (user) {
					if (user.subscriptionId && user.subscriptionId !== subscription.id) {
						console.log(
							`User already has a subscription: ${user.subscriptionId}. Canceling it.`,
						);
						try {
							await this.stripe.subscriptions.cancel(user.subscriptionId);
						} catch (error) {
							console.error('Failed to cancel old subscription:', error);
						}
					}

					user.subscription = product.name as SubscriptionEnum;
					user.maxFolderSize = this.returnNewFolderSize(product.name as string);
					user.subscriptionId = subscription.id;
					await user.save();
				} else {
					console.log(
						`New user via checkout, but not found in DB. Data:`,
						object,
					);
				}

				break;
			}

			// Событие срабатывает, когда подписка полностью удалена (например, после отмены в конце периода).
			// Мы обнуляем данные о подписке и переводим пользователя на бесплатный тариф.
			case 'customer.subscription.deleted': {
				console.log('Subscription deleted!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
				// if (user) {
				//     user.subscription = SubscriptionEnum.free;
				//     user.maxFolderSize = this.returnNewFolderSize(SubscriptionEnum.free);
				//     user.subscriptionId = null;
				//     await user.save();
				// }
				break;
			}

			default:
				console.log(`Unhandled event type ${event.type}.`);
		}

		return { received: true };
	}
}
