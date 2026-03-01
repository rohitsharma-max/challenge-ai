// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const challenges = [
  // FITNESS - EASY
  { title: '10-Minute Morning Stretch', description: 'Start your day with a full-body stretch routine. Focus on your neck, shoulders, back, and legs. Hold each stretch for 30 seconds. Your body will thank you!', category: 'fitness', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 10 },
  { title: '20 Squats Challenge', description: 'Do 20 bodyweight squats throughout your day. Split them up — 5 in the morning, 5 at lunch, 10 in the evening. Focus on form over speed.', category: 'fitness', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 5 },
  { title: 'Walk 5,000 Steps', description: "Hit 5,000 steps today. Take the stairs, park farther away, or go for a short walk after meals. Every step counts!", category: 'fitness', difficulty: 'easy', isOutdoor: true, xpReward: 35, estimatedMinutes: 45 },
  { title: '2-Minute Plank Hold', description: 'Hold a plank for 2 minutes total — you can break it into sets. Keep your core tight, back flat, and breathe steadily.', category: 'fitness', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 10 },
  // FITNESS - MEDIUM
  { title: '30-Minute Run or Jog', description: "Lace up and get moving for 30 minutes. Walk if you need to, jog when you can. Keep your heart rate elevated and finish strong.", category: 'fitness', difficulty: 'medium', isOutdoor: true, xpReward: 60, estimatedMinutes: 30 },
  { title: 'HIIT Home Workout', description: 'Complete 4 rounds of: 15 burpees, 20 push-ups, 25 jump squats, 30-second rest. Rest 1 minute between rounds.', category: 'fitness', difficulty: 'medium', isOutdoor: false, xpReward: 70, estimatedMinutes: 25 },
  { title: 'Bike Ride 10km', description: 'Head outside for a 10km bike ride, or hop on a stationary bike. Maintain a steady pace and focus on your breathing.', category: 'fitness', difficulty: 'medium', isOutdoor: true, xpReward: 65, estimatedMinutes: 40 },
  { title: '100 Push-Up Challenge', description: 'Complete 100 push-ups throughout the day. Break them into sets as needed. Track your progress and complete all 100!', category: 'fitness', difficulty: 'medium', isOutdoor: false, xpReward: 70, estimatedMinutes: 30 },
  // FITNESS - HARD
  { title: 'Run a 5K', description: "Push yourself and run a full 5 kilometers today. No stopping — slow down if you need to, but keep moving!", category: 'fitness', difficulty: 'hard', isOutdoor: true, xpReward: 120, estimatedMinutes: 35 },
  { title: 'Full Body Workout - 45 Minutes', description: 'Complete a full-body strength session: 3x10 squats, 3x8 pull-ups, 3x12 dumbbell press, 3x15 rows, 3x20 lunges, 3x1 min plank.', category: 'fitness', difficulty: 'hard', isOutdoor: false, xpReward: 130, estimatedMinutes: 45 },
  { title: '10km Outdoor Hike', description: 'Find a trail and complete a 10km hike today. Bring water, wear proper shoes, and enjoy the journey.', category: 'fitness', difficulty: 'hard', isOutdoor: true, xpReward: 150, estimatedMinutes: 120 },
  // PRODUCTIVITY - EASY
  { title: "Write Tomorrow's To-Do List", description: "Before your day ends, spend 5 minutes writing down your top 3 priorities for tomorrow. A clear plan = a focused mind.", category: 'productivity', difficulty: 'easy', isOutdoor: false, xpReward: 25, estimatedMinutes: 5 },
  { title: 'Clean Your Workspace', description: 'Spend 15 minutes decluttering and organizing your desk or workspace. A clean environment leads to a clear mind.', category: 'productivity', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 15 },
  { title: 'Inbox Zero Challenge', description: 'Tackle your email inbox! Archive, reply, or delete until you reach zero unread emails.', category: 'productivity', difficulty: 'easy', isOutdoor: false, xpReward: 35, estimatedMinutes: 20 },
  { title: 'Digital Detox Hour', description: 'Put your phone down for 1 uninterrupted hour. No social media, no scrolling. Use the time for something meaningful.', category: 'productivity', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 60 },
  // PRODUCTIVITY - MEDIUM
  { title: '90-Minute Deep Work Sprint', description: 'Block off 90 minutes of completely focused work on your most important project. No distractions.', category: 'productivity', difficulty: 'medium', isOutdoor: false, xpReward: 65, estimatedMinutes: 90 },
  { title: 'Learn 5 New Keyboard Shortcuts', description: "Pick your most-used app and learn 5 new keyboard shortcuts. Practice each one 10 times until it's muscle memory.", category: 'productivity', difficulty: 'medium', isOutdoor: false, xpReward: 55, estimatedMinutes: 20 },
  { title: 'Batch Similar Tasks', description: 'Group all similar tasks (emails, calls, creative work) and do them in dedicated batches today.', category: 'productivity', difficulty: 'medium', isOutdoor: false, xpReward: 60, estimatedMinutes: 30 },
  { title: 'Create a Weekly Review', description: "Review the past week: What did you accomplish? What didn't go as planned? Write at least 200 words of reflection.", category: 'productivity', difficulty: 'medium', isOutdoor: false, xpReward: 65, estimatedMinutes: 30 },
  // PRODUCTIVITY - HARD
  { title: 'Build a Personal System', description: 'Design and document a personal productivity system today. Includes task management, daily routine, energy management, and review process.', category: 'productivity', difficulty: 'hard', isOutdoor: false, xpReward: 130, estimatedMinutes: 120 },
  { title: 'Ship a Side Project Feature', description: 'Work on your side project for 3 hours today. Define one feature, build it, and ship it. Progress over perfection.', category: 'productivity', difficulty: 'hard', isOutdoor: false, xpReward: 150, estimatedMinutes: 180 },
  // LEARNING - EASY
  { title: 'Read for 20 Minutes', description: "Pick up a book — any book — and read for 20 uninterrupted minutes. Knowledge compounds like interest.", category: 'learning', difficulty: 'easy', isOutdoor: false, xpReward: 25, estimatedMinutes: 20 },
  { title: 'Learn 5 New Words', description: "Look up 5 words you've seen but never knew. Write them with definitions and use each in a sentence.", category: 'learning', difficulty: 'easy', isOutdoor: false, xpReward: 25, estimatedMinutes: 15 },
  { title: 'Watch a TED Talk', description: 'Find a TED talk on a topic you know nothing about. Watch it fully. Then write 3 things you learned.', category: 'learning', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 20 },
  // LEARNING - MEDIUM
  { title: 'Start Learning a New Skill', description: "Pick a skill you've always wanted. Spend 1 hour on it today. Identify what you need to practice and make a 30-day plan.", category: 'learning', difficulty: 'medium', isOutdoor: false, xpReward: 65, estimatedMinutes: 60 },
  { title: 'Teach Someone Something', description: "Find someone and teach them something you know well. Teaching is the ultimate way to solidify knowledge.", category: 'learning', difficulty: 'medium', isOutdoor: false, xpReward: 60, estimatedMinutes: 30 },
  { title: 'Complete an Online Tutorial', description: 'Find a free tutorial on a relevant topic and complete it fully. Document what you learned and what you will do next.', category: 'learning', difficulty: 'medium', isOutdoor: false, xpReward: 70, estimatedMinutes: 90 },
  // LEARNING - HARD
  { title: 'Write a 500-Word Essay', description: "Pick a topic you're curious about and write a well-structured 500-word essay. Research it first, then write.", category: 'learning', difficulty: 'hard', isOutdoor: false, xpReward: 130, estimatedMinutes: 120 },
  { title: 'Complete a Mini-Course', description: 'Find a free mini-course on Coursera, Khan Academy, or YouTube and complete it in one sitting.', category: 'learning', difficulty: 'hard', isOutdoor: false, xpReward: 150, estimatedMinutes: 180 },
  // FUN - EASY
  { title: 'Watch a Sunset or Sunrise', description: 'Step outside and watch either the sunrise or sunset today. No phone, no distractions. Just you and the sky.', category: 'fun', difficulty: 'easy', isOutdoor: true, xpReward: 25, estimatedMinutes: 20 },
  { title: 'Cook a New Recipe', description: "Pick a recipe you've never made before and cook it today. Enjoy what you create!", category: 'fun', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 45 },
  { title: 'Draw or Doodle for 15 Minutes', description: "Grab a pen and paper and just draw. It doesn't matter if it's good. Creativity is a muscle.", category: 'fun', difficulty: 'easy', isOutdoor: false, xpReward: 25, estimatedMinutes: 15 },
  { title: 'Play Your Favorite Music Loudly', description: 'Put on your favorite playlist and actually listen — sing along, dance, feel it. Music is medicine.', category: 'fun', difficulty: 'easy', isOutdoor: false, xpReward: 20, estimatedMinutes: 20 },
  // FUN - MEDIUM
  { title: 'Explore a New Part of Your City', description: "Go somewhere in your city you've never been before. Take photos, notice details, be a tourist in your own home.", category: 'fun', difficulty: 'medium', isOutdoor: true, xpReward: 60, estimatedMinutes: 90 },
  { title: 'Start a Creative Project', description: 'Begin a creative project today: a short story, a drawing, a song, a video. Define it, create the first piece, and share it.', category: 'fun', difficulty: 'medium', isOutdoor: false, xpReward: 70, estimatedMinutes: 60 },
  // FUN - HARD
  { title: 'Organize a Game Night', description: 'Plan and host a game night with friends or family. Make it happen today, not someday.', category: 'fun', difficulty: 'hard', isOutdoor: false, xpReward: 120, estimatedMinutes: 180 },
  // SOCIAL - EASY
  { title: 'Send a Genuine Compliment', description: "Send a heartfelt, specific compliment to someone who deserves it. You'll make their day and yours.", category: 'social', difficulty: 'easy', isOutdoor: false, xpReward: 25, estimatedMinutes: 5 },
  { title: "Call Someone You've Been Meaning To", description: "Think of someone you've been meaning to call but haven't. Call them today — a real phone call, not a text.", category: 'social', difficulty: 'easy', isOutdoor: false, xpReward: 30, estimatedMinutes: 20 },
  { title: 'Thank Someone Who Helped You', description: 'Think of someone who helped you and thank them. In person, by message, or by letter. Gratitude strengthens relationships.', category: 'social', difficulty: 'easy', isOutdoor: false, xpReward: 25, estimatedMinutes: 10 },
  // SOCIAL - MEDIUM
  { title: 'Have a Deep Conversation', description: "Have a real, meaningful conversation with someone today — no small talk. Ask about their dreams or fears.", category: 'social', difficulty: 'medium', isOutdoor: false, xpReward: 60, estimatedMinutes: 30 },
  { title: 'Join a Community Event', description: 'Find and attend a local meetup, workshop, or club meeting. Step outside your comfort zone and meet someone new.', category: 'social', difficulty: 'medium', isOutdoor: true, xpReward: 70, estimatedMinutes: 120 },
  { title: 'Volunteer for 2 Hours', description: 'Find a local volunteer opportunity and give 2 hours of your time. Generosity of time is the most valuable form of giving.', category: 'social', difficulty: 'medium', isOutdoor: true, xpReward: 80, estimatedMinutes: 120 },
  // SOCIAL - HARD
  { title: 'Plan and Host a Gathering', description: 'Organize a dinner, brunch, or hangout for at least 3 people today. Community requires initiative.', category: 'social', difficulty: 'hard', isOutdoor: false, xpReward: 130, estimatedMinutes: 180 },
  { title: 'Mentor Someone for an Hour', description: "Find someone who could benefit from your experience and mentor them for at least an hour. Great leaders always give back.", category: 'social', difficulty: 'hard', isOutdoor: false, xpReward: 140, estimatedMinutes: 60 },
];

async function main() {
  console.log('🌱 Seeding challenges...');

  for (const c of challenges) {
    await prisma.challenge.create({ data: c });
  }

  console.log(`✅ Seeded ${challenges.length} challenges!`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
