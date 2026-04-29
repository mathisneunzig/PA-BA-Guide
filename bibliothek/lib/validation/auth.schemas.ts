import { z } from 'zod'

export const RegisterSchema = z
  .object({
    firstname: z.string().min(1, 'First name is required'),
    lastname: z.string().min(1, 'Last name is required'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    passwordConfirm: z.string(),
    // Optional address fields (step 2)
    street: z.string().optional(),
    housenr: z.string().optional(),
    zipcode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    // Consent
    marketingConsent: z.boolean().default(false),
    agbAccepted: z.literal(true, { message: 'Du musst den AGB zustimmen' }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  })

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[^a-zA-Z0-9]/, 'Must contain special character'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  })

export const UpdateUserSchema = z.object({
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  housenr: z.string().optional(),
  zipcode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  del_street: z.string().optional(),
  del_housenr: z.string().optional(),
  del_zipcode: z.string().optional(),
  del_city: z.string().optional(),
  del_country: z.string().optional(),
  role: z.enum(['GUEST', 'STUDENT', 'ADMIN']).optional(),
})

export const ProfileCompleteSchema = z.object({
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  phone: z.string().optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
