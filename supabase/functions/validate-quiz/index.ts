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
    const { answers } = await req.json();
    
    console.log('Validating quiz answers:', { answerCount: answers.length });

    // Create Supabase client with service role key for access to questions table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate all answers in parallel
    const validationResults = await Promise.all(
      answers.map(async ({ questionId, userAnswer }: { questionId: string; userAnswer: number }) => {
        try {
          const { data, error } = await supabase
            .from('questions')
            .select('correct_answer')
            .eq('id', questionId)
            .single();

          if (error) {
            console.error('Error fetching question:', { questionId, error });
            throw new Error(`Question ${questionId} not found`);
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

    console.log('Quiz validation complete:', { correctCount, totalQuestions, score, passed });

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
