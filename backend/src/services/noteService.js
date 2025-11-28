import prisma from '../db/prisma.js';

export const listCompanyNotes = async (companyId, userId) => {
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId }
  });

  if (!company) {
    return null;
  }

  const notes = await prisma.companyNote.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  return { company, notes };
};

export const createCompanyNote = async ({ companyId, authorId, body }) => {
  return prisma.companyNote.create({
    data: {
      companyId,
      userId: authorId,
      body
    },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });
};

export const deleteCompanyNote = async ({ noteId, userId }) => {
  const note = await prisma.companyNote.findUnique({
    where: { id: noteId },
    include: { user: true, company: true }
  });

  if (!note || note.company.userId !== userId) {
    return false;
  }

  await prisma.companyNote.delete({
    where: { id: noteId }
  });

  return true;
};

