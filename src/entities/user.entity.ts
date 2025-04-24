import {
	AllowNull,
	Column,
	DataType,
	HasMany,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { File } from './file.entity';
import { Role } from '../auth/enums/role.enum';
import { DataTypes } from 'sequelize';

@Table
export class User extends Model {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4,
	})
	id: string;

	@AllowNull(false)
	@Column({ unique: true })
	email: string;

	@AllowNull(false)
	@Column
	passwordHash: string;

	@Column({
		type: DataTypes.ENUM(...Object.values(Role)),
		allowNull: false,
		defaultValue: Role.USER,
	})
	role: Role.USER;

	@Column({ allowNull: true })
	hashedRefreshToken: string;

	@AllowNull(false)
	@Column
	subscription: string;

	@Column
	maxFolderSize: number;

	@AllowNull(false)
	@Column
	folderPath: string;

	@AllowNull(true)
	@Column
	stripeCustomerId: string;

	@Column
	subscriptionId: string;

	// @HasMany(() => File, { onDelete: 'CASCADE' })
	@HasMany(() => File)
	userFiles: File[];
}
