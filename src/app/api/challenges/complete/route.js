// src/app/api/challenges/complete/route.js
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { completeChallenge, getUserChallengeMeta } from '@/lib/challenges';
import { uploadToCloudinary } from '@/lib/cloudinary';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function validateAndReact({ challengeTitle, difficulty, category, proofText, streak }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { valid: true, reason: null, reaction: null };

  try {
    const streakText = streak > 0
      ? `They now have a ${streak + 1}-day streak.`
      : 'This is their first completed challenge.';

    const systemPrompt = `You are a strict but fair challenge completion validator and coach for a habit-building app.

Your job is to:
1. Decide if the user's proof text shows they genuinely attempted the challenge
2. If genuine, write a short personal reaction

VALIDATION RULES — mark as INVALID if the proof:
- Is too short or vague (e.g. "done", "ok", "yes", "completed", "did it", single words or very short phrases under 15 characters)
- Is clearly unrelated to the challenge
- Is just punctuation, numbers, or gibberish
- Shows no actual effort or detail whatsoever

Mark as VALID if the proof:
- Describes what they actually did, even briefly
- Mentions any detail about the experience (how it felt, what happened, any difficulty)
- Shows genuine engagement with the task

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "valid": true or false,
  "reason": "if invalid, brief reason why (1 sentence). if valid, null",
  "reaction": "if valid, your 2-3 sentence personal reaction to their specific proof. if invalid, null"
}

For reactions: be specific to what they wrote, sound like a supportive friend, use max 1 emoji, never say generic things like "Great job!" or "Amazing work!"`;

    const userPrompt = `Challenge: "${challengeTitle}" (${difficulty} difficulty, ${category} category)
${streakText}

User's proof text:
"${proofText}"

Validate and react.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return { valid: true, reason: null, reaction: null };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) return { valid: true, reason: null, reaction: null };

    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        valid: parsed.valid === true,
        reason: parsed.reason || null,
        reaction: parsed.reaction || null,
      };
    } catch {
      console.error('Failed to parse Groq JSON:', text);
      return { valid: true, reason: null, reaction: null };
    }
  } catch (err) {
    console.error('Groq error:', err);
    return { valid: true, reason: null, reaction: null };
  }
}

export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let proofImageUrl = null;
    let proofText = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      proofText = formData.get('proofText') || null;

      const proofFile = formData.get('proof');
      if (proofFile && proofFile.size > 0) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(proofFile.type)) {
          return NextResponse.json(
            { error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.' },
            { status: 400 }
          );
        }
        if (proofFile.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 });
        }
        const buffer = Buffer.from(await proofFile.arrayBuffer());
        proofImageUrl = await uploadToCloudinary(buffer, proofFile.name);
      }
    } else {
      const body = await request.json().catch(() => ({}));
      proofText = body.proofText || null;
    }

    if (!proofText || proofText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Proof description is required. Please describe how you completed the challenge.' },
        { status: 400 }
      );
    }

    // Hard minimum before calling AI
    if (proofText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please write a bit more about how you completed the challenge.', proofRejected: true },
        { status: 400 }
      );
    }

    // Get today's challenge metadata for validation
    const meta = await getUserChallengeMeta(authUser.userId);

    if (!meta) {
      return NextResponse.json(
        { error: 'No challenge found for today, or it is already completed.' },
        { status: 400 }
      );
    }

    // Validate proof + generate reaction in one Groq call
    const { valid, reason, reaction } = await validateAndReact({
      challengeTitle: meta.title,
      difficulty: meta.difficulty,
      category: meta.category,
      proofText: proofText.trim(),
      streak: meta.currentStreak,
    });

    if (!valid) {
      return NextResponse.json(
        {
          error: reason || 'Your proof does not seem genuine. Please describe what you actually did.',
          proofRejected: true,
        },
        { status: 400 }
      );
    }

    // Proof is valid — save completion
    const result = await completeChallenge(authUser.userId, proofImageUrl, proofText.trim());

    return NextResponse.json({ success: true, ...result, claudeReaction: reaction });
  } catch (err) {
    console.error('Complete challenge error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}