import {
	AllowNull,
	Column,
	DataType,
	HasMany,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { File } from '../files/file.model';

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

	@AllowNull(false)
	@Column
	subscription: string;

	@Column
	maxFolderSize: number;

	@AllowNull(false)
	@Column
	folderPath: string;

	@Column
	stripeCustomerId: string;

	@HasMany(() => File)
	userFiles: File[];
}
