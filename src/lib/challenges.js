// src/lib/challenges.js
import prisma from './prisma';
import { format, subDays } from 'date-fns';

export const XP_COSTS = {
  STREAK_RESTORE: 100,
};

export const XP_REWARDS = {
  easy: 30,
  medium: 60,
  hard: 120,
};

// Helper: get a plain Date at midnight UTC for @db.Date fields
function toDateOnly(d = new Date()) {
  return new Date(format(d, 'yyyy-MM-dd') + 'T00:00:00.000Z');
}

/**
 * Get or generate today's challenge for a user
 */
export async function getTodaysChallenge(userId) {
  const today = toDateOnly();

  const existing = await prisma.userChallenge.findUnique({
    where: { userId_challengeDate: { userId, challengeDate: today } },
    include: { challenge: true },
  });

  if (existing) return flattenUserChallenge(existing);

  return await assignDailyChallenge(userId, today);
}

/**
 * Assign a daily challenge to a user based on their preferences
 */
export async function assignDailyChallenge(userId, date) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { categories: true, difficulty: true, allowOutdoor: true },
  });

  if (!user) throw new Error('User not found');

  const categories = user.categories.length ? user.categories : ['fitness', 'productivity'];
  const difficulty = user.difficulty;
  const allowOutdoor = user.allowOutdoor;

  // Get matching challenge IDs then pick one randomly (Prisma has no ORDER BY RAND())
  const matching = await prisma.challenge.findMany({
    where: {
      category: { in: categories },
      difficulty,
      ...(allowOutdoor ? {} : { isOutdoor: false }),
    },
    select: { id: true },
  });

  let challengeId;
  if (matching.length > 0) {
    challengeId = matching[Math.floor(Math.random() * matching.length)].id;
  } else {
    // Fallback: any challenge of matching difficulty
    const fallback = await prisma.challenge.findMany({
      where: { difficulty },
      select: { id: true },
    });
    if (!fallback.length) throw new Error('No challenges in database. Run: npm run db:seed');
    challengeId = fallback[Math.floor(Math.random() * fallback.length)].id;
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });

  const userChallenge = await prisma.userChallenge.upsert({
    where: { userId_challengeDate: { userId, challengeDate: date } },
    create: { userId, challengeId, challengeDate: date, xpEarned: challenge.xpReward },
    update: {},
    include: { challenge: true },
  });

  return flattenUserChallenge(userChallenge);
}

/**
 * Complete today's challenge
 */
export async function completeChallenge(userId, proofImageUrl = null, proofText = null) {
  const today = toDateOnly();
 
  const userChallenge = await prisma.userChallenge.findUnique({
    where: { userId_challengeDate: { userId, challengeDate: today } },
    include: { challenge: true },
  });
 
  if (!userChallenge) throw new Error('No challenge found for today');
  if (userChallenge.status === 'completed' || userChallenge.status === 'restored') {
    throw new Error('Challenge already completed today');
  }
 
  const xpEarned = userChallenge.challenge?.xpReward ?? XP_REWARDS[userChallenge.challenge?.difficulty ?? 'medium'];
 
  const [, updatedUser] = await prisma.$transaction([
    prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: { status: 'completed', completedAt: new Date(), proofImageUrl, proofText, xpEarned },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { currentStreak: { increment: 1 }, totalXp: { increment: xpEarned } },
    }),
  ]);
 
  // Update best streak if surpassed
  if (updatedUser.currentStreak > updatedUser.bestStreak) {
    await prisma.user.update({
      where: { id: userId },
      data: { bestStreak: updatedUser.currentStreak },
    });
  }
 
  return {
    xpEarned,
    newStreak: updatedUser.currentStreak,
    newBestStreak: Math.max(updatedUser.currentStreak, updatedUser.bestStreak),
    newXP: updatedUser.totalXp,
    // Challenge metadata for Claude reaction
    challengeTitle: userChallenge.customTitle ?? userChallenge.challenge?.title ?? null,
    challengeDifficulty: userChallenge.challenge?.difficulty ?? 'medium',
    challengeCategory: userChallenge.challenge?.category ?? 'general',
  };
}
/**
 * Check and handle missed days — call on every dashboard load
 */
export async function checkAndUpdateStreak(userId) {
  const yesterday = toDateOnly(subDays(new Date(), 1));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, createdAt: true },
  });

  if (!user || user.currentStreak === 0) return;
  const userCreatedAt = toDateOnly(user.createdAt);
  if (userCreatedAt >= yesterday) return;

  const yesterdayChallenge = await prisma.userChallenge.findUnique({
    where: { userId_challengeDate: { userId, challengeDate: yesterday } },
  });

  const missedYesterday =
    !yesterdayChallenge ||
    (yesterdayChallenge.status !== 'completed' && yesterdayChallenge.status !== 'restored');

  if (missedYesterday) {
    const hasPrior = await prisma.userChallenge.findFirst({
      where: { userId, challengeDate: { lt: yesterday } },
    });

    if (hasPrior) {
      await prisma.$transaction([
        prisma.userChallenge.upsert({
          where: { userId_challengeDate: { userId, challengeDate: yesterday } },
          create: { userId, challengeDate: yesterday, status: 'missed', xpEarned: 0 },
          update: { status: 'missed' },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { currentStreak: 0 },
        }),
      ]);
    }
  }
}

/**
 * Count consecutive completed/restored days going backwards from a given date (exclusive).
 * e.g. if the missed day is Day 6, we count Days 5, 4, 3, 2, 1 until a gap is found.
 */
async function countStreakBefore(userId, beforeDate) {
  let streak = 0;
  let checkDate = subDays(beforeDate, 1);

  // Walk backwards day by day until we find a day that wasn't completed/restored
  for (let i = 0; i < 365; i++) {
    const dateOnly = toDateOnly(checkDate);
    const record = await prisma.userChallenge.findUnique({
      where: { userId_challengeDate: { userId, challengeDate: dateOnly } },
      select: { status: true },
    });

    if (record && (record.status === 'completed' || record.status === 'restored')) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Restore streak using XP
 */
export async function restoreStreak(userId) {
  const today = toDateOnly();
  const yesterday = toDateOnly(subDays(new Date(), 1));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXp: true, lastRestoreDate: true, bestStreak: true },
  });

  if (!user) throw new Error('User not found');

  if (user.totalXp < XP_COSTS.STREAK_RESTORE) {
    throw new Error(`Not enough XP. You need ${XP_COSTS.STREAK_RESTORE} XP to restore your streak.`);
  }

  const lastRestoreStr = user.lastRestoreDate ? format(user.lastRestoreDate, 'yyyy-MM-dd') : null;
  if (lastRestoreStr === todayStr) throw new Error('You have already restored your streak today.');

  const missedChallenge = await prisma.userChallenge.findUnique({
    where: { userId_challengeDate: { userId, challengeDate: yesterday } },
  });

  if (!missedChallenge || missedChallenge.status !== 'missed') {
    throw new Error('No missed challenge found for yesterday.');
  }

  // Count how many consecutive days were completed BEFORE the missed day.
  // e.g. if user had a 5-day streak before missing day 6, this returns 5.
  // After restoring the missed day, their streak becomes 5 + 1 = 6.
  const streakBeforeMiss = await countStreakBefore(userId, yesterday);
  const restoredStreak = streakBeforeMiss + 1; // +1 for the restored missed day itself

  // Also account for today if it's already been completed
  const todayChallenge = await prisma.userChallenge.findUnique({
    where: { userId_challengeDate: { userId, challengeDate: today } },
    select: { status: true },
  });
  const todayCompleted =
    todayChallenge?.status === 'completed' || todayChallenge?.status === 'restored';

  const finalStreak = todayCompleted ? restoredStreak + 1 : restoredStreak;
  const newBestStreak = Math.max(finalStreak, user.bestStreak);

  await prisma.$transaction([
    prisma.userChallenge.update({
      where: { id: missedChallenge.id },
      data: { status: 'restored' },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { decrement: XP_COSTS.STREAK_RESTORE },
        currentStreak: finalStreak,
        bestStreak: newBestStreak,
        lastRestoreDate: today,
      },
    }),
    prisma.streakRestore.create({
      data: { userId, xpSpent: XP_COSTS.STREAK_RESTORE, restoredDate: yesterday },
    }),
  ]);

  return { xpSpent: XP_COSTS.STREAK_RESTORE };
}

/**
 * Get challenge history for a user
 */
export async function getChallengeHistory(userId, limit = 30) {
  const records = await prisma.userChallenge.findMany({
    where: { userId },
    include: { challenge: true },
    orderBy: { challengeDate: 'desc' },
    take: limit,
  });

  return records.map(flattenUserChallenge);
}

/**
 * Check if user can restore their streak
 */
export async function getRestoreEligibility(userId) {
  const yesterday = toDateOnly(subDays(new Date(), 1));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [user, missedChallenge] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, lastRestoreDate: true },
    }),
    prisma.userChallenge.findUnique({
      where: { userId_challengeDate: { userId, challengeDate: yesterday } },
      select: { status: true },
    }),
  ]);

  const lastRestoreStr = user?.lastRestoreDate ? format(user.lastRestoreDate, 'yyyy-MM-dd') : null;
  const alreadyRestored = lastRestoreStr === todayStr;

  const canRestore =
    missedChallenge?.status === 'missed' &&
    (user?.totalXp ?? 0) >= XP_COSTS.STREAK_RESTORE &&
    !alreadyRestored;

  return {
    canRestore,
    xpCost: XP_COSTS.STREAK_RESTORE,
    userXP: user?.totalXp ?? 0,
    alreadyRestored,
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function flattenUserChallenge(uc) {
  return {
    id: uc.id,
    userId: uc.userId,
    challengeId: uc.challengeId,
    challengeDate: uc.challengeDate,
    status: uc.status,
    completedAt: uc.completedAt,
    proofImageUrl: uc.proofImageUrl,
    proofText: uc.proofText,
    xpEarned: uc.xpEarned,
    createdAt: uc.createdAt,
    title: uc.customTitle ?? uc.challenge?.title ?? 'Challenge',
    description: uc.customDescription ?? uc.challenge?.description ?? '',
    category: uc.challenge?.category ?? null,
    difficulty: uc.challenge?.difficulty ?? null,
    xpReward: uc.challenge?.xpReward ?? uc.xpEarned,
    estimatedMinutes: uc.challenge?.estimatedMinutes ?? 30,
    isOutdoor: uc.challenge?.isOutdoor ?? false,
  };
}

export async function getUserChallengeMeta(userId) {
  const today = toDateOnly();
 
  const userChallenge = await prisma.userChallenge.findUnique({
    where: { userId_challengeDate: { userId, challengeDate: today } },
    include: {
      challenge: {
        select: { title: true, difficulty: true, category: true },
      },
    },
  });
 
  if (!userChallenge) return null;
 
  // Already completed — don't allow re-completion
  if (userChallenge.status === 'completed' || userChallenge.status === 'restored') {
    return null;
  }
 
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true },
  });
 
  return {
    title: userChallenge.customTitle ?? userChallenge.challenge?.title ?? 'Challenge',
    difficulty: userChallenge.challenge?.difficulty ?? 'medium',
    category: userChallenge.challenge?.category ?? 'general',
    currentStreak: user?.currentStreak ?? 0,
  };
}