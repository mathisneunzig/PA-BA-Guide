import { z } from 'zod'

export const CreateBookSchema = z.object({
  id: z.string().regex(/^\d{13}$/).optional(), // EAN-13; auto-generated if omitted
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(255),
  isbn13: z.string().regex(/^\d{13}$/).optional(),
  publisher: z.string().max(255).optional(),
  year: z.number().int().min(1000).max(new Date().getFullYear() + 1).optional(),
  description: z.string().optional(),
  coverUrl: z.string().url().optional(),
  genre: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  totalCopies: z.number().int().min(1).default(1),
  availableCopies: z.number().int().min(0).optional(),
  loanDurationWeeks: z.number().int().min(1).max(13).default(13),
})

export const UpdateBookSchema = CreateBookSchema.partial().omit({ id: true })

export const BookSearchSchema = z.object({
  q: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateBookInput = z.infer<typeof CreateBookSchema>
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>
export type BookSearchInput = z.infer<typeof BookSearchSchema>
