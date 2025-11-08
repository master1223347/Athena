
# Fixes for CoursesPage and CalendarPage

The following files need to be updated to fix TypeScript errors related to AchievementMetrics:

## src/pages/CoursesPage.tsx

Replace:
```typescript
userDataService.checkAndUpdateAchievements(user.id, {
  courseViews: true
});
```

With:
```typescript
userDataService.checkAndUpdateAchievements(user.id, {
  currentPage: 'courses'
});
```

Also replace:
```typescript
userDataService.checkAndUpdateAchievements(user.id, {
  courseEdits: true
});
```

With:
```typescript
userDataService.checkAndUpdateAchievements(user.id, {
  currentPage: 'course-edit'
});
```

## src/pages/CalendarPage.tsx

Replace:
```typescript
userDataService.checkAndUpdateAchievements(user.id, {
  courseEdits: true
});
```

With:
```typescript
userDataService.checkAndUpdateAchievements(user.id, {
  currentPage: 'calendar'
});
```

Also replace any objects with complex metrics like:
```typescript
userDataService.checkAndUpdateAchievements(user.id, { 
  assignmentsCompleted: number;
  coursesWithProgressAbove: { 25: number; 50: number; 75: number; };
  completedCourses: number;
  earlySubmissions: number;
});
```

With:
```typescript
// For now, just track page view
userDataService.checkAndUpdateAchievements(user.id, {
  currentPage: 'calendar'
});
```
