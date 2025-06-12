# OpenAI API Setup Guide

The AI Travel Planner requires an OpenAI API key to enable the conversational chat interface.

## Required Environment Variables

Add the following to your `.env.local` file:

```env
# OpenAI Configuration (Required for AI Chat)
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Customize the model and parameters
MODEL=gpt-4o-mini          # or gpt-3.5-turbo, gpt-4
MAX_TOKENS=500             # Maximum tokens per response
TEMPERATURE=0.7            # Response creativity (0-1)
```

## Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (it will only be shown once)
6. Add it to your `.env.local` file

## Vercel Deployment

For production deployment on Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `MODEL` - gpt-4o-mini (optional)
   - `MAX_TOKENS` - 500 (optional)
   - `TEMPERATURE` - 0.7 (optional)

## Testing the Connection

Once configured, the AI chat will:
- Connect to OpenAI's API
- Provide intelligent, context-aware responses
- Help users plan their trips conversationally
- Extract trip details automatically

## Fallback Mode

If no API key is configured:
- The chat will still work with basic pattern matching
- Responses will be more limited
- You'll see a warning in the console

## Cost Considerations

- `gpt-4o-mini` - Most cost-effective, good quality
- `gpt-3.5-turbo` - Balanced cost and performance
- `gpt-4` - Best quality, higher cost

## Troubleshooting

If you see "I'm having trouble connecting right now":
1. Check that OPENAI_API_KEY is set in your environment
2. Verify the API key is valid and has credits
3. Check the console logs for specific error messages
4. Ensure your API key has the necessary permissions