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

    // Fetch user's recordings with transcripts
    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', user.id)
      .not('transcript', 'is', null) // Only include recordings with transcripts
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
        summary: "Your life story journey begins here. Record your memories and let them be transcribed to create your personal autobiography.",
        themes: {},
        statistics: { totalRecordings: 0, totalDuration: 0, recordingSpan: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${recordings.length} recordings with transcripts for user`);

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

    // Combine all transcripts with context
    const transcriptContent = recordings.map((recording, index) => {
      const date = new Date(recording.created_at).toLocaleDateString();
      const title = recording.title || `Recording ${index + 1}`;
      return `--- ${title} (${date}) ---\n${recording.transcript}`;
    }).join('\n\n');

    // Calculate approximate token count and truncate if necessary (rough estimate: 4 chars per token)
    const maxContentLength = 12000; // Leaving room for prompt and response
    const finalContent = transcriptContent.length > maxContentLength 
      ? transcriptContent.substring(0, maxContentLength) + "\n\n[Content truncated due to length...]"
      : transcriptContent;

    // Generate AI summary based on actual transcript content
    const prompt = `You are creating a warm personal reflection from someone's recorded life stories and memories.

Here are their transcribed recordings:

${finalContent}

Statistics:
- Total recordings with transcripts: ${statistics.totalRecordings}
- Total duration: ${Math.floor(statistics.totalDuration / 60)} minutes
- Recording span: ${statistics.recordingSpan} days
- Started recording: ${new Date(statistics.firstRecording).toLocaleDateString()}

Based on the actual content of their recordings above, create a warm, genuine, and meaningful reflection that:
1. Captures the key themes, memories, and experiences they've shared
2. Reflects their personal journey and growth over time
3. Uses warm, genuine language that feels good to read - be direct and authentic rather than elaborate or flowery
4. Each paragraph should be concise and get straight to the point while maintaining warmth
5. Keep it to 2-3 paragraphs maximum
6. Focus on clear insights and genuine observations rather than elaborate descriptions

Write like a caring friend giving honest, encouraging feedback about someone's personal journey - warm and supportive but direct and clear. Focus on the substance of what they've shared and what it reveals about their character and growth.`;

    console.log('Sending request to OpenAI...');
    
    const requestBody = {
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: 'You are a caring friend who gives warm, encouraging personal reflections. Be genuine and supportive while staying direct and clear.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
    };
    
    console.log('OpenAI request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI');
    }
    
    const generatedSummary = data.choices[0].message.content;
    console.log('Generated summary text:', generatedSummary);
    
    if (!generatedSummary || generatedSummary.trim() === '') {
      console.error('Empty summary received from OpenAI');
      throw new Error('Empty summary received from OpenAI');
    }

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