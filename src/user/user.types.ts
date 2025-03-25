import { User } from './user.model';

export type TailUserForToken = Pick<User, 'id' | 'email' | 'subscription' | 'maxFolderSize' | 'stripeCustomerId'>