import { z } from 'zod'

const MAX_LOAN_DAYS = 91 // 13 weeks

export const CreateLoanSchema = z.object({
  bookId: z.string().regex(/^\d{13}$/, 'Invalid barcode'),
  startDate: z.string().datetime(),
  durationDays: z.number().int().min(1).max(MAX_LOAN_DAYS),
  notes: z.string().max(1000).optional(),
})

export const UpdateLoanSchema = z.object({
  status: z.enum(['ACTIVE', 'RETURNED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
})

export type CreateLoanInput = z.infer<typeof CreateLoanSchema>
export type UpdateLoanInput = z.infer<typeof UpdateLoanSchema>

export { MAX_LOAN_DAYS }
