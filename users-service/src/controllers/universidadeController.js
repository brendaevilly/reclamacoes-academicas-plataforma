import { userService } from "../services/userService.js";

export const universidadeController = {
  async cadastro(req, res) {
    try {
      const universidade = await userService.cadastroUniversidade(req.body);
      if (!universidade) {
        return res.status(400).json({ error: "Universidade já cadastrada ou CNPJ duplicado." });
      }
      return res.status(201).json(universidade);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, senha } = req.body;
      const data = await userService.loginUniversidade(email, senha);
      if (!data) {
        return res.status(401).json({ error: "Credenciais inválidas." });
      }
      return res.json(data);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
  },

  async list(req, res) {
    try {
      const universidades = await userService.findAllUniversidades();
      return res.json(universidades);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao listar universidades." });
    }
  },

  async findOne(req, res) {
    try {
      const universidade = await userService.findUniversidadeById(Number(req.params.id));
      if (!universidade) {
        return res.status(404).json({ error: "Universidade não encontrada." });
      }
      return res.json(universidade);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const universidade = await userService.updateUniversidade(Number(req.params.id), req.body);
      if (!universidade) {
        return res.status(404).json({ error: "Universidade não encontrada." });
      }
      return res.json(universidade);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      await userService.deleteUniversidade(Number(req.params.id));
      return res.json({ message: "Universidade deletada." });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
};
