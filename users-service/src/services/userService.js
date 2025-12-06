import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Universidade } from "../models/Universidade.js";

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
  delete: (id) => User.delete(id),

  // Métodos para Universidades
  async cadastroUniversidade(data) {
    const univExists = await Universidade.findByEmail(data.email);
    if (univExists) return null;

    if (data.cnpj) {
      const cnpjExists = await Universidade.findByCnpj(data.cnpj);
      if (cnpjExists) return null;
    }

    const hash = await bcrypt.hash(data.senha, 10);

    return await Universidade.create({
      nome: data.nome,
      email: data.email,
      senha: hash,
      cnpj: data.cnpj,
      descricao: data.descricao
    });
  },

  async loginUniversidade(email, senha) {
    const univ = await Universidade.findByEmail(email);
    if (!univ) return null;

    const valid = await bcrypt.compare(senha, univ.senha);
    if (!valid) return null;

    const token = jwt.sign(
      { id: univ.id, email: univ.email, tipo: 'universidade' },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Remover a senha antes de retornar o objeto universidade
    const { senha: _, ...univSemSenha } = univ;
    return { universidade: univSemSenha, token };
  },

  findAllUniversidades: () => Universidade.findAll(),
  findUniversidadeById: (id) => Universidade.findById(id),
  updateUniversidade: (id, data) => Universidade.update(id, data),
  deleteUniversidade: (id) => Universidade.delete(id),
};