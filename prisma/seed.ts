import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool as any)


const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Começando o seed...')

  try {
     await prisma.tentativaResposta.deleteMany()
     await prisma.tentativaProva.deleteMany()
     await prisma.resposta.deleteMany()
     await prisma.pergunta.deleteMany()
     await prisma.prova.deleteMany()
     await prisma.fabricante.deleteMany()
     await prisma.usuario.deleteMany()
  } catch (e) {
     console.log('⚠️ Aviso: Tabelas já estavam vazias ou erro ao limpar.')
  }

  const usuario = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      username: 'admin',
      senhaHash: 'senha123',
      email: 'admin@empresa.com',
    }
  })

  const fabricante = await prisma.fabricante.create({
    data: {
      nome: 'AWS',
      site: 'https://aws.amazon.com',
      areaAtuacao: 'Cloud Computing'
    }
  })

  await prisma.prova.create({
    data: {
      nome: 'AWS Cloud Practitioner',
      categoria: 'Cloud',
      tempoLimiteMinutos: 45,
      qtdPerguntasSorteio: 2,
      notaCorte: 7.0,
      validadeMeses: 36,
      fabricanteId: fabricante.id,
      perguntas: {
        create: [
          {
            enunciado: 'Qual serviço é considerado Serverless?',
            respostas: {
              create: [
                { textoAlternativa: 'EC2', ehCorreta: false },
                { textoAlternativa: 'Lambda', ehCorreta: true },
                { textoAlternativa: 'RDS', ehCorreta: false },
                { textoAlternativa: 'S3', ehCorreta: false },
              ]
            }
          },
          {
            enunciado: 'Para armazenamento de objetos, qual serviço usar?',
            respostas: {
              create: [
                { textoAlternativa: 'EBS', ehCorreta: false },
                { textoAlternativa: 'S3', ehCorreta: true },
                { textoAlternativa: 'Glacier', ehCorreta: false },
                { textoAlternativa: 'EFS', ehCorreta: false },
              ]
            }
          }
        ]
      }
    }
  })

  console.log(`✅ Seed finalizado! Usuário criado: ${usuario.nome}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })