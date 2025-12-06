import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Prisma 6.7.0 não precisa de adapter
export const prisma = new PrismaClient()
