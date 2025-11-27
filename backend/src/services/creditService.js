import prisma from '../db/prisma.js';

const CREDITS_PER_SCRAPE = 1; // Each website scrape costs 1 credit

/**
 * Check if user has sufficient credits
 * @param {string} userId - User ID
 * @param {number} required - Number of credits required (default: 1)
 * @returns {Promise<{hasCredits: boolean, currentCredits: number}>}
 */
export async function checkCredits(userId, required = CREDITS_PER_SCRAPE) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    hasCredits: user.credits >= required,
    currentCredits: user.credits
  };
}

/**
 * Deduct credits from user account
 * @param {string} userId - User ID
 * @param {number} amount - Amount of credits to deduct (default: 1)
 * @returns {Promise<{success: boolean, remainingCredits: number}>}
 */
export async function deductCredits(userId, amount = CREDITS_PER_SCRAPE) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: amount
      }
    },
    select: { credits: true }
  });

  return {
    success: true,
    remainingCredits: user.credits
  };
}

/**
 * Add credits to user account
 * @param {string} userId - User ID
 * @param {number} amount - Amount of credits to add
 * @returns {Promise<{success: boolean, newCredits: number}>}
 */
export async function addCredits(userId, amount) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: amount
      }
    },
    select: { credits: true }
  });

  return {
    success: true,
    newCredits: user.credits
  };
}

export { CREDITS_PER_SCRAPE };

