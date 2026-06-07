import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getCorsHeaders(_req: Request) {
  return corsHeaders;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[validate-quiz] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('[validate-quiz] Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('[validate-quiz] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { answers, lessonId } = await req.json();

    if (!lessonId || typeof lessonId !== 'string') {
      console.error('[validate-quiz] Missing or invalid lessonId');
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      console.error('[validate-quiz] Missing or invalid answers array');
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (answers.length > 100) {
      console.error('[validate-quiz] Too many answers:', answers.length);
      return new Response(
        JSON.stringify({ error: 'Too many answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questionIds = answers.map((a: { questionId: string }) => a.questionId);
    if (new Set(questionIds).size !== questionIds.length) {
      console.error('[validate-quiz] Duplicate question IDs detected');
      return new Response(
        JSON.stringify({ error: 'Duplicate questions not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[validate-quiz] Validating answers:', { userId: user.id, lessonId, answerCount: answers.length });

    const validationResults = await Promise.all(
      answers.map(async ({ questionId, userAnswer }: { questionId: string; userAnswer: number }) => {
        try {
          if (!questionId || typeof questionId !== 'string') {
            throw new Error('Invalid question ID');
          }

          if (typeof userAnswer !== 'number' || userAnswer < 0 || userAnswer > 3 || !Number.isInteger(userAnswer)) {
            throw new Error('Invalid answer value');
          }

          const { data, error } = await supabaseAdmin
            .from('questions')
            .select('correct_answer, lesson_id')
            .eq('id', questionId)
            .single();

          if (error) {
            console.error('[validate-quiz] Error fetching question:', { questionId, error: error.message });
            throw new Error('Question not found');
          }

          if (data.lesson_id !== lessonId) {
            console.error('[validate-quiz] Question-lesson mismatch:', { questionId, lessonId });
            throw new Error('Invalid question');
          }

          const isCorrect = userAnswer === data.correct_answer;
          console.log('[validate-quiz] Validated answer:', { questionId, isCorrect });

          return { questionId, isCorrect };
        } catch (err) {
          console.error('[validate-quiz] Validation error for question:', { questionId, error: err });
          throw err;
        }
      })
    );

    const correctCount = validationResults.filter(r => r.isCorrect).length;
    const totalQuestions = answers.length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = score >= 80;

    console.log('[validate-quiz] Complete:', { userId: user.id, correctCount, totalQuestions, score, passed });

    const { error: progressError } = await supabaseAdmin
      .from('user_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        score: Math.round(score),
        completed_at: passed ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,lesson_id' });

    if (progressError) {
      console.error('[validate-quiz] Error saving user progress:', progressError.message);
    }

    return new Response(
      JSON.stringify({
        correctCount,
        totalQuestions,
        score,
        passed,
        results: validationResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[validate-quiz] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Quiz validation failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});