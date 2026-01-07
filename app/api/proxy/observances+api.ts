import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { db } from '@/lib/db';
import { culturalObservances } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: ExpoRequest) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');

    let results;
    
    if (date) {
      results = await db
        .select()
        .from(culturalObservances)
        .where(eq(culturalObservances.date, date));
    } else if (startDate && endDate) {
      results = await db
        .select()
        .from(culturalObservances)
        .where(
          and(
            gte(culturalObservances.date, startDate),
            lte(culturalObservances.date, endDate)
          )
        )
        .orderBy(culturalObservances.date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      results = await db
        .select()
        .from(culturalObservances)
        .where(eq(culturalObservances.date, today));
    }

    return ExpoResponse.json({ 
      success: true, 
      count: results.length,
      observances: results 
    });
  } catch (error) {
    console.error('Observances API error:', error);
    return ExpoResponse.json({ 
      success: false, 
      error: 'Failed to fetch observances' 
    }, { status: 500 });
  }
}
