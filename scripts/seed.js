// scripts/seed.js
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const challenges = [
  // FITNESS - EASY
  { title: '10-Minute Morning Stretch', description: 'Start your day with a full-body stretch routine. Focus on your neck, shoulders, back, and legs. Hold each stretch for 30 seconds. Your body will thank you!', category: 'fitness', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 10 },
  { title: '20 Squats Challenge', description: 'Do 20 bodyweight squats throughout your day. You can split them up — 5 in the morning, 5 at lunch, 10 in the evening. Focus on form over speed.', category: 'fitness', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 5 },
  { title: 'Walk 5,000 Steps', description: "Hit 5,000 steps today. Take the stairs, park farther away, or go for a short walk after meals. Every step counts!", category: 'fitness', difficulty: 'easy', is_outdoor: true, xp_reward: 35, estimated_minutes: 45 },
  { title: '2-Minute Plank Hold', description: 'Hold a plank for 2 minutes total — you can break it into sets. Keep your core tight, back flat, and breathe steadily. A foundation move for total body strength.', category: 'fitness', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 10 },
  
  // FITNESS - MEDIUM
  { title: '30-Minute Run or Jog', description: "Lace up and get moving for 30 minutes. Walk if you need to, jog when you can. The goal is to keep your heart rate elevated and finish strong.", category: 'fitness', difficulty: 'medium', is_outdoor: true, xp_reward: 60, estimated_minutes: 30 },
  { title: 'HIIT Home Workout', description: 'Complete 4 rounds of: 15 burpees, 20 push-ups, 25 jump squats, 30-second rest. Rest 1 minute between rounds. Intense but transformative.', category: 'fitness', difficulty: 'medium', is_outdoor: false, xp_reward: 70, estimated_minutes: 25 },
  { title: 'Bike Ride or Cycle 10km', description: 'Head outside for a 10km bike ride, or hop on a stationary bike. Maintain a steady pace and focus on your breathing and cadence.', category: 'fitness', difficulty: 'medium', is_outdoor: true, xp_reward: 65, estimated_minutes: 40 },
  { title: '100 Push-Up Challenge', description: 'Complete 100 push-ups throughout the day. Break them into sets as needed — 10x10, 5x20, whatever works for you. Track your progress and complete all 100!', category: 'fitness', difficulty: 'medium', is_outdoor: false, xp_reward: 70, estimated_minutes: 30 },

  // FITNESS - HARD
  { title: 'Run a 5K', description: "Push yourself and run a full 5 kilometers today. No stopping — slow down if you need to, but keep moving. This is a major milestone worth celebrating!", category: 'fitness', difficulty: 'hard', is_outdoor: true, xp_reward: 120, estimated_minutes: 35 },
  { title: 'Full Body Workout - 45 Minutes', description: 'Complete a full-body strength session: 3x10 squats, 3x8 pull-ups, 3x12 dumbbell press, 3x15 rows, 3x20 lunges, and 3x1 min plank. Rest 60s between sets.', category: 'fitness', difficulty: 'hard', is_outdoor: false, xp_reward: 130, estimated_minutes: 45 },
  { title: '10km Outdoor Hike', description: 'Find a trail and complete a 10km hike today. Bring water, wear proper shoes, and enjoy the journey. Nature + exercise is the ultimate combination.', category: 'fitness', difficulty: 'hard', is_outdoor: true, xp_reward: 150, estimated_minutes: 120 },

  // PRODUCTIVITY - EASY
  { title: 'Write Tomorrow\'s To-Do List', description: "Before your day ends, spend 5 minutes writing down your top 3 priorities for tomorrow. A clear plan = a focused mind.", category: 'productivity', difficulty: 'easy', is_outdoor: false, xp_reward: 25, estimated_minutes: 5 },
  { title: 'Clean Your Workspace', description: 'Spend 15 minutes decluttering and organizing your desk or workspace. A clean environment leads to a clear mind and better focus.', category: 'productivity', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 15 },
  { title: 'Inbox Zero Challenge', description: 'Tackle your email inbox! Archive, reply, or delete until you reach zero unread emails. Set up folders if needed. A clean inbox is a superpower.', category: 'productivity', difficulty: 'easy', is_outdoor: false, xp_reward: 35, estimated_minutes: 20 },
  { title: 'Digital Detox Hour', description: 'Put your phone down for 1 uninterrupted hour. No social media, no scrolling. Use the time for something meaningful — a book, a walk, deep work.', category: 'productivity', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 60 },

  // PRODUCTIVITY - MEDIUM
  { title: '90-Minute Deep Work Sprint', description: 'Block off 90 minutes of completely focused work on your most important project. No distractions. Use the Pomodoro method if needed. Ship something meaningful.', category: 'productivity', difficulty: 'medium', is_outdoor: false, xp_reward: 65, estimated_minutes: 90 },
  { title: 'Learn a New Keyboard Shortcut', description: "Pick your most-used app and learn 5 new keyboard shortcuts. Practice each one 10 times until it's muscle memory. Tiny habits, massive time savings.", category: 'productivity', difficulty: 'medium', is_outdoor: false, xp_reward: 55, estimated_minutes: 20 },
  { title: 'Batch Similar Tasks', description: 'Group all similar tasks (emails, calls, creative work) and do them in dedicated batches today. Notice how much faster you are when context-switching is eliminated.', category: 'productivity', difficulty: 'medium', is_outdoor: false, xp_reward: 60, estimated_minutes: 30 },
  { title: 'Create a Weekly Review', description: 'Review the past week: What did you accomplish? What didn\'t go as planned? What will you change next week? Write at least 200 words of reflection.', category: 'productivity', difficulty: 'medium', is_outdoor: false, xp_reward: 65, estimated_minutes: 30 },

  // PRODUCTIVITY - HARD
  { title: 'Build a Personal System', description: 'Design and document a personal productivity system today. This includes your task management approach, daily routine, energy management, and review process. Write it all down.', category: 'productivity', difficulty: 'hard', is_outdoor: false, xp_reward: 130, estimated_minutes: 120 },
  { title: 'Ship a Side Project Feature', description: 'Work on your side project or passion project for 3 hours today. Define one feature or improvement, build it, and ship it. Progress over perfection.', category: 'productivity', difficulty: 'hard', is_outdoor: false, xp_reward: 150, estimated_minutes: 180 },

  // LEARNING - EASY
  { title: 'Read for 20 Minutes', description: 'Pick up a book — any book — and read for 20 uninterrupted minutes. Fiction, non-fiction, it doesn\'t matter. Just read. Knowledge compounds like interest.', category: 'learning', difficulty: 'easy', is_outdoor: false, xp_reward: 25, estimated_minutes: 20 },
  { title: 'Learn 5 New Words', description: 'Look up 5 words you\'ve seen but never known the definition of. Write them down with their definitions and use each in a sentence. Vocabulary is a superpower.', category: 'learning', difficulty: 'easy', is_outdoor: false, xp_reward: 25, estimated_minutes: 15 },
  { title: 'Watch a TED Talk', description: 'Find a TED talk on a topic you know nothing about. Watch it fully. Then write 3 things you learned in your own words. Curiosity is the engine of growth.', category: 'learning', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 20 },

  // LEARNING - MEDIUM
  { title: 'Start Learning a New Skill', description: 'Pick a skill you\'ve always wanted to learn. Spend 1 hour on it today using YouTube, a course, or a book. Identify what you need to practice and make a 30-day plan.', category: 'learning', difficulty: 'medium', is_outdoor: false, xp_reward: 65, estimated_minutes: 60 },
  { title: 'Teach Someone Something', description: 'Find someone — a friend, family member, or colleague — and teach them something you know well. Teaching is the ultimate way to solidify your own knowledge.', category: 'learning', difficulty: 'medium', is_outdoor: false, xp_reward: 60, estimated_minutes: 30 },
  { title: 'Complete an Online Tutorial', description: 'Find a free tutorial on a topic relevant to your goals — coding, design, finance, cooking — and complete it fully. Document what you learned and what you\'ll do next.', category: 'learning', difficulty: 'medium', is_outdoor: false, xp_reward: 70, estimated_minutes: 90 },

  // LEARNING - HARD
  { title: 'Write a 500-Word Essay', description: 'Pick a topic you\'re curious about and write a well-structured 500-word essay. Research it first, then write. This forces deep understanding and clear thinking.', category: 'learning', difficulty: 'hard', is_outdoor: false, xp_reward: 130, estimated_minutes: 120 },
  { title: 'Complete a Mini-Course', description: 'Find a free mini-course on Coursera, Khan Academy, or YouTube and complete it in one sitting. Certificate or not, the learning is the reward.', category: 'learning', difficulty: 'hard', is_outdoor: false, xp_reward: 150, estimated_minutes: 180 },

  // FUN - EASY
  { title: 'Watch a Sunset or Sunrise', description: 'Step outside and watch either the sunrise or sunset today. No phone, no distractions. Just you and the sky. Capture a photo if you want — but mostly just experience it.', category: 'fun', difficulty: 'easy', is_outdoor: true, xp_reward: 25, estimated_minutes: 20 },
  { title: 'Cook a New Recipe', description: 'Pick a recipe you\'ve never made before and cook it today. It doesn\'t have to be fancy — a new pasta dish or a smoothie bowl counts. Enjoy what you create!', category: 'fun', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 45 },
  { title: 'Draw or Doodle for 15 Minutes', description: "Grab a pen and paper and just draw. It doesn't matter if it's good. Draw something in front of you, from memory, or pure imagination. Creativity is a muscle.", category: 'fun', difficulty: 'easy', is_outdoor: false, xp_reward: 25, estimated_minutes: 15 },
  { title: 'Play Your Favorite Music Loudly', description: 'Put on your favorite playlist and actually listen — sing along, dance, feel it. Music is medicine. Give yourself permission to enjoy it fully today.', category: 'fun', difficulty: 'easy', is_outdoor: false, xp_reward: 20, estimated_minutes: 20 },

  // FUN - MEDIUM
  { title: 'Explore a New Part of Your City', description: 'Go somewhere in your city you\'ve never been before. A new neighborhood, park, restaurant, or street. Take photos, notice details, be a tourist in your own home.', category: 'fun', difficulty: 'medium', is_outdoor: true, xp_reward: 60, estimated_minutes: 90 },
  { title: 'Start a Creative Project', description: 'Begin a creative project today: a short story, a drawing, a song, a video, a photo essay. Define what it is, create the first piece, and share it with at least one person.', category: 'fun', difficulty: 'medium', is_outdoor: false, xp_reward: 70, estimated_minutes: 60 },

  // FUN - HARD
  { title: 'Organize a Game Night', description: 'Plan and host a game night with friends or family. Board games, video games, or outdoor games — you choose. The challenge is to make it happen today, not "someday".', category: 'fun', difficulty: 'hard', is_outdoor: false, xp_reward: 120, estimated_minutes: 180 },

  // SOCIAL - EASY
  { title: 'Send a Genuine Compliment', description: 'Send a heartfelt compliment to someone who deserves it. Not a generic one — something specific and genuine. You\'ll make their day and yours.', category: 'social', difficulty: 'easy', is_outdoor: false, xp_reward: 25, estimated_minutes: 5 },
  { title: 'Call Someone You\'ve Been Meaning To', description: 'Think of someone you\'ve been meaning to call but haven\'t. Call them today. A real phone call, not a text. Reconnection is a gift you give and receive.', category: 'social', difficulty: 'easy', is_outdoor: false, xp_reward: 30, estimated_minutes: 20 },
  { title: 'Thank Someone Who Helped You', description: 'Think of someone who helped you recently (or in the past) and thank them. In person, by message, or by letter. Gratitude strengthens every relationship.', category: 'social', difficulty: 'easy', is_outdoor: false, xp_reward: 25, estimated_minutes: 10 },

  // SOCIAL - MEDIUM
  { title: 'Have a Deep Conversation', description: "Have a real, meaningful conversation with someone today — no small talk. Ask them about their dreams, fears, or what they've learned recently. Connection is everything.", category: 'social', difficulty: 'medium', is_outdoor: false, xp_reward: 60, estimated_minutes: 30 },
  { title: 'Join a Community Event', description: 'Find and attend a local meetup, community event, workshop, or club meeting. Online or in-person. Step outside your comfort zone and meet someone new.', category: 'social', difficulty: 'medium', is_outdoor: true, xp_reward: 70, estimated_minutes: 120 },
  { title: 'Volunteer for 2 Hours', description: 'Find a local volunteer opportunity and give 2 hours of your time to a cause or community. Generosity of time is the most valuable form of giving.', category: 'social', difficulty: 'medium', is_outdoor: true, xp_reward: 80, estimated_minutes: 120 },

  // SOCIAL - HARD
  { title: 'Plan and Host a Gathering', description: 'Organize a dinner, brunch, or hangout for at least 3 people today. Cook, order food, or suggest a restaurant — but make it happen. Community requires initiative.', category: 'social', difficulty: 'hard', is_outdoor: false, xp_reward: 130, estimated_minutes: 180 },
  { title: 'Mentor Someone for an Hour', description: 'Find someone who could benefit from your experience and mentor them for at least an hour. Share your knowledge generously. Great leaders always give back.', category: 'social', difficulty: 'hard', is_outdoor: false, xp_reward: 140, estimated_minutes: 60 },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding challenges...');
    
    for (const challenge of challenges) {
      await client.query(
        `INSERT INTO challenges (title, description, category, difficulty, is_outdoor, xp_reward, estimated_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [challenge.title, challenge.description, challenge.category, challenge.difficulty, challenge.is_outdoor, challenge.xp_reward, challenge.estimated_minutes]
      );
    }
    
    console.log(`✅ Seeded ${challenges.length} challenges successfully!`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
