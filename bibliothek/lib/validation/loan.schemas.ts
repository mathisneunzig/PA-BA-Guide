import { z } from 'zod'

const MAX_LOAN_DAYS = 91 // 13 weeks

export const HandoverMethodSchema = z.enum(['PICKUP', 'MEETINGPOINT', 'SHIPPING'])

export const CreateLoanGroupSchema = z.object({
  bookIds: z.array(z.string().regex(/^\d{13}$/, 'Invalid barcode')).min(1).max(20),
  startDate: z.string().datetime(),
  durationDays: z.number().int().min(1).max(MAX_LOAN_DAYS),
  notes: z.string().max(1000).optional(),
  immediate: z.boolean().optional().default(false), // true = create as ACTIVE directly (admin only)

  // Handover method — required for reservations, optional for immediate borrow
  handoverMethod: HandoverMethodSchema.optional(),
  handoverDate: z.string().datetime().optional().nullable(), // PICKUP / MEETINGPOINT
  handoverLocation: z.string().max(500).optional().nullable(), // MEETINGPOINT: where to meet
  handoverCost: z.number().min(0).max(99999).optional().nullable(), // SHIPPING: cost in €
})

export const UpdateGroupSchema = z.object({
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
})

export const UpdateItemSchema = z.object({
  status: z.enum(['RETURNED', 'CANCELLED', 'OVERDUE']),
})

export type CreateLoanGroupInput = z.infer<typeof CreateLoanGroupSchema>

export { MAX_LOAN_DAYS }
