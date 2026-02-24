import { z } from "zod";

// --- LocalStorage Data Models ---

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  nextExamDate: z.string().optional(),
  topics: z.string(),
  progress: z.number().default(0), // 0-100 checklist completion
});
export type Subject = z.infer<typeof subjectSchema>;

export const taskSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  dueDate: z.string().optional(), // ISO date string
  completed: z.boolean().default(false),
});
export type Task = z.infer<typeof taskSchema>;

export const resourceSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  link: z.string(),
  notes: z.string().optional(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const quizHistorySchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  topic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["multiple_choice", "true_false"]),
  score: z.number(),
  totalQuestions: z.number(),
  date: z.string(),
});
export type QuizHistory = z.infer<typeof quizHistorySchema>;

// --- API Models for AI Quiz Generation (Stub) ---

export const generateQuizRequestSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["multiple_choice", "true_false"]),
  count: z.number().min(1).max(20),
  resources: z.array(z.string()),
});
export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;

export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).optional(), // Present for multiple_choice
  correctAnswer: z.string(),
  explanation: z.string(),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const generateQuizResponseSchema = z.object({
  questions: z.array(quizQuestionSchema),
});
export type GenerateQuizResponse = z.infer<typeof generateQuizResponseSchema>;
