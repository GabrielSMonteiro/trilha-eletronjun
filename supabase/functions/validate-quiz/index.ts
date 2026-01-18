import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allowed origins for CORS
const allowedOrigins = [
  'https://capacitajun.lovable.app',
  'https://id-preview--49237a54-d6b9-46c3-8832-ee93741bf305.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080'
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify authorization
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

    // Create admin client for data access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to verify auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify authenticated user
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
    
    console.log('[validate-quiz] Validating answers:', { userId: user.id, lessonId, answerCount: answers.length });

    // Validate all answers in parallel
    const validationResults = await Promise.all(
      answers.map(async ({ questionId, userAnswer }: { questionId: string; userAnswer: number }) => {
        try {
          if (!questionId || typeof questionId !== 'string') {
            throw new Error('Invalid question ID');
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

          // Verify question belongs to lesson (prevents ID guessing)
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

    // Save authenticated user progress
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
      // Don't fail the request if progress save fails
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