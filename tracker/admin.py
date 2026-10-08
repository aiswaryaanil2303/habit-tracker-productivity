from django.contrib import admin
from .models import UserProfile, Habit, HabitLog

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'avatar_color', 'reminders_enabled')
    search_fields = ('user__username', 'user__email')

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'goal_type', 'goal_value', 'is_active', 'created_at')
    list_filter = ('category', 'goal_type', 'is_active')
    search_fields = ('title', 'user__username', 'description')

@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'completed')
    list_filter = ('date', 'completed')
    search_fields = ('habit__title', 'habit__user__username')
