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

function extractJson(rawText: string): Record<string, unknown> {
  const cleaned = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not extract valid JSON from response');
  }
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
      console.error('[generate-mindmap] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[generate-mindmap] Missing Supabase configuration');
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
      console.error('[generate-mindmap] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-mindmap] Authenticated user:', user.id);

    const { content } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('[generate-mindmap] Missing API key configuration');
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
        model: 'gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em criar mapas mentais educacionais estruturados.
            Crie um mapa mental hierárquico com um título central e ramos de tópicos principais, cada um contendo subtópicos relevantes.
            Cada nó deve ter um título claro e conciso.`
          },
          {
            role: 'user',
            content: `Crie um mapa mental estruturado baseado no seguinte conteúdo:\n\n${content}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_mindmap",
              description: "Retorna um mapa mental educacional estruturado hierarquicamente",
              parameters: {
                type: "object",
                properties: {
                  mindmap: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Título central do mapa mental" },
                      children: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "Título do tópico principal" },
                            children: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  title: { type: "string", description: "Título do subtópico" },
                                  children: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      properties: {
                                        title: { type: "string", description: "Título do sub-subtópico" }
                                      },
                                      required: ["title"]
                                    }
                                  }
                                },
                                required: ["title"]
                              }
                            }
                          },
                          required: ["title"]
                        }
                      }
                    },
                    required: ["title", "children"]
                  }
                },
                required: ["mindmap"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_mindmap" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-mindmap] AI gateway error:', response.status, errorText);

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

    let mindmap;

    // Try to get from tool_calls first (preferred structured output)
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      mindmap = parsed.mindmap || parsed;
    } else {
      // Fallback: try to extract from message content
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) {
        console.error('[generate-mindmap] No content in response:', JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: 'Failed to generate mindmap' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      mindmap = extractJson(rawText);
      // If the extracted JSON has a 'mindmap' key, unwrap it
      if (mindmap.mindmap) {
        mindmap = mindmap.mindmap;
      }
    }

    // Validate the mindmap structure
    if (!mindmap || !mindmap.title || !Array.isArray(mindmap.children)) {
      console.error('[generate-mindmap] Invalid mindmap structure:', JSON.stringify(mindmap));
      return new Response(
        JSON.stringify({ error: 'Generated mindmap has invalid structure. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-mindmap] Generated for user:', user.id);

    return new Response(
      JSON.stringify({ mindmap }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-mindmap] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});