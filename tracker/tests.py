from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

from .models import UserProfile, Habit, HabitLog

class HabitTrackerTestCase(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(username='testuser', password='password123', email='test@example.com')
        
    def test_user_profile_creation(self):
        # Test if UserProfile was created automatically via signals
        self.assertIsNotNone(self.user.profile)
        self.assertEqual(self.user.profile.bio, "")
        self.assertEqual(self.user.profile.avatar_color, "#3b82f6")

    def test_habit_creation(self):
        # Test creating a habit
        habit = Habit.objects.create(
            user=self.user,
            title='Read Books',
            description='Read for 30 mins',
            category='study',
            goal_type='daily',
            goal_value=1
        )
        self.assertEqual(habit.title, 'Read Books')
        self.assertTrue(habit.is_active)
        self.assertEqual(habit.get_streak(), 0)

    def test_streak_calculations(self):
        habit = Habit.objects.create(
            user=self.user,
            title='Exercise',
            category='health',
            goal_type='daily'
        )

        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)
        day_before = today - datetime.timedelta(days=2)

        # 1. Complete yesterday
        HabitLog.objects.create(habit=habit, date=yesterday, completed=True)
        self.assertEqual(habit.get_streak(), 1)

        # 2. Complete today as well
        HabitLog.objects.create(habit=habit, date=today, completed=True)
        self.assertEqual(habit.get_streak(), 2)

        # 3. Complete day before yesterday
        HabitLog.objects.create(habit=habit, date=day_before, completed=True)
        self.assertEqual(habit.get_streak(), 3)
        self.assertEqual(habit.get_best_streak(), 3)

        # 4. If we remove yesterday's log, streak should break
        HabitLog.objects.filter(habit=habit, date=yesterday).delete()
        # Today is completed (1 day streak), yesterday is NOT (break), day before is completed.
        # So current streak should be 1 (for today).
        self.assertEqual(habit.get_streak(), 1)
        # But best streak should still be 2 (yesterday + today was consecutive before delete, wait, day_before+yesterday+today was 3, but now day_before + today are separate so max chunk is 1).
        # Actually, let's verify best streak after deletion.
        # Logged dates are: day_before, today. Since they are separated by 2 days, best streak is 1.
        self.assertEqual(habit.get_best_streak(), 1)

    def test_blocked_user_cannot_login(self):
        # Block the user
        self.user.is_active = False
        self.user.save()
        
        # Try to authenticate
        success = self.client.login(username='testuser', password='password123')
        self.assertFalse(success)

    def test_standard_user_cannot_access_admin_dashboard(self):
        # Log in as normal user
        self.client.login(username='testuser', password='password123')
        
        # Request admin panel
        response = self.client.get('/admin-panel/')
        # Should redirect to login or dashboard
        self.assertEqual(response.status_code, 302)

    def test_staff_user_can_access_admin_dashboard(self):
        # Create a staff user
        staff_user = User.objects.create_user(
            username='staffadmin', 
            password='adminpassword', 
            email='staff@example.com',
            is_staff=True
        )
        # Log in
        self.client.login(username='staffadmin', password='adminpassword')
        
        # Request admin panel
        response = self.client.get('/admin-panel/')
        self.assertEqual(response.status_code, 200)

    def test_admin_habit_moderation_deletion(self):
        # Create a user habit
        habit = Habit.objects.create(
            user=self.user,
            title='Inappropriate Title',
            category='custom'
        )
        
        # Create staff user
        staff_user = User.objects.create_user(
            username='moderator', 
            password='adminpassword', 
            is_staff=True
        )
        self.client.login(username='moderator', password='adminpassword')
        
        # POST to delete
        response = self.client.post(f'/admin-panel/habits/{habit.id}/delete/')
        self.assertEqual(response.status_code, 302) # Redirects to admin habits list
        self.assertFalse(Habit.objects.filter(id=habit.id).exists())

