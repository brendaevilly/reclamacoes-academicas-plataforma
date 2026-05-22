import { userService } from "../services/userService.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000 // 1 dia
}

export const universidadeController = {
  async cadastro(req, res) {
    try {
      const universidade = await userService.cadastroUniversidade(req.body);
      if (!universidade) {
        return res.status(400).json({ error: "Universidade já cadastrada para este campus." });
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
      res.cookie("token", data.token, COOKIE_OPTIONS);
      return res.json({ user: data.user, token: data.token });
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
  },

  async logout(req, res) {
    res.clearCookie("token");
    return res.json({ message: "Logout realizado com sucesso." });
  },


  async list(req, res) {
    try {
      let { search } = req.query;

      // Tratar caso search venha como array (quando há múltiplos parâmetros)
      if (Array.isArray(search)) {
        search = search[0];
      }

      // Converter para string e fazer trim
      const searchTerm = search ? String(search).trim() : "";

      console.log("Parâmetro search recebido:", searchTerm);

      if (searchTerm && searchTerm.length > 0) {
        const universidades = await userService.searchUniversidades(searchTerm);
        console.log("Resultados da busca:", universidades.length);
        return res.json(universidades);
      }

      const universidades = await userService.findAllUniversidades();
      return res.json(universidades);
    } catch (err) {
      console.error("Erro no controller list:", err);
      return res.status(500).json({ error: err.message || "Erro ao listar universidades." });
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
