import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Criar categorias padrão
  const categorias = [
    { nome: 'Infraestrutura', descricao: 'Problemas relacionados à estrutura física' },
    { nome: 'Atendimento', descricao: 'Questões sobre atendimento administrativo' },
    { nome: 'Ensino', descricao: 'Problemas relacionados ao ensino e professores' },
    { nome: 'Alimentação', descricao: 'Questões sobre cantina e refeitório' },
    { nome: 'Segurança', descricao: 'Problemas de segurança no campus' },
    { nome: 'Outros', descricao: 'Outras reclamações' }
  ];

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: cat
    });
  }

  console.log('Categorias criadas com sucesso!');
  
  // Criar uma universidade de exemplo
  const universidade = await prisma.universidade.upsert({
    where: { email: 'contato@universidade.edu.br' },
    update: {},
    create: {
      nome: 'Universidade Federal Exemplo',
      email: 'contato@universidade.edu.br',
      senha: '$2a$10$YourHashedPasswordHere', // Senha: senha123
      cnpj: '12345678000199',
      descricao: 'Universidade de exemplo para testes'
    }
  });

  console.log('Universidade de exemplo criada!');
  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
