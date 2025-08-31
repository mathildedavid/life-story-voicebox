import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Generate life summary function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    // Fetch user's recordings
    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (recordingsError) {
      console.error('Error fetching recordings:', recordingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch recordings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!recordings || recordings.length === 0) {
      return new Response(JSON.stringify({ 
        summary: 'Your life story journey begins here. Start recording your memories to create your personal autobiography.',
        themes: {},
        statistics: { totalRecordings: 0, totalDuration: 0, recordingSpan: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${recordings.length} recordings for user`);

    // Calculate statistics
    const totalDuration = recordings.reduce((sum, r) => sum + parseFloat(r.duration), 0);
    const oldestRecording = recordings[0];
    const newestRecording = recordings[recordings.length - 1];
    const recordingSpan = new Date(newestRecording.created_at).getTime() - new Date(oldestRecording.created_at).getTime();
    const spanInDays = Math.floor(recordingSpan / (1000 * 60 * 60 * 24));

    const statistics = {
      totalRecordings: recordings.length,
      totalDuration: Math.round(totalDuration),
      recordingSpan: spanInDays,
      avgDuration: Math.round(totalDuration / recordings.length),
      firstRecording: oldestRecording.created_at,
      latestRecording: newestRecording.created_at
    };

    // Prepare recordings summary for AI
    const recordingsSummary = recordings.map((recording, index) => {
      const date = new Date(recording.created_at).toLocaleDateString();
      const duration = Math.round(parseFloat(recording.duration));
      return `Recording ${index + 1} (${date}): ${recording.title || 'Untitled'} - ${duration} seconds`;
    }).join('\n');

    // Generate AI summary
    const prompt = `You are creating an autobiography-style summary for someone who has been recording their life story. 

Here are their recordings:
${recordingsSummary}

Statistics:
- Total recordings: ${statistics.totalRecordings}
- Total duration: ${Math.floor(statistics.totalDuration / 60)} minutes
- Recording span: ${statistics.recordingSpan} days
- Started recording: ${new Date(statistics.firstRecording).toLocaleDateString()}

Create a beautiful, inspiring autobiography-style narrative that:
1. Acknowledges their journey of self-documentation
2. Reflects on the time span and dedication shown
3. Creates anticipation for future recordings
4. Uses warm, personal language as if writing their memoir
5. Keep it to 2-3 paragraphs maximum
6. Make it feel meaningful and celebratory

Do not mention specific recording titles or technical details. Focus on the emotional journey of preserving memories and the significance of their story.`;

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'You are a skilled memoir writer who creates beautiful, personal autobiographical narratives.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const generatedSummary = data.choices[0].message.content;

    console.log('Generated summary successfully');

    // Extract themes (simple keyword extraction for now)
    const themes = {
      selfReflection: recordings.length >= 3 ? 'Active' : 'Beginning',
      storytelling: recordings.length >= 5 ? 'Developing' : 'Beginning',
      memoryPreservation: recordings.length >= 1 ? 'Active' : 'Not Started',
      personalGrowth: statistics.recordingSpan > 7 ? 'Evident' : 'Beginning'
    };

    // Store or update summary in database
    const summaryData = {
      user_id: user.id,
      summary_text: generatedSummary,
      themes,
      statistics,
      last_recording_count: recordings.length
    };

    // Check if summary exists
    const { data: existingSummary } = await supabase
      .from('life_story_summaries')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSummary) {
      // Update existing summary
      const { error: updateError } = await supabase
        .from('life_story_summaries')
        .update(summaryData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating summary:', updateError);
      }
    } else {
      // Create new summary
      const { error: insertError } = await supabase
        .from('life_story_summaries')
        .insert(summaryData);

      if (insertError) {
        console.error('Error inserting summary:', insertError);
      }
    }

    console.log('Summary saved to database');

    return new Response(JSON.stringify({
      summary: generatedSummary,
      themes,
      statistics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-life-summary function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});