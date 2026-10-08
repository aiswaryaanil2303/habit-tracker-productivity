from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import datetime
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, max_length=500)
    avatar_color = models.CharField(max_length=7, default='#3b82f6')  # Hex color for custom profile icon background
    reminders_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

class Habit(models.Model):
    CATEGORY_CHOICES = [
        ('health', 'Health & Fitness'),
        ('work', 'Work & Productivity'),
        ('study', 'Education & Study'),
        ('finance', 'Finance & Saving'),
        ('mind', 'Mindfulness & Meditation'),
        ('social', 'Social & Relationships'),
        ('custom', 'Custom & Other'),
    ]
    
    GOAL_TYPE_CHOICES = [
        ('daily', 'Daily Goal'),
        ('weekly', 'Weekly Goal'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='custom')
    goal_type = models.CharField(max_length=10, choices=GOAL_TYPE_CHOICES, default='daily')
    goal_value = models.PositiveIntegerField(default=1, help_text="Target completion count")
    reminder_time = models.TimeField(null=True, blank=True, help_text="Time to execute the habit")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    is_template = models.BooleanField(default=False)
    template_status = models.CharField(
        max_length=20, 
        choices=[('pending', 'Pending Approval'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='approved'
    )

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

    def get_streak(self):
        """
        Returns current consecutive completion streak.
        A streak is active if completed today or yesterday.
        """
        completed_dates = set(
            self.logs.filter(completed=True).values_list('date', flat=True)
        )
        if not completed_dates:
            return 0

        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)

        # Check if streak is active
        if today not in completed_dates and yesterday not in completed_dates:
            return 0

        current_date = today if today in completed_dates else yesterday
        streak = 0
        while current_date in completed_dates:
            streak += 1
            current_date -= datetime.timedelta(days=1)
        return streak

    def get_best_streak(self):
        """
        Calculates historical best completion streak.
        """
        completed_dates = sorted(list(
            self.logs.filter(completed=True).values_list('date', flat=True)
        ))
        if not completed_dates:
            return 0

        best_streak = 0
        current_streak = 0
        prev_date = None

        for date in completed_dates:
            if prev_date is None:
                current_streak = 1
            elif (date - prev_date).days == 1:
                current_streak += 1
            elif (date - prev_date).days > 1:
                best_streak = max(best_streak, current_streak)
                current_streak = 1
            prev_date = date

        best_streak = max(best_streak, current_streak)
        return best_streak

    def get_completion_rate(self, days=30):
        """
        Returns completion percentage over the last X days.
        """
        today = timezone.localdate()
        start_date = today - datetime.timedelta(days=days-1)
        
        created_date = self.created_at.date()
        if created_date > start_date:
            start_date = created_date
        
        total_days = (today - start_date).days + 1
        if total_days <= 0:
            return 0
        
        completed_count = self.logs.filter(
            date__range=[start_date, today],
            completed=True
        ).count()
        
        return round((completed_count / total_days) * 100)

class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    completed = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('habit', 'date')
        ordering = ['-date']

    def __str__(self):
        status = "Completed" if self.completed else "Missed"
        return f"{self.habit.title} - {self.date} ({status})"
