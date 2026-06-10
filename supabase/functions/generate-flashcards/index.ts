import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[generate-flashcards] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[generate-flashcards] Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('[generate-flashcards] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-flashcards] Authenticated user:', user.id);

    const { content, count = 5 } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate count
    const validCount = Math.min(Math.max(1, Number(count) || 5), 20);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('[generate-flashcards] Missing API key configuration');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-1.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em criar flashcards educacionais. 
            Crie flashcards com uma pergunta na frente e uma resposta concisa no verso.
            Retorne apenas um array JSON de flashcards com a estrutura: [{"front": "pergunta", "back": "resposta"}]`
          },
          {
            role: 'user',
            content: `Crie ${validCount} flashcards baseados no seguinte conteúdo:\n\n${content}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_flashcards",
              description: "Retorna uma lista de flashcards educacionais",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        front: { type: "string", description: "Pergunta ou conceito" },
                        back: { type: "string", description: "Resposta ou explicação" }
                      },
                      required: ["front", "back"]
                    }
                  }
                },
                required: ["flashcards"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_flashcards" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-flashcards] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let flashcards;

    // Try to get from tool_calls first (preferred structured output)
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      flashcards = parsed.flashcards || parsed;
    } else {
      // Fallback: try to extract from message content
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) {
        console.error('[generate-flashcards] No content in response:', JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: 'Failed to generate flashcards' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Try to parse as JSON (may contain markdown code fences)
      const cleaned = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        flashcards = Array.isArray(parsed) ? parsed : parsed.flashcards;
      } catch {
        // Try to find JSON array in the text
        const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          flashcards = JSON.parse(arrayMatch[0]);
        } else {
          console.error('[generate-flashcards] Could not parse response:', cleaned);
          return new Response(
            JSON.stringify({ error: 'Failed to parse generated flashcards. Please try again.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Validate flashcards structure
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      console.error('[generate-flashcards] Invalid flashcards structure:', JSON.stringify(flashcards));
      return new Response(
        JSON.stringify({ error: 'Generated flashcards have invalid structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-flashcards] Generated for user:', user.id, 'count:', flashcards.length);

    return new Response(
      JSON.stringify({ flashcards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-flashcards] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});