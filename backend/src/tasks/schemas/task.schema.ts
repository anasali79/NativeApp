import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, minlength: 1, maxlength: 120 })
  title: string;

  @Prop({ maxlength: 1000, default: '' })
  description: string;

  /** When the user plans to work on it (date-time) */
  @Prop({ type: Date })
  scheduledAt: Date | null;

  /** Hard deadline for the task */
  @Prop({ type: Date })
  deadline: Date | null;

  /** Priority: 1 = low, 2 = medium, 3 = high */
  @Prop({ default: 2, min: 1, max: 3 })
  priority: number;

  @Prop({ default: false })
  completed: boolean;

  /** Set automatically when completed flips to true */
  @Prop({ type: Date })
  completedAt: Date | null;

  /** Tags: max 5, each ≤ 20 chars, stored lowercase */
  @Prop({
    type: [String],
    default: [],
    validate: {
      validator: (v: string[]) => v.length <= 5 && v.every((t) => t.length <= 20),
      message: 'Max 5 tags, each up to 20 characters.',
    },
  })
  tags: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Compound index for efficient per-user queries with status and deadline filtering
TaskSchema.index({ userId: 1, completed: 1, deadline: 1 });
