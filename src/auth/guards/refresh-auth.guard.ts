import { AuthGuard } from '@nestjs/passport';

export class RefreshAuthGuard extends AuthGuard('refresh-jwt') {}

// import { AuthGuard } from '@nestjs/passport';
// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { Logger } from '@nestjs/common';

// @Injectable()
// export class RefreshAuthGuard extends AuthGuard('refresh-jwt') {
//     private readonly logger = new Logger(RefreshAuthGuard.name);

//     constructor() {
//         super();
//     }

//     handleRequest(err, user, info) {
//         if (err || !user) {
//             this.logger.error('Refresh token validation failed:', {
//                 error: err,
//                 info: info,
//                 user: user
//             });
//             throw err || new UnauthorizedException();
//         }
//         this.logger.log('Refresh token validated successfully');
//         return user;
//     }
// }