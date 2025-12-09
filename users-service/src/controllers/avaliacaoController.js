import { userService } from "../services/userService.js";

export const avaliacaoController = {
  async createOrUpdate(req, res) {
    try {
      const { universidadeId, nota } = req.body;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      if (!universidadeId || nota === undefined) {
        return res.status(400).json({ error: "Universidade ID e nota são obrigatórios." });
      }

      if (nota < 0 || nota > 5) {
        return res.status(400).json({ error: "A nota deve estar entre 0 e 5." });
      }

      const avaliacao = await userService.createOrUpdateAvaliacao({
        universidadeId,
        usuarioId,
        nota
      });

      return res.json(avaliacao);
    } catch (err) {
      console.error("Erro ao criar/atualizar avaliação:", err);
      return res.status(500).json({ error: err.message || "Erro ao processar avaliação." });
    }
  },

  async getMedia(req, res) {
    try {
      const { id } = req.params;
      const media = await userService.getAvaliacaoMedia(Number(id));
      return res.json(media);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar média de avaliações." });
    }
  },

  async getByUsuario(req, res) {
    try {
      const { id } = req.params; // universidadeId
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const avaliacao = await userService.getAvaliacaoByUsuario(usuarioId, Number(id));
      return res.json(avaliacao || { nota: null });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar avaliação." });
    }
  }
};

