import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { recordingId } = await req.json();
    
    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching recording details for ID:', recordingId);

    // Fetch the recording with transcript
    const { data: recording, error: fetchError } = await supabase
      .from('recordings')
      .select('id, title, transcript, duration, created_at')
      .eq('id', recordingId)
      .single();

    if (fetchError || !recording) {
      console.error('Error fetching recording:', fetchError);
      throw new Error('Recording not found');
    }

    if (!recording.transcript || recording.transcript.trim().length === 0) {
      throw new Error('Recording has no transcript to analyze');
    }

    console.log('Generating encouragement for transcript length:', recording.transcript.length);

    // Generate encouraging message using OpenAI
    const prompt = `You are a warm, encouraging friend who celebrates people's courage in sharing their personal stories and memories. 

Someone just recorded a personal story/memory. Here's what they shared:

"${recording.transcript}"

Create a personalized, encouraging message that:
1. Highlights specific interesting details, themes, or insights from their story
2. Makes them feel celebrated and valued for their unique perspective
3. Acknowledges their courage and encourages them to continue sharing

CRITICAL: Keep your response to EXACTLY 3 lines or fewer. Be concise but impactful.
Write in a conversational, friendly tone as if you're genuinely moved by their story.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a caring, encouraging friend who celebrates people for sharing their personal stories. Be warm, genuine, and specific to their content.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const encouragementMessage = data.choices[0].message.content.trim();

    console.log('Generated encouragement message:', encouragementMessage);

    // Update the recording with the encouragement message
    const { error: updateError } = await supabase
      .from('recordings')
      .update({ encouragement_message: encouragementMessage })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Error updating recording with encouragement:', updateError);
      throw new Error('Failed to save encouragement message');
    }

    console.log('Successfully generated and saved encouragement message');

    return new Response(
      JSON.stringify({ 
        success: true, 
        encouragementMessage,
        recordingId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-encouragement function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});