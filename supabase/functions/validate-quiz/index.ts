import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user client to verify auth
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { answers, lessonId } = await req.json();
    
    if (!lessonId) {
      console.error('Missing lessonId in request');
      return new Response(
        JSON.stringify({ error: 'Lesson ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Validating quiz answers:', { userId: user.id, lessonId, answerCount: answers.length });

    // Validate all answers in parallel
    const validationResults = await Promise.all(
      answers.map(async ({ questionId, userAnswer }: { questionId: string; userAnswer: number }) => {
        try {
          const { data, error } = await supabaseAdmin
            .from('questions')
            .select('correct_answer, lesson_id')
            .eq('id', questionId)
            .single();

          if (error) {
            console.error('Error fetching question:', { questionId, error });
            throw new Error(`Question ${questionId} not found`);
          }

          // Verify question belongs to lesson (prevents ID guessing)
          if (data.lesson_id !== lessonId) {
            console.error('Question-lesson mismatch:', { questionId, lessonId, actualLessonId: data.lesson_id });
            throw new Error('Question-lesson mismatch');
          }

          const isCorrect = userAnswer === data.correct_answer;
          console.log('Validated answer:', { questionId, isCorrect });
          
          return { questionId, isCorrect };
        } catch (err) {
          console.error('Validation error for question:', { questionId, error: err });
          throw err;
        }
      })
    );

    const correctCount = validationResults.filter(r => r.isCorrect).length;
    const totalQuestions = answers.length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = score >= 80;

    console.log('Quiz validation complete:', { userId: user.id, correctCount, totalQuestions, score, passed });

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
      console.error('Error saving user progress:', progressError);
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
    console.error('Quiz validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Quiz validation failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
