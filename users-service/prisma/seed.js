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
    { nome: 'Segurança', descricao: 'Problemas de segurança no campus' }
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
  const campusNome = 'Campus Senador Helvídio Nunes de Barros';
  const universidade = await prisma.universidade.upsert({
    where: { campus: campusNome },
    update: {},
    create: {
      nome: 'Universidade Federal do Piauí',
      sigla: 'UFPI',
      campus: campusNome, 
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
