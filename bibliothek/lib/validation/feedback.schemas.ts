import { z } from 'zod'

export const CreateFeedbackSchema = z.object({
  description: z.string().min(10, 'Bitte beschreibe das Problem genauer (min. 10 Zeichen)').max(2000),
  category: z.enum(['BUG', 'IMPROVEMENT', 'QUESTION', 'OTHER']).optional().default('OTHER'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('LOW'),
  pageUrl: z.string().max(500).optional(),
})

export const UpdateFeedbackSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  adminNote: z.string().max(1000).optional(),
})
