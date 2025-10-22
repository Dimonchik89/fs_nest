import {
	Table,
	Model,
	PrimaryKey,
	DataType,
	Column,
	HasMany,
} from 'sequelize-typescript';
import { PostImage } from '../posts/post.types';

@Table
export class Post extends Model {
	@PrimaryKey
	@Column({
		type: DataType.UUID,
		defaultValue: DataType.UUIDV4,
	})
	id: string;

	@Column
	title: string;

	@Column(DataType.TEXT)
	text: string;

	@Column
	link: string;

	@Column(DataType.JSON)
	requiredFiles: PostImage[];

	@Column
	subtitle: string;

	@Column(DataType.TEXT)
	subtext: string;

	@Column
	additionalLink: string;

	@Column(DataType.JSON)
	optionalFiles: PostImage[];
}
