import { z } from "zod";

export const cadastroSchema = z.object({
  nome: z
    .string({ required_error: "O campo 'nome' é obrigatório." })
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres.")
    .trim(),

  email: z
    .string({ required_error: "O campo 'email' é obrigatório." })
    .email("Formato de email inválido.")
    .toLowerCase()
    .trim(),

  senha: z
    .string({ required_error: "O campo 'senha' é obrigatório." })
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(128, "A senha deve ter no máximo 128 caracteres.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
    .regex(/[\W_]/, "A senha deve conter pelo menos um caractere especial.")
    .trim(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "O campo 'email' é obrigatório." })
    .email("Formato de email inválido.")
    .toLowerCase()
    .trim(),

  senha: z
    .string({ required_error: "O campo 'senha' é obrigatório." })
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .trim(),
});

export const idParamSchema = z.object({
  id: z
    .string()
    .refine((s) => !Number.isNaN(Number(s)), { message: "ID deve ser um número." })
    .transform((s) => Number(s)),
});
