import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Food } from '../models/index.js';

// Initialize AI clients
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

const deepseekClient = process.env.DEEPSEEK_API_KEY ? new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
}) : null;

const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Qwen uses OpenAI-compatible API (can use OpenAI client with different baseURL)
const qwenClient = process.env.QWEN_API_KEY ? new OpenAI({
    apiKey: process.env.QWEN_API_KEY,
    baseURL: process.env.QWEN_BASE_URL || 'https://api.openai.com/v1', // Update with actual Qwen endpoint
}) : null;

/**
 * AI Provider Configuration
 */
const AI_PROVIDERS = [
    {
        name: 'openai',
        enabled: !!process.env.OPENAI_API_KEY,
        client: openaiClient,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    {
        name: 'deepseek',
        enabled: !!process.env.DEEPSEEK_API_KEY,
        client: deepseekClient,
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
    {
        name: 'gemini',
        enabled: !!process.env.GEMINI_API_KEY,
        client: geminiClient,
        model: process.env.GEMINI_MODEL || 'gemini-pro',
    },
    {
        name: 'qwen',
        enabled: !!process.env.QWEN_API_KEY,
        client: qwenClient,
        model: process.env.QWEN_MODEL || 'qwen-turbo',
    },
].filter(provider => provider.enabled);

/**
 * Generate a personalized daily diet plan using AI
 * Tries multiple AI providers with fallback
 * 
 * @param {Object} profile - User profile with health data
 * @param {Date} date - Date for the diet plan
 * @returns {Object} Generated diet plan with meals and nutritional targets
 */
export const generateDietPlan = async (profile, date) => {
    try {
        // Calculate daily calorie needs based on profile
        const age = profile.age;
        const weight = profile.weightUnit === 'kg' ? profile.weight : profile.weight * 0.453592;
        const heightInCm = profile.heightUnit === 'cm'
            ? profile.height
            : profile.heightUnit === 'ft'
                ? profile.height * 30.48
                : profile.height * 2.54;

        // BMR calculation (Harris-Benedict equation)
        let bmr;
        if (profile.gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * heightInCm) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * heightInCm) - (4.330 * age);
        }

        // Activity multiplier
        const activityMultipliers = {
            sedentary: 1.2,
            lightly_active: 1.375,
            moderately_active: 1.55,
            very_active: 1.725,
            extremely_active: 1.9
        };

        let dailyCalories = Math.round(bmr * (activityMultipliers[profile.activityLevel] || 1.55));

        // Adjust based on health goals
        if (profile.healthGoals && profile.healthGoals.includes('weight_loss')) {
            dailyCalories = Math.round(dailyCalories * 0.85); // 15% deficit
        } else if (profile.healthGoals && profile.healthGoals.includes('weight_gain')) {
            dailyCalories = Math.round(dailyCalories * 1.15); // 15% surplus
        } else if (profile.healthGoals && profile.healthGoals.includes('muscle_gain')) {
            dailyCalories = Math.round(dailyCalories * 1.1); // 10% surplus
        }

        // Calculate macronutrients
        const dailyProtein = Math.round(dailyCalories * 0.25 / 4); // 25% from protein
        const dailyCarbs = Math.round(dailyCalories * 0.45 / 4); // 45% from carbs
        const dailyFats = Math.round(dailyCalories * 0.30 / 9); // 30% from fats

        // First, check if there are any foods in the database at all
        const totalFoodsCount = await Food.countDocuments({});
        if (totalFoodsCount === 0) {
            console.log('No foods found in database. Generating Pakistani foods using AI...');
            await generateAndSavePakistaniFoods();
        }

        // Get available Pakistani foods from database
        // Start with all foods, then filter by preferences if needed
        let availableFoods = await Food.find({}).limit(200);

        // If user has dietary preferences, try to filter, but don't be too restrictive
        if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
            const foodQuery = buildFoodQuery(profile);
            // Only use preference query if it's not empty (has conditions)
            if (Object.keys(foodQuery).length > 0) {
                const preferenceFoods = await Food.find(foodQuery).limit(200);
                // If we found foods with preferences, use them; otherwise use all foods
                if (preferenceFoods.length > 0) {
                    availableFoods = preferenceFoods;
                    console.log(`Found ${availableFoods.length} foods matching dietary preferences`);
                } else {
                    console.log('No foods found with dietary preferences, using all available foods');
                }
            }
        }

        // Filter out foods with allergens (but keep foods without allergen info)
        let filteredFoods = availableFoods;
        if (profile.allergies && profile.allergies.length > 0) {
            const userAllergens = profile.allergies.map(a => a.name.toLowerCase());
            filteredFoods = availableFoods.filter(food => {
                if (!food.allergens || food.allergens.length === 0) return true;
                const foodAllergens = food.allergens.map(a => a.toLowerCase());
                return !userAllergens.some(allergen => foodAllergens.includes(allergen));
            });
            console.log(`After allergen filtering: ${filteredFoods.length} foods available`);

            // If allergen filtering removed all foods, warn but still use all foods
            if (filteredFoods.length === 0) {
                console.warn('All foods filtered out due to allergies. Using all foods as fallback (user should be aware of allergens).');
                filteredFoods = availableFoods;
            }
        }

        // Final check: ensure we have foods to work with
        if (filteredFoods.length === 0) {
            throw new Error('No foods available after filtering. Please add more foods to the database or adjust dietary preferences.');
        }

        // Try AI providers in order, fallback to rule-based if all fail
        if (AI_PROVIDERS.length > 0) {
            for (const provider of AI_PROVIDERS) {
                try {
                    console.log(`Attempting to generate diet plan using ${provider.name}...`);
                    const result = await generateWithAIProvider(
                        provider,
                        profile,
                        date,
                        dailyCalories,
                        dailyProtein,
                        dailyCarbs,
                        dailyFats,
                        filteredFoods
                    );
                    console.log(`Successfully generated diet plan using ${provider.name}`);
                    return result;
                } catch (error) {
                    console.error(`${provider.name} failed:`, error.message);
                    // Continue to next provider
                    continue;
                }
            }
            console.log('All AI providers failed, using rule-based fallback');
        }

        // Fallback to rule-based generation
        return await generateRuleBased(profile, date, dailyCalories, dailyProtein, dailyCarbs, dailyFats, filteredFoods);
    } catch (error) {
        console.error('Error generating diet plan:', error);
        throw error;
    }
};

/**
 * Generate diet plan using a specific AI provider
 */
const generateWithAIProvider = async (provider, profile, date, dailyCalories, dailyProtein, dailyCarbs, dailyFats, availableFoods) => {
    const prompt = buildAIPrompt(profile, dailyCalories, dailyProtein, dailyCarbs, dailyFats, availableFoods);

    switch (provider.name) {
        case 'openai':
        case 'deepseek':
        case 'qwen':
            return await generateWithOpenAICompatible(provider, prompt, dailyCalories, dailyProtein, dailyCarbs, dailyFats, date);

        case 'gemini':
            return await generateWithGemini(provider, prompt, dailyCalories, dailyProtein, dailyCarbs, dailyFats, date);

        default:
            throw new Error(`Unknown AI provider: ${provider.name}`);
    }
};

/**
 * Generate using OpenAI-compatible API (OpenAI, DeepSeek, Qwen)
 */
const generateWithOpenAICompatible = async (provider, prompt, dailyCalories, dailyProtein, dailyCarbs, dailyFats, date) => {
    if (!provider.client) {
        throw new Error(`${provider.name} client not initialized`);
    }

    const completion = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [
            {
                role: 'system',
                content: 'You are a professional nutritionist specializing in Pakistani cuisine. Always respond with valid JSON only, no additional text.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
    });

    const aiResponse = completion.choices[0].message.content;
    let planData;

    try {
        planData = JSON.parse(aiResponse);
    } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Invalid JSON response from AI');
    }

    // Validate that meals exist and have items
    if (!planData.meals || !Array.isArray(planData.meals) || planData.meals.length === 0) {
        console.error('AI returned empty or invalid meals array');
        throw new Error('AI returned empty meals');
    }

    // Validate that meals have items
    const mealsWithItems = planData.meals.filter(meal => meal.items && meal.items.length > 0);
    if (mealsWithItems.length === 0) {
        console.error('AI returned meals but all meals have empty items arrays');
        throw new Error('AI returned meals with no food items');
    }

    return {
        date,
        meals: planData.meals,
        dailyCalories: planData.dailyCalories ?? dailyCalories,
        dailyProtein: planData.dailyProtein ?? dailyProtein,
        dailyCarbs: planData.dailyCarbs ?? dailyCarbs,
        dailyFats: planData.dailyFats ?? dailyFats,
    };
};

/**
 * Generate using Google Gemini
 */
const generateWithGemini = async (provider, prompt, dailyCalories, dailyProtein, dailyCarbs, dailyFats, date) => {
    if (!provider.client) {
        throw new Error(`${provider.name} client not initialized`);
    }

    const model = provider.client.getGenerativeModel({
        model: provider.model,
        generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
        }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Gemini returns JSON wrapped in markdown sometimes, clean it up
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let planData;

    try {
        planData = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        throw new Error('Invalid JSON response from Gemini');
    }

    // Validate that meals exist and have items
    if (!planData.meals || !Array.isArray(planData.meals) || planData.meals.length === 0) {
        console.error('Gemini returned empty or invalid meals array');
        throw new Error('Gemini returned empty meals');
    }

    // Validate that meals have items
    const mealsWithItems = planData.meals.filter(meal => meal.items && meal.items.length > 0);
    if (mealsWithItems.length === 0) {
        console.error('Gemini returned meals but all meals have empty items arrays');
        throw new Error('Gemini returned meals with no food items');
    }

    return {
        date,
        meals: planData.meals,
        dailyCalories: planData.dailyCalories ?? dailyCalories,
        dailyProtein: planData.dailyProtein ?? dailyProtein,
        dailyCarbs: planData.dailyCarbs ?? dailyCarbs,
        dailyFats: planData.dailyFats ?? dailyFats,
    };
};

/**
 * Build AI prompt with user profile and food data
 */
const buildAIPrompt = (profile, dailyCalories, dailyProtein, dailyCarbs, dailyFats, availableFoods) => {
    const foodList = availableFoods.map(f =>
        `${f.name} (${f.calories} cal/100g, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fats}g fats)`
    ).join(', ');

    const allergiesList = profile.allergies && profile.allergies.length > 0
        ? profile.allergies.map(a => a.name).join(', ')
        : 'None';

    const dietaryPrefs = profile.dietaryPreferences && profile.dietaryPreferences.length > 0
        ? profile.dietaryPreferences.join(', ')
        : 'None';

    const healthGoalsList = profile.healthGoals && profile.healthGoals.length > 0
        ? profile.healthGoals.join(', ')
        : 'Maintenance';

    return `You are a nutritionist creating a personalized daily diet plan for a Pakistani user.

User Profile:
- Age: ${profile.age} years
- Gender: ${profile.gender || 'Not specified'}
- Weight: ${profile.weight} ${profile.weightUnit}
- Height: ${profile.height} ${profile.heightUnit}
- BMI: ${profile.bmi ? profile.bmi.toFixed(1) : 'Not calculated'}
- Activity Level: ${profile.activityLevel}
- Health Goals: ${healthGoalsList}
- Dietary Preferences: ${dietaryPrefs}
- Allergies: ${allergiesList}

Daily Nutritional Targets:
- Total Calories: ${dailyCalories} kcal
- Protein: ${dailyProtein}g
- Carbohydrates: ${dailyCarbs}g
- Fats: ${dailyFats}g

Available Pakistani Foods (use only these):
${foodList}

Create a complete daily diet plan with the following meals:
1. Breakfast (25% of daily calories) - Traditional Pakistani breakfast items
2. Lunch (35% of daily calories) - Pakistani lunch dishes
3. Dinner (30% of daily calories) - Pakistani dinner options
4. Snacks (10% of daily calories) - Healthy Pakistani snacks

For each meal, provide:
- Meal type (breakfast, lunch, dinner, snack)
- List of food items with:
  * Name (must be from available foods list)
  * Quantity in grams
  * Unit (grams)
  * Calories
  * Protein in grams
  * Carbs in grams
  * Fats in grams
- Total calories for the meal
- Optional notes

IMPORTANT: 
- Use ONLY Pakistani foods that are easily available in Pakistan
- Respect dietary preferences and allergies
- Ensure total daily calories are approximately ${dailyCalories} kcal
- Make it realistic and practical for daily cooking
- Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{
  "meals": [
    {
      "mealType": "breakfast",
      "items": [
        {
          "name": "Food Name",
          "quantity": 100,
          "unit": "grams",
          "calories": 250,
          "protein": 10,
          "carbs": 30,
          "fats": 8
        }
      ],
      "totalCalories": 250,
      "notes": "Optional notes"
    }
  ],
  "dailyCalories": ${dailyCalories},
  "dailyProtein": ${dailyProtein},
  "dailyCarbs": ${dailyCarbs},
  "dailyFats": ${dailyFats}
}`;
};

/**
 * Fallback rule-based generation
 */
const generateRuleBased = async (profile, date, dailyCalories, dailyProtein, dailyCarbs, dailyFats, availableFoods) => {
    if (!availableFoods || availableFoods.length === 0) {
        throw new Error('No foods available for rule-based generation');
    }

    console.log(`Using rule-based generation with ${availableFoods.length} foods`);

    const meals = [];

    // Breakfast (25% of daily calories)
    const breakfastCalories = Math.round(dailyCalories * 0.25);
    const breakfastMeal = generateMeal('breakfast', breakfastCalories, availableFoods, profile);
    if (breakfastMeal && breakfastMeal.items.length > 0) {
        meals.push(breakfastMeal);
    } else {
        console.warn('Failed to generate breakfast meal');
    }

    // Lunch (35% of daily calories)
    const lunchCalories = Math.round(dailyCalories * 0.35);
    const lunchMeal = generateMeal('lunch', lunchCalories, availableFoods, profile);
    if (lunchMeal && lunchMeal.items.length > 0) {
        meals.push(lunchMeal);
    } else {
        console.warn('Failed to generate lunch meal');
    }

    // Dinner (30% of daily calories)
    const dinnerCalories = Math.round(dailyCalories * 0.30);
    const dinnerMeal = generateMeal('dinner', dinnerCalories, availableFoods, profile);
    if (dinnerMeal && dinnerMeal.items.length > 0) {
        meals.push(dinnerMeal);
    } else {
        console.warn('Failed to generate dinner meal');
    }

    // Snacks (10% of daily calories)
    const snackCalories = Math.round(dailyCalories * 0.10);
    const snackMeal = generateMeal('snack', snackCalories, availableFoods, profile);
    if (snackMeal && snackMeal.items.length > 0) {
        meals.push(snackMeal);
    } else {
        console.warn('Failed to generate snack meal');
    }

    if (meals.length === 0) {
        throw new Error('Failed to generate any meals. Please check food database.');
    }

    return {
        date,
        meals,
        dailyCalories,
        dailyProtein,
        dailyCarbs,
        dailyFats,
    };
};

/**
 * Build food query based on dietary preferences
 * Uses OR logic - foods matching ANY preference are included
 * Returns empty object if no preferences to allow getting all foods
 */
const buildFoodQuery = (profile) => {
    const foodQuery = {};
    const orConditions = [];

    if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
        if (profile.dietaryPreferences.includes('vegetarian')) {
            orConditions.push({ isVegetarian: true });
        }
        if (profile.dietaryPreferences.includes('vegan')) {
            orConditions.push({ isVegan: true });
        }
        if (profile.dietaryPreferences.includes('gluten_free')) {
            orConditions.push({ isGlutenFree: true });
        }
        if (profile.dietaryPreferences.includes('dairy_free')) {
            orConditions.push({ isDairyFree: true });
        }

        // If we have preferences, use OR logic (foods matching any preference)
        // If no specific preferences match, return empty query (get all foods)
        if (orConditions.length > 0) {
            foodQuery.$or = orConditions;
        }
    }

    return foodQuery;
};

/**
 * Generate a single meal with appropriate foods (rule-based fallback)
 */
const generateMeal = (mealType, targetCalories, availableFoods, profile) => {
    if (!availableFoods || availableFoods.length === 0) {
        console.error(`No foods available for ${mealType}`);
        return null;
    }

    // Filter foods suitable for this meal type
    let suitableFoods = availableFoods.filter(food => {
        // Check if food has mealType array and includes this meal type
        if (food.mealType && Array.isArray(food.mealType) && food.mealType.includes(mealType)) {
            return true;
        }
        // For snacks, also check category
        if (mealType === 'snack' && food.category && (food.category === 'snack' || food.category === 'dessert')) {
            return true;
        }
        return false;
    });

    // If no suitable foods found, use all available foods as fallback
    if (suitableFoods.length === 0) {
        console.log(`No foods specifically for ${mealType}, using all available foods`);
        suitableFoods = availableFoods;
    }

    return createMealFromFoods(mealType, targetCalories, suitableFoods);
};

/**
 * Create a meal from available foods, trying to match target calories
 */
const createMealFromFoods = (mealType, targetCalories, foods) => {
    const items = [];
    let totalCalories = 0;
    const maxItems = mealType === 'snack' ? 2 : 4;

    const shuffled = [...foods].sort(() => Math.random() - 0.5);

    for (const food of shuffled) {
        if (items.length >= maxItems) break;

        const caloriesPer100g = food.calories;
        const servingSize = Math.min(
            Math.round((targetCalories - totalCalories) / caloriesPer100g * 100),
            food.typicalServing * 2
        );

        if (servingSize > 0) {
            const itemCalories = Math.round((caloriesPer100g * servingSize) / 100);
            const itemProtein = Math.round((food.protein * servingSize) / 100);
            const itemCarbs = Math.round((food.carbs * servingSize) / 100);
            const itemFats = Math.round((food.fats * servingSize) / 100);

            items.push({
                name: food.name,
                quantity: servingSize,
                unit: food.servingUnit || 'grams',
                calories: itemCalories,
                protein: itemProtein,
                carbs: itemCarbs,
                fats: itemFats,
            });

            totalCalories += itemCalories;

            if (totalCalories >= targetCalories * 0.9) break;
        }
    }

    if (totalCalories < targetCalories * 0.8 && items.length > 0) {
        const deficit = targetCalories - totalCalories;
        const firstItem = items[0];
        const additionalCalories = Math.min(deficit, firstItem.calories * 0.5);
        const multiplier = 1 + (additionalCalories / firstItem.calories);

        firstItem.quantity = Math.round(firstItem.quantity * multiplier);
        firstItem.calories = Math.round(firstItem.calories * multiplier);
        firstItem.protein = Math.round(firstItem.protein * multiplier);
        firstItem.carbs = Math.round(firstItem.carbs * multiplier);
        firstItem.fats = Math.round(firstItem.fats * multiplier);
    }

    return {
        mealType,
        items,
        totalCalories: Math.round(totalCalories),
        notes: mealType === 'snack' ? 'Healthy snack option' : null,
    };
};

/**
 * Generate and save common Pakistani foods to database using AI
 */
const generateAndSavePakistaniFoods = async () => {
    try {
        // Try to use AI to generate foods, fallback to predefined list
        if (AI_PROVIDERS.length > 0) {
            for (const provider of AI_PROVIDERS) {
                try {
                    const foods = await generateFoodsWithAI(provider);
                    if (foods && foods.length > 0) {
                        // Save foods to database
                        const savedFoods = await Food.insertMany(foods, { ordered: false });
                        console.log(`Successfully generated and saved ${savedFoods.length} Pakistani foods using ${provider.name}`);
                        return;
                    }
                } catch (error) {
                    console.error(`${provider.name} failed to generate foods:`, error.message);
                    continue;
                }
            }
        }

        // Fallback to predefined common Pakistani foods
        console.log('AI providers failed, using predefined Pakistani foods list');
        const predefinedFoods = getPredefinedPakistaniFoods();
        const savedFoods = await Food.insertMany(predefinedFoods, { ordered: false });
        console.log(`Successfully saved ${savedFoods.length} predefined Pakistani foods`);
    } catch (error) {
        console.error('Error generating/saving foods:', error);
        // If insertMany fails (e.g., duplicates), try to save individually
        if (error.code === 11000 || error.writeErrors) {
            console.log('Some foods may already exist, continuing...');
        } else {
            throw error;
        }
    }
};

/**
 * Generate Pakistani foods using AI
 */
const generateFoodsWithAI = async (provider) => {
    const prompt = `Generate a comprehensive list of 50-100 common Pakistani foods that are easily available in Pakistan. For each food, provide:

1. Name (English)
2. Name in Urdu (optional)
3. Category: bread, rice, curry, meat, vegetable, dal, snack, dessert, beverage, fast_food, fried, seafood, salad, or other
4. Meal types: breakfast, lunch, dinner, snack, or side (can be multiple)
5. Nutritional information per 100g:
   - Calories
   - Protein (grams)
   - Carbs (grams)
   - Fats (grams)
6. Dietary information:
   - isVegetarian (boolean)
   - isVegan (boolean)
   - isGlutenFree (boolean)
   - isDairyFree (boolean)
7. Allergens (if any): wheat, dairy, nuts, eggs, soy, fish, shellfish, sesame
8. Typical serving size in grams
9. Serving unit (usually "grams")

Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{
  "foods": [
    {
      "name": "Roti",
      "nameUrdu": "روٹی",
      "category": "bread",
      "mealType": ["breakfast", "lunch", "dinner"],
      "calories": 297,
      "protein": 7.85,
      "carbs": 58.0,
      "fats": 7.45,
      "isVegetarian": true,
      "isVegan": true,
      "isGlutenFree": false,
      "isDairyFree": true,
      "allergens": ["wheat"],
      "typicalServing": 50,
      "servingUnit": "grams"
    }
  ]
}`;

    try {
        if (provider.name === 'gemini') {
            const model = provider.client.getGenerativeModel({
                model: provider.model,
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: 'application/json',
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const data = JSON.parse(cleanedText);
            return data.foods || [];
        } else {
            // OpenAI-compatible
            const completion = await provider.client.chat.completions.create({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a nutritionist specializing in Pakistani cuisine. Always respond with valid JSON only, no additional text.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            });

            const aiResponse = completion.choices[0].message.content;
            const data = JSON.parse(aiResponse);
            return data.foods || [];
        }
    } catch (error) {
        console.error(`Error generating foods with ${provider.name}:`, error);
        throw error;
    }
};

/**
 * Predefined list of common Pakistani foods (fallback)
 */
const getPredefinedPakistaniFoods = () => {
    return [
        {
            name: 'Roti',
            nameUrdu: 'روٹی',
            category: 'bread',
            mealType: ['breakfast', 'lunch', 'dinner'],
            calories: 297,
            protein: 7.85,
            carbs: 58.0,
            fats: 7.45,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: false,
            isDairyFree: true,
            allergens: ['wheat'],
            typicalServing: 50,
            servingUnit: 'grams'
        },
        {
            name: 'Naan',
            nameUrdu: 'نان',
            category: 'bread',
            mealType: ['lunch', 'dinner'],
            calories: 310,
            protein: 8.0,
            carbs: 50.0,
            fats: 9.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isDairyFree: false,
            allergens: ['wheat', 'dairy'],
            typicalServing: 60,
            servingUnit: 'grams'
        },
        {
            name: 'Basmati Rice',
            nameUrdu: 'باسمتی چاول',
            category: 'rice',
            mealType: ['lunch', 'dinner'],
            calories: 130,
            protein: 2.7,
            carbs: 28.0,
            fats: 0.3,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 150,
            servingUnit: 'grams'
        },
        {
            name: 'Biryani',
            nameUrdu: 'بریانی',
            category: 'rice',
            mealType: ['lunch', 'dinner'],
            calories: 250,
            protein: 12.0,
            carbs: 35.0,
            fats: 7.0,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 200,
            servingUnit: 'grams'
        },
        {
            name: 'Chicken Karahi',
            nameUrdu: 'چکن کڑاہی',
            category: 'curry',
            mealType: ['lunch', 'dinner'],
            calories: 180,
            protein: 20.0,
            carbs: 5.0,
            fats: 8.0,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 150,
            servingUnit: 'grams'
        },
        {
            name: 'Daal',
            nameUrdu: 'دال',
            category: 'dal',
            mealType: ['lunch', 'dinner'],
            calories: 116,
            protein: 7.0,
            carbs: 20.0,
            fats: 1.5,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 150,
            servingUnit: 'grams'
        },
        {
            name: 'Aloo Gobi',
            nameUrdu: 'آلو گوبی',
            category: 'vegetable',
            mealType: ['lunch', 'dinner'],
            calories: 85,
            protein: 2.5,
            carbs: 12.0,
            fats: 3.0,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 150,
            servingUnit: 'grams'
        },
        {
            name: 'Paratha',
            nameUrdu: 'پرatha',
            category: 'bread',
            mealType: ['breakfast', 'lunch'],
            calories: 326,
            protein: 6.0,
            carbs: 45.0,
            fats: 14.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isDairyFree: false,
            allergens: ['wheat', 'dairy'],
            typicalServing: 80,
            servingUnit: 'grams'
        },
        {
            name: 'Halwa Puri',
            nameUrdu: 'حلوہ پوری',
            category: 'other',
            mealType: ['breakfast'],
            calories: 350,
            protein: 5.0,
            carbs: 45.0,
            fats: 16.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isDairyFree: false,
            allergens: ['wheat', 'dairy'],
            typicalServing: 100,
            servingUnit: 'grams'
        },
        {
            name: 'Chai',
            nameUrdu: 'چائے',
            category: 'beverage',
            mealType: ['breakfast', 'snack'],
            calories: 30,
            protein: 1.0,
            carbs: 5.0,
            fats: 1.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: false,
            allergens: ['dairy'],
            typicalServing: 200,
            servingUnit: 'ml'
        },
        {
            name: 'Samosa',
            nameUrdu: 'سموسہ',
            category: 'snack',
            mealType: ['snack'],
            calories: 262,
            protein: 4.2,
            carbs: 33.0,
            fats: 12.0,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: false,
            isDairyFree: true,
            allergens: ['wheat'],
            typicalServing: 50,
            servingUnit: 'grams'
        },
        {
            name: 'Pakora',
            nameUrdu: 'پکوڑا',
            category: 'snack',
            mealType: ['snack'],
            calories: 200,
            protein: 5.0,
            carbs: 20.0,
            fats: 10.0,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: false,
            isDairyFree: true,
            allergens: ['wheat'],
            typicalServing: 50,
            servingUnit: 'grams'
        },
        {
            name: 'Kheer',
            nameUrdu: 'کھیر',
            category: 'dessert',
            mealType: ['snack', 'dessert'],
            calories: 150,
            protein: 3.0,
            carbs: 25.0,
            fats: 4.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: false,
            allergens: ['dairy', 'nuts'],
            typicalServing: 100,
            servingUnit: 'grams'
        },
        {
            name: 'Chana Masala',
            nameUrdu: 'چنا مسالا',
            category: 'curry',
            mealType: ['lunch', 'dinner'],
            calories: 140,
            protein: 7.0,
            carbs: 22.0,
            fats: 3.0,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 150,
            servingUnit: 'grams'
        },
        {
            name: 'Bhindi Masala',
            nameUrdu: 'بھنڈی مسالا',
            category: 'vegetable',
            mealType: ['lunch', 'dinner'],
            calories: 90,
            protein: 2.5,
            carbs: 10.0,
            fats: 4.0,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 150,
            servingUnit: 'grams'
        },
        {
            name: 'Karahi Gosht',
            nameUrdu: 'کڑاہی گوشت',
            category: 'meat',
            mealType: ['lunch', 'dinner'],
            calories: 220,
            protein: 25.0,
            carbs: 3.0,
            fats: 11.0,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 150,
            servingUnit: 'grams'
        },
        {
            name: 'Raita',
            nameUrdu: 'رائتا',
            category: 'side',
            mealType: ['lunch', 'dinner', 'side'],
            calories: 60,
            protein: 2.0,
            carbs: 5.0,
            fats: 3.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: false,
            allergens: ['dairy'],
            typicalServing: 100,
            servingUnit: 'grams'
        },
        {
            name: 'Aloo Paratha',
            nameUrdu: 'آلو پرatha',
            category: 'bread',
            mealType: ['breakfast', 'lunch'],
            calories: 350,
            protein: 7.0,
            carbs: 50.0,
            fats: 14.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isDairyFree: false,
            allergens: ['wheat', 'dairy'],
            typicalServing: 100,
            servingUnit: 'grams'
        },
        {
            name: 'Chicken Tikka',
            nameUrdu: 'چکن تکہ',
            category: 'meat',
            mealType: ['lunch', 'dinner'],
            calories: 200,
            protein: 22.0,
            carbs: 2.0,
            fats: 10.0,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: true,
            allergens: [],
            typicalServing: 100,
            servingUnit: 'grams'
        },
        {
            name: 'Lassi',
            nameUrdu: 'لسی',
            category: 'beverage',
            mealType: ['breakfast', 'snack'],
            calories: 100,
            protein: 3.0,
            carbs: 12.0,
            fats: 4.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: true,
            isDairyFree: false,
            allergens: ['dairy'],
            typicalServing: 250,
            servingUnit: 'ml'
        },
        {
            name: 'Gulab Jamun',
            nameUrdu: 'گلاب جامن',
            category: 'dessert',
            mealType: ['snack', 'dessert'],
            calories: 150,
            protein: 2.0,
            carbs: 28.0,
            fats: 4.0,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isDairyFree: false,
            allergens: ['wheat', 'dairy'],
            typicalServing: 40,
            servingUnit: 'grams'
        }
    ];
};
