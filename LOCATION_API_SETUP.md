# Location API Setup Guide

## Overview
The Create Franchise form now includes dynamic location selection with automatic area and pincode detection using:
- **country-state-city** package for Country → State → City (offline)
- **Zipcodebase API** for Area → Pincode (online)

## Features
✅ **Country Dropdown** - All countries available
✅ **State Dropdown** - Dynamically loaded based on selected country
✅ **City Dropdown** - Dynamically loaded based on selected state
✅ **Area Dropdown** - Automatically fetched from Zipcodebase API based on city
✅ **Pincode Auto-fill** - Automatically filled when area is selected
✅ **Manual Entry Fallback** - If API fails, users can enter area and pincode manually

---

## Setup Instructions

### Step 1: Get Zipcodebase API Key

1. Go to [https://app.zipcodebase.com/](https://app.zipcodebase.com/)
2. Sign up for a free account
3. Copy your API key from the dashboard
4. **Free Tier Limits**: 10,000 requests/month

### Step 2: Add API Key to .env File

Open your `.env` file and add:

```env
VITE_ZIPCODEBASE_API_KEY="your_actual_api_key_here"
```

**Example:**
```env
VITE_ZIPCODEBASE_API_KEY="abc123xyz789-your-real-key"
```

### Step 3: Restart Development Server

After adding the API key, restart your Vite dev server:

```bash
npm run dev
```

---

## How It Works

### 1. User Flow
```
Select Country → Select State → Select City → Select Area → Pincode Auto-fills
```

### 2. Technical Flow

#### Country Selection
- Uses `country-state-city` package (offline)
- Loads all countries on component mount
- No API calls needed

#### State Selection
- Loads states based on selected country ISO code
- Uses `State.getStatesOfCountry(countryCode)`
- Instant response (offline)

#### City Selection
- Loads cities based on selected state and country
- Uses `City.getCitiesOfState(countryCode, stateCode)`
- Instant response (offline)

#### Area & Pincode Selection
- **Triggers API call** when city is selected
- Calls Zipcodebase API:
  ```
  GET https://app.zipcodebase.com/api/v1/search?apikey={KEY}&city={CITY}&country={COUNTRY_CODE}
  ```
- Parses response and creates dropdown options
- Each option shows: `Area Name (Pincode)`
- Selecting an area automatically fills the pincode field

---

## API Response Format

### Zipcodebase API Response Example

**Request:**
```
GET https://app.zipcodebase.com/api/v1/search?apikey=YOUR_KEY&city=Vadodara&country=IN
```

**Response:**
```json
{
  "query": {
    "city": "Vadodara",
    "country": "IN"
  },
  "results": {
    "390001": [
      {
        "postal_code": "390001",
        "city_en": "Vadodara",
        "state_en": "Gujarat",
        "province_en": "Central Vadodara"
      }
    ],
    "390002": [
      {
        "postal_code": "390002",
        "city_en": "Vadodara",
        "state_en": "Gujarat",
        "province_en": "Fatehgunj"
      }
    ],
    "390007": [
      {
        "postal_code": "390007",
        "city_en": "Vadodara",
        "state_en": "Gujarat",
        "province_en": "Alkapuri"
      }
    ]
  }
}
```

The code transforms this into dropdown options like:
- `Alkapuri (390007)`
- `Fatehgunj (390002)`
- `Central Vadodara (390001)`

---

## Error Handling

### Scenario 1: API Key Not Set
If `VITE_ZIPCODEBASE_API_KEY` is not configured:
- Area dropdown will show "No areas available"
- User can manually enter area and pincode
- Toast message: "Failed to load areas. Please enter manually."

### Scenario 2: City Not Found in API
If the selected city has no data:
- Toast info: "No areas found for this city. You can enter manually."
- Area dropdown shows "No options"
- Manual entry fields are still available

### Scenario 3: API Request Failed
- Error caught and logged to console
- Toast error: "Failed to load areas. Please enter manually."
- Area dropdown disabled
- Manual entry fields available

### Scenario 4: Network Issues
- Loading spinner shows while fetching
- Timeout after default fetch timeout
- Falls back to manual entry

---

## Manual Entry Fallback

Even with API integration, users can always:
1. Skip the area dropdown
2. Type directly into "Area (Manual Entry)" field
3. Type directly into "Pincode" field

This ensures the form works even if:
- API is down
- API key is invalid
- City/area not found in database
- User wants custom area names

---

## Form Data Structure

When form is submitted, these location fields are included:

```typescript
{
  fname: "John",
  lname: "Doe",
  email: "john@example.com",
  mobile: "9876543210",
  password: "******",
  role: "master-franchise",

  // Location fields (NEW)
  country: "India",
  state: "Gujarat",
  city: "Vadodara",
  area: "Alkapuri",
  pincode: "390007",

  // Hierarchy fields
  zoneId: "zone123",
  areaId: "area456"
}
```

---

## Testing the Feature

### Test Case 1: Happy Path
1. Select "India" from Country
2. Select "Gujarat" from State
3. Select "Vadodara" from City
4. Wait 1-2 seconds for areas to load
5. Select "Alkapuri (390007)" from Area dropdown
6. Verify pincode auto-fills to "390007"

### Test Case 2: Manual Entry
1. Select Country, State, City
2. Ignore Area dropdown
3. Type "Custom Area" in "Area (Manual Entry)"
4. Type "123456" in "Pincode"
5. Submit form

### Test Case 3: API Failure
1. Set invalid API key in .env
2. Select Country, State, City
3. Area dropdown shows loading then error
4. Use manual entry fields
5. Submit successfully

---

## Performance Optimization

### Caching
- Country/State/City data is cached in memory (from npm package)
- No repeated API calls for same data

### Lazy Loading
- Areas are only fetched when city is selected
- Not fetched on page load

### Debouncing
- If implementing search, consider debouncing city search
- Currently not needed as it's a dropdown

---

## Alternative APIs (If Zipcodebase Doesn't Work)

### Option 1: Postal PIN Code API (India Only - FREE)
```javascript
// For India specifically
const response = await fetch(
  `https://api.postalpincode.in/postoffice/${cityName}`
);
```

**Pros:**
- ✅ Completely free
- ✅ No API key needed
- ✅ Good coverage for India

**Cons:**
- ❌ India only
- ❌ Less reliable uptime

### Option 2: GeoNames API
```javascript
// Requires username registration
const response = await fetch(
  `http://api.geonames.org/postalCodeSearchJSON?placename=${city}&country=${countryCode}&username=${USERNAME}`
);
```

**Pros:**
- ✅ Free tier available
- ✅ Global coverage

**Cons:**
- ❌ Requires account
- ❌ Lower rate limits

### Option 3: Google Places API (Paid)
Most accurate but requires billing account.

---

## Troubleshooting

### Issue: "useEffect is not used" warning
**Solution:** The warning will disappear once you add the API key and the hooks start running.

### Issue: "All imports unused" warning for Country/State/City
**Solution:** This was fixed - the imports are now used in useEffect hooks.

### Issue: Areas not loading
**Checklist:**
1. Is API key correctly set in `.env`?
2. Did you restart the dev server after adding the key?
3. Check browser console for API errors
4. Verify city name is spelled correctly
5. Check Zipcodebase dashboard for API usage/limits

### Issue: Pincode not auto-filling
**Cause:** Area dropdown option selected might not have pincode property.
**Solution:** Check `locationAreas` state structure - ensure each option has `pincode` field.

---

## Cost Estimation

### Zipcodebase Free Tier
- **Limit:** 10,000 requests/month
- **Per Request:** 1 city lookup = 1 request
- **Usage Scenario:**
  - If 100 users/day create franchises = 3,000 requests/month ✅
  - If 500 users/day create franchises = 15,000 requests/month ❌ (need paid plan)

### Paid Plan (if needed)
- **Starter:** $9.99/month - 100,000 requests
- **Pro:** $24.99/month - 500,000 requests

### Cost Optimization Tips
1. **Cache API responses** in localStorage
2. **Only call API** when city changes (already implemented)
3. **Store common cities** in your database
4. **Rate limit** on frontend if needed

---

## Future Enhancements

### Phase 1 (Current)
✅ Basic country → state → city → area flow
✅ Zipcodebase API integration
✅ Manual entry fallback

### Phase 2 (Future)
⏳ Add caching layer (localStorage)
⏳ Add search/filter in dropdowns for large lists
⏳ Show map preview when area is selected

### Phase 3 (Advanced)
⏳ Store frequently used areas in database
⏳ Implement autocomplete instead of dropdowns
⏳ Add coordinates (lat/lng) for each location
⏳ Integrate with Google Maps for validation

---

## Support

If you encounter issues:
1. Check this documentation
2. Review browser console errors
3. Verify API key is valid
4. Test with manual entry as fallback

**API Documentation:**
- Country-State-City: https://www.npmjs.com/package/country-state-city
- Zipcodebase: https://zipcodebase.com/documentation

---

**Last Updated:** January 2025
**Version:** 1.0
