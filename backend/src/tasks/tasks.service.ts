import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  /** Create a new task owned by the current user */
  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    // Validate: deadline must not be before scheduledAt
    if (dto.scheduledAt && dto.deadline) {
      if (new Date(dto.deadline) < new Date(dto.scheduledAt)) {
        throw new BadRequestException("Deadline can't be before the start time.");
      }
    }

    const task = await this.taskModel.create({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      description: dto.description || '',
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      priority: dto.priority ?? 2,
      tags: (dto.tags || []).map((t: string) => t.toLowerCase()),
    });

    return task;
  }

  /** List tasks for the current user, with optional filters */
  async findAll(userId: string, query: ListTasksQueryDto): Promise<Task[]> {
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    // Status filter
    if (query.status === 'open') filter.completed = false;
    if (query.status === 'done') filter.completed = true;

    // Priority filter
    if (query.priority) filter.priority = parseInt(query.priority, 10);

    // Tag filter
    if (query.tag) filter.tags = query.tag.toLowerCase();

    // Title search (case-insensitive substring)
    if (query.q) filter.title = { $regex: query.q, $options: 'i' };

    return this.taskModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /** Update a task — only if owned by the current user */
  async update(userId: string, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException('Task not found.');
    }

    // Always filter by both _id and userId for security
    const task = await this.taskModel.findOne({
      _id: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    // Validate deadline vs scheduledAt
    const newScheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : task.scheduledAt;
    const newDeadline = dto.deadline ? new Date(dto.deadline) : task.deadline;
    if (newScheduledAt && newDeadline && newDeadline < newScheduledAt) {
      throw new BadRequestException("Deadline can't be before the start time.");
    }

    // Apply updates
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.scheduledAt !== undefined) task.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (dto.deadline !== undefined) task.deadline = dto.deadline ? new Date(dto.deadline) : null;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.tags !== undefined) task.tags = dto.tags.map((t: string) => t.toLowerCase());

    // Handle completed toggle — set/clear completedAt automatically
    if (dto.completed !== undefined && dto.completed !== task.completed) {
      task.completed = dto.completed;
      task.completedAt = dto.completed ? new Date() : null;
    }

    return task.save();
  }

  /** Delete a task — only if owned by the current user */
  async remove(userId: string, taskId: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException('Task not found.');
    }

    const result = await this.taskModel.deleteOne({
      _id: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found.');
    }

    return { deleted: true };
  }
}
