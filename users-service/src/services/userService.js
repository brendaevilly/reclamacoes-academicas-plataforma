<<<<<<< HEAD
/*

APENAS PARA TESTE DOS CONTAINERS - APENAS PARA TESTE DOS CONTAINERS

*/

export default {
    async register(data) {
        return {
            status: 201,
            message: "Usuário registrado com sucesso!",
        };
    },

    async login(data) {
        return {
            status: 200,
            message: "Login realizado",
            token: "jwt-mock",
        };
    }
};
=======
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Universidade } from "../models/Universidade.js";
import { Avaliacao } from "../models/Avaliacao.js";
import { prisma } from "../database/connection.js";

export const userService = {
  async cadastro(data) {
    const userExists = await User.findByEmail(data.email);
    if (userExists) return null;

    const hash = await bcrypt.hash(data.senha, 10);

    return await User.create({
      nome: data.nome,
      email: data.email,
      senha: hash
    });
  },

  async login(email, senha) {
    const user = await User.findByEmail(email);
    console.log("USER =", user);
    if (!user) return null;

    const valid = await bcrypt.compare(senha, user.senha);
    console.log("VALID PASSWORD?", valid); 
    if (valid != true) return null;

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    console.log(user);
    console.log(token);

    const { senha: _, ...userSemSenha } = user;
    return { user: userSemSenha, token };
  },

  findAll: () => User.findAll(),
  findById: (id) => User.findById(id),
  update: (id, data) => User.update(id, data),
  delete: (id) => User.delete(id),

  // Métodos para Universidades
  async cadastroUniversidade(data) {
    const univExistsByCampus = await Universidade.findByCampus(data.campus);
    const univExistsByEmail = await Universidade.findByEmail(data.email);
    if (univExistsByCampus || univExistsByEmail) return null;

    const hash = await bcrypt.hash(data.senha, 10);

    return await Universidade.create({
      nome: data.nome,
      sigla: data.sigla,
      campus: data.campus,
      email: data.email,
      senha: hash
    });
  },

  async loginUniversidade(email, senha) {
    const universidade = await Universidade.findByEmail(email);
    if (!universidade) return null;

    const valid = await bcrypt.compare(senha, universidade.senha);
    if (!valid) return null;

    const token = jwt.sign(
        { id: universidade.id, email: universidade.email, type: 'universidade' },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    const { senha: _, ...univSemSenha } = universidade;
    return { user: univSemSenha, token };
  },

  findAllUniversidades: () => Universidade.findAll(),
  findUniversidadeById: (id) => Universidade.findById(id),
  searchUniversidades: async (query) => {
    const searchTerm = query?.trim() || "";
    
    if (!searchTerm) {
      return Universidade.findAll();
    }

    try {
      // Buscar todas as universidades e filtrar no código (mais compatível)
      const todasUniversidades = await prisma.universidade.findMany({
        select: {
          id: true,
          nome: true,
          sigla: true,
          campus: true,
          email: true
        }
      });

      // Filtrar case-insensitive
      const termoLower = searchTerm.toLowerCase();
      const resultados = todasUniversidades.filter(uni => {
        const nomeLower = (uni.nome || "").toLowerCase();
        const siglaLower = (uni.sigla || "").toLowerCase();
        const campusLower = (uni.campus || "").toLowerCase();
        
        return nomeLower.includes(termoLower) || 
               siglaLower.includes(termoLower) || 
               campusLower.includes(termoLower);
      });

      return resultados;
    } catch (error) {
      console.error("Erro ao buscar universidades:", error);
      throw error;
    }
  },
  updateUniversidade: (id, data) => Universidade.update(id, data),
  deleteUniversidade: (id) => Universidade.delete(id),

  // Métodos para Avaliações
  createOrUpdateAvaliacao: (data) => Avaliacao.createOrUpdate(data),
  getAvaliacaoMedia: (universidadeId) => Avaliacao.getAverageRating(universidadeId),
  getAvaliacaoByUsuario: (usuarioId, universidadeId) => 
    Avaliacao.findByUsuarioAndUniversidade(usuarioId, universidadeId),
};
>>>>>>> origin/brenda
