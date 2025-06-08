# 🤖 AI-Powered Form Testing Guide

This guide covers testing TripNav's AI-powered trip planning form with Anthropic Claude integration.

## 🔧 Setup Requirements

### 1. **Get Anthropic API Key**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up/Sign in to your account
3. Create a new API key
4. Copy the key (starts with `sk-ant-...`)

### 2. **Configure Environment**
Add to your `.env.local` file:
```bash
# AI Integration - Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
MODEL=claude-3-5-sonnet-20241022
MAX_TOKENS=4000
TEMPERATURE=0.2
```

### 3. **Restart Development Server**
```bash
npm run dev
```

---

## 🧪 AI Form Testing Workflow

### **Step 1: Basic Form Submission Test**

**Navigate to:** http://localhost:3000/plan

**Test Data:**
```
Step 1 - Dates:
- Start Date: 2024-07-15
- End Date: 2024-07-22

Step 2 - Travelers:
- Adults: 2
- Children: 0
- Infants: 0

Step 3 - Budget:
- Min: $2000
- Max: $4000
- Currency: USD

Step 4 - Destinations:
- Primary: "Paris, France"
- Additional: []

Step 5 - Interests:
- Select 2-3 interests (museums, food, architecture, etc.)
```

**Expected Behavior:**
- ✅ Form progresses through each step
- ✅ Submit button activates when complete
- ✅ Loading state shows during AI processing
- ✅ Success message or redirect to itinerary

---

## 📊 Monitoring AI Integration

### **Developer Tools Monitoring**

**1. Network Tab:**
```
Watch for:
✅ POST /api/v2/generate-itinerary
✅ Status: 200 (success)
✅ Response time: 10-30 seconds
✅ Response contains itinerary data
```

**2. Terminal Logs:**
```
✅ AI generation starting...
✅ Prisma database queries
✅ Lead creation successful
✅ Itinerary saved to database
❌ Watch for: "AI generation error" messages
```

**3. Browser Console:**
```
✅ No JavaScript errors
✅ Form submission handling
✅ State management working
```

---

## 🔍 Testing Different Scenarios

### **Scenario 1: Successful AI Generation**
```javascript
// Test Data
{
  destination: "Tokyo, Japan",
  dates: { from: "2024-08-01", to: "2024-08-07" },
  travelers: 2,
  budget: [3000, 5000],
  interests: ["culture", "food", "temples", "technology"]
}
```

**Expected Result:**
- ✅ 7-day detailed itinerary
- ✅ Day-by-day activities
- ✅ Budget breakdown within range
- ✅ Japan-specific recommendations

### **Scenario 2: Budget-Conscious Trip**
```javascript
// Test Data
{
  destination: "Barcelona, Spain", 
  dates: { from: "2024-06-10", to: "2024-06-15" },
  travelers: 4,
  budget: [800, 1200],
  interests: ["beach", "architecture", "nightlife"]
}
```

**Expected Result:**
- ✅ Budget-friendly recommendations
- ✅ Group-friendly activities
- ✅ Cost stays within range

### **Scenario 3: Luxury Travel**
```javascript
// Test Data
{
  destination: "Maldives",
  dates: { from: "2024-09-01", to: "2024-09-10" },
  travelers: 2,
  budget: [8000, 12000],
  interests: ["luxury", "spa", "diving", "romance"]
}
```

**Expected Result:**
- ✅ High-end recommendations
- ✅ Luxury accommodations
- ✅ Premium experiences

---

## 🚨 Troubleshooting AI Issues

### **Issue 1: Authentication Error**
```
Error: Could not resolve authentication method
```

**Solution:**
1. Check `.env.local` has correct `ANTHROPIC_API_KEY`
2. Restart development server: `npm run dev`
3. Verify API key is valid at [Anthropic Console](https://console.anthropic.com/)

### **Issue 2: API Rate Limits**
```
Error: Rate limit exceeded
```

**Solution:**
1. Wait a few minutes between tests
2. Check Anthropic billing/usage limits
3. Use fallback testing (see below)

### **Issue 3: Model Deprecated**
```
Warning: Model 'claude-3-sonnet-20240229' is deprecated
```

**Solution:**
1. Update `MODEL=claude-3-5-sonnet-20241022` in `.env.local`
2. Restart server

### **Issue 4: AI Response Parsing**
```
Error: Failed to parse AI response
```

**Solution:**
- ✅ This triggers fallback itinerary (expected behavior)
- ✅ Check if basic itinerary still generates
- ✅ Form should still work with simpler data

---

## 🔄 Fallback Testing (Without API Key)

If you don't have an Anthropic API key, you can still test the form:

### **Test Fallback Behavior:**
1. **Leave `ANTHROPIC_API_KEY` empty or invalid**
2. **Submit form normally**
3. **Expected Result:** Fallback itinerary generates with:
   - ✅ Basic day-by-day structure
   - ✅ Standard activities and accommodations  
   - ✅ Budget calculations
   - ✅ Data saves to database

### **Verify Fallback Quality:**
```javascript
// Check fallback creates:
- Daily activities (2-3 per day)
- Accommodation recommendations
- Meal suggestions
- Cost calculations
- Travel tips
```

---

## 📈 Performance Testing

### **Response Time Benchmarks:**
- ✅ **AI Generation:** 10-30 seconds (acceptable)
- ✅ **Fallback Generation:** 1-3 seconds
- ✅ **Database Save:** < 1 second
- ✅ **Total Response:** < 35 seconds

### **Load Testing:**
```javascript
// Test multiple rapid submissions
// Expected: Rate limiting or queue system
// Result: Should handle gracefully
```

---

## 📋 AI Testing Checklist

### **✅ Setup Verification**
- [ ] Anthropic API key configured
- [ ] Environment variables set
- [ ] Server restarted after config
- [ ] No console errors on startup

### **✅ Form Functionality**
- [ ] Multi-step form navigation works
- [ ] All form fields accept input
- [ ] Validation prevents invalid submissions
- [ ] Submit button activates appropriately

### **✅ AI Integration**
- [ ] API calls to Anthropic succeed
- [ ] AI responses contain valid JSON
- [ ] Itineraries match user preferences
- [ ] Budget constraints respected
- [ ] Destination-specific content included

### **✅ Fallback System**
- [ ] Graceful failure when AI unavailable
- [ ] Fallback itinerary still functional
- [ ] User experience remains smooth
- [ ] Database operations continue working

### **✅ Data Persistence**
- [ ] Leads saved to database
- [ ] Itineraries stored correctly
- [ ] User preferences captured
- [ ] Lead scoring calculated

### **✅ User Experience**
- [ ] Loading states display during processing
- [ ] Error messages are helpful
- [ ] Success feedback is clear
- [ ] Navigation flows logically

---

## 🎯 Quick Test Commands

### **Test with Real API:**
```bash
# 1. Set valid API key in .env.local
# 2. Restart server
npm run dev
# 3. Submit form with test data
# 4. Monitor terminal and network tab
```

### **Test Fallback Mode:**
```bash
# 1. Set invalid/empty API key
ANTHROPIC_API_KEY=""
# 2. Restart server
npm run dev
# 3. Submit form - should get fallback itinerary
```

### **Database Check:**
```bash
# Check if data was saved
npx prisma studio
# Look for new records in:
# - leads table
# - itineraries table
```

---

## 📞 Support & Debugging

### **Common Success Indicators:**
- ✅ Terminal shows: "AI generation starting..."
- ✅ Network tab shows 200 response
- ✅ Itinerary displays with detailed activities
- ✅ Database records created (check Prisma Studio)
- ✅ Form redirects to success/itinerary page

### **When to Use Fallback:**
- 🔄 Testing without API key
- 🔄 Development/staging environments
- 🔄 Rate limit reached
- 🔄 API service downtime

### **Getting Help:**
1. Check terminal logs for specific errors
2. Monitor Network tab for API responses
3. Verify environment variables are loaded
4. Test with simpler form data first

**Happy AI Testing! 🚀🤖** 