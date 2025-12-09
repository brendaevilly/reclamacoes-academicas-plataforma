import { validate } from "../middlewares/validate.js";
import { cadastroSchema, loginSchema, idParamSchema } from "../validators/userValidator.js";

import { userService } from "../services/userService.js";

export const userController = {
  async cadastro(req, res) {
    try {
      const user = await userService.cadastro(req.body);
      if (!user) {
        return res.status(400).json({ error: "Usuário já cadastrado com este email." });
      }
      return res.status(201).json(user);
    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, senha } = req.body; 
      const data = await userService.login(email, senha);
      if (!data) {
        return res.status(401).json({ error: "Email ou senha inválidos." });
      }
      return res.json(data);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  async list(req, res) {
    try {
      const users = await userService.findAll();
      return res.json(users);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao listar usuários." });
    }
  },

  async findOne(req, res) {
    try {
      const user = await userService.findById(Number(req.params.id));
      if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
      return res.json(user);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const userId = Number(req.params.id);
      const currentUserId = req.user?.id;

      // Verificar se o usuário está atualizando seu próprio perfil
      if (currentUserId && userId !== currentUserId) {
        return res.status(403).json({ error: "Você não tem permissão para atualizar este usuário." });
      }

      const updatedUser = await userService.update(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      return res.json(updatedUser);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      await userService.delete(Number(req.params.id));
      return res.json({ message: "Usuário deletado." });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
};
