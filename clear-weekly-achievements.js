// Script to clear weekly achievement cache
// Run this in the browser console to clear cached weekly achievement data

console.log('🧹 Clearing Weekly Achievement Cache...');

// Get all localStorage keys
const keys = Object.keys(localStorage);

// Find and remove weekly achievement keys
const weeklyKeys = keys.filter(key => key.includes('weekly_achievements'));
console.log(`Found ${weeklyKeys.length} weekly achievement keys:`);
weeklyKeys.forEach(key => {
  console.log(`  - ${key}`);
  localStorage.removeItem(key);
});

console.log('✅ Weekly achievement cache cleared!');
console.log('🔄 Please refresh the page to see updated XP values (30, 50, 100)');

// Also clear any other achievement-related cache
const achievementKeys = keys.filter(key => 
  key.includes('achievement') || 
  key.includes('weekly') || 
  key.includes('selection')
);

if (achievementKeys.length > 0) {
  console.log(`\n🧹 Also clearing ${achievementKeys.length} other achievement-related keys:`);
  achievementKeys.forEach(key => {
    console.log(`  - ${key}`);
    localStorage.removeItem(key);
  });
}

console.log('\n🎯 Expected XP values after refresh:');
console.log('  - Easy: 30 XP');
console.log('  - Medium: 50 XP'); 
console.log('  - Hard: 100 XP');
