from django.shortcuts import render, redirect
from django.shortcuts import get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Count, Q, Avg
import json
import datetime

from .models import UserProfile, Habit, HabitLog
from .forms import (
    UserRegisterForm, UserUpdateForm, UserProfileForm, HabitForm,
    AdminUserCreateForm, AdminUserEditForm, AdminPasswordResetForm, TemplateSuggestForm
)

def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            # UserProfile is auto-created via signals
            login(request, user)
            messages.success(request, f"Welcome, {user.username}! Your account has been created.")
            return redirect('dashboard')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = UserRegisterForm()
    return render(request, 'tracker/auth/register.html', {'form': form})

def forgot_password_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        # In a real app we'd trigger a password reset email here
        messages.success(request, f"Password reset instructions have been sent to {email}.")
        return redirect('login')
    return render(request, 'tracker/auth/forgot_password.html')

@login_required
def profile_view(request):
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = UserProfileForm(request.POST, instance=request.user.profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, "Your profile has been updated successfully!")
            return redirect('profile')
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = UserProfileForm(instance=request.user.profile)

    context = {
        'u_form': u_form,
        'p_form': p_form
    }
    return render(request, 'tracker/profile.html', context)

@login_required
def dashboard_view(request):
    today = timezone.localdate()
    # Fetch active habits for this user
    habits = Habit.objects.filter(user=request.user, is_active=True, is_archived=False, is_template=False)
    
    # Get completed habit ids for today
    completed_today_ids = set(
        HabitLog.objects.filter(
            habit__user=request.user,
            date=today,
            completed=True
        ).values_list('habit_id', flat=True)
    )

    # Decorate habits with a completion flag for today
    habit_data = []
    for habit in habits:
        habit_data.append({
            'object': habit,
            'completed_today': habit.id in completed_today_ids,
            'streak': habit.get_streak(),
            'completion_rate': habit.get_completion_rate(30)
        })

    # Stats calculations
    total_habits = len(habit_data)
    completed_count = len(completed_today_ids)
    completion_percentage = 0
    if total_habits > 0:
        completion_percentage = round((completed_count / total_habits) * 100)

    # Missed habits in the last 7 days (habits not logged as completed)
    # We look at each of the last 7 days and see if there are any active habits that were not completed.
    missed_habits = []
    for i in range(1, 8):
        check_date = today - datetime.timedelta(days=i)
        # Habits created on or before check_date that are active
        habits_on_date = Habit.objects.filter(
            user=request.user, 
            created_at__date__lte=check_date,
            is_active=True,
            is_archived=False,
            is_template=False
        )
        completed_on_date_ids = set(
            HabitLog.objects.filter(
                habit__user=request.user,
                date=check_date,
                completed=True
            ).values_list('habit_id', flat=True)
        )
        for h in habits_on_date:
            if h.id not in completed_on_date_ids:
                missed_habits.append({
                    'habit': h,
                    'date': check_date,
                    'days_ago': i
                })

    # Limit to top 5 missed habits for view layout
    missed_habits = missed_habits[:5]

    context = {
        'today': today,
        'habit_data': habit_data,
        'total_habits': total_habits,
        'completed_count': completed_count,
        'completion_percentage': completion_percentage,
        'missed_habits': missed_habits
    }
    return render(request, 'tracker/dashboard.html', context)

@login_required
def habit_list_view(request):
    habits = Habit.objects.filter(user=request.user, is_archived=False, is_template=False)
    habit_details = []
    for h in habits:
        habit_details.append({
            'object': h,
            'streak': h.get_streak(),
            'best_streak': h.get_best_streak(),
            'rate': h.get_completion_rate(30)
        })
    return render(request, 'tracker/habits.html', {'habits': habit_details})

@login_required
def habit_create_view(request):
    if request.method == 'POST':
        form = HabitForm(request.POST)
        if form.is_valid():
            habit = form.save(commit=False)
            habit.user = request.user
            habit.save()
            messages.success(request, f"Habit '{habit.title}' created successfully!")
            return redirect('habits')
    else:
        form = HabitForm()
    return render(request, 'tracker/habit_form.html', {'form': form, 'title': 'Create New Habit'})

@login_required
def habit_update_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk, user=request.user)
    if request.method == 'POST':
        form = HabitForm(request.POST, instance=habit)
        if form.is_valid():
            form.save()
            messages.success(request, f"Habit '{habit.title}' updated successfully!")
            return redirect('habits')
    else:
        form = HabitForm(instance=habit)
    return render(request, 'tracker/habit_form.html', {'form': form, 'title': f"Edit Habit: {habit.title}", 'edit': True, 'habit': habit})

@login_required
def habit_delete_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk, user=request.user)
    if request.method == 'POST':
        title = habit.title
        habit.delete()
        messages.success(request, f"Habit '{title}' was deleted.")
        return redirect('habits')
    return render(request, 'tracker/habit_confirm_delete.html', {'habit': habit})

@login_required
@require_POST
def habit_toggle_view(request):
    try:
        data = json.loads(request.body)
        habit_id = data.get('habit_id')
        completed = data.get('completed', False)
        
        habit = get_object_or_404(Habit, id=habit_id, user=request.user)
        today = timezone.localdate()

        log, created = HabitLog.objects.get_or_create(habit=habit, date=today)
        log.completed = completed
        log.save()

        # Recalculate stats for the dashboard response
        all_habits = Habit.objects.filter(user=request.user, is_active=True, is_archived=False, is_template=False)
        completed_today_count = HabitLog.objects.filter(
            habit__user=request.user,
            date=today,
            completed=True
        ).count()
        total_habits_count = all_habits.count()
        
        today_percentage = 0
        if total_habits_count > 0:
            today_percentage = round((completed_today_count / total_habits_count) * 100)

        return JsonResponse({
            'success': True,
            'completed': completed,
            'streak': habit.get_streak(),
            'best_streak': habit.get_best_streak(),
            'completion_rate': habit.get_completion_rate(30),
            'today_completed_count': completed_today_count,
            'today_percentage': today_percentage
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


# ==========================================================================
# Admin Module View Controllers & Logic
# ==========================================================================

def staff_required_decorator(view_func):
    return user_passes_test(lambda u: u.is_active and u.is_staff, login_url='login')(view_func)

@login_required
@staff_required_decorator
def admin_dashboard_view(request):
    today = timezone.localdate()
    
    # 1. High-Level Metrics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_habits = Habit.objects.filter(is_template=False).count()
    
    completions_today = HabitLog.objects.filter(
        date=today,
        completed=True
    ).count()
    
    # Overall System-Wide Productivity
    active_habits = Habit.objects.filter(is_active=True, is_archived=False, is_template=False)
    if active_habits.exists():
        rates = [h.get_completion_rate(30) for h in active_habits]
        system_productivity = round(sum(rates) / len(rates))
    else:
        system_productivity = 0

    # 2. Time-Based Stats (7 days and 30 days)
    seven_days_ago = today - datetime.timedelta(days=7)
    thirty_days_ago = today - datetime.timedelta(days=30)
    
    new_users_7d = User.objects.filter(date_joined__date__gte=seven_days_ago).count()
    new_users_30d = User.objects.filter(date_joined__date__gte=thirty_days_ago).count()
    
    completions_7d = HabitLog.objects.filter(date__gte=seven_days_ago, completed=True).count()
    completions_30d = HabitLog.objects.filter(date__gte=thirty_days_ago, completed=True).count()

    # 3. Chart Data: User Registrations (Last 7 Days)
    registration_chart_labels = []
    registration_chart_data = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        registration_chart_labels.append(day.strftime('%b %d'))
        registration_chart_data.append(
            User.objects.filter(date_joined__date=day).count()
        )

    # 4. Chart Data: Habit Completions (Last 7 Days)
    completion_chart_labels = []
    completion_chart_data = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        completion_chart_labels.append(day.strftime('%b %d'))
        completion_chart_data.append(
            HabitLog.objects.filter(date=day, completed=True).count()
        )

    # 5. Chart Data: Habits by Category
    categories_data = Habit.objects.filter(is_template=False).values('category').annotate(count=Count('id'))
    category_labels = []
    category_counts = []
    # Map raw choice codes to friendly labels
    category_choices_dict = dict(Habit.CATEGORY_CHOICES)
    for entry in categories_data:
        category_labels.append(category_choices_dict.get(entry['category'], entry['category']))
        category_counts.append(entry['count'])

    context = {
        'total_users': total_users,
        'active_users': active_users,
        'total_habits': total_habits,
        'completions_today': completions_today,
        'system_productivity': system_productivity,
        'new_users_7d': new_users_7d,
        'new_users_30d': new_users_30d,
        'completions_7d': completions_7d,
        'completions_30d': completions_30d,
        
        # JSON strings for javascript rendering
        'registration_labels_json': json.dumps(registration_chart_labels),
        'registration_data_json': json.dumps(registration_chart_data),
        'completion_labels_json': json.dumps(completion_chart_labels),
        'completion_data_json': json.dumps(completion_chart_data),
        'category_labels_json': json.dumps(category_labels),
        'category_counts_json': json.dumps(category_counts),
    }
    return render(request, 'tracker/admin/dashboard.html', context)


@login_required
@staff_required_decorator
def admin_users_view(request):
    query = request.GET.get('q', '')
    if query:
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).order_by('-date_joined')
    else:
        users = User.objects.all().order_by('-date_joined')
        
    return render(request, 'tracker/admin/users.html', {'users': users, 'query': query})


@login_required
@staff_required_decorator
def admin_user_create_view(request):
    if request.method == 'POST':
        form = AdminUserCreateForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            messages.success(request, f"User account '{user.username}' created successfully!")
            return redirect('admin_users')
    else:
        form = AdminUserCreateForm()
    return render(request, 'tracker/admin/user_form.html', {'form': form, 'title': 'Add New User'})


@login_required
@staff_required_decorator
def admin_user_edit_view(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.method == 'POST':
        form = AdminUserEditForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            messages.success(request, f"User details for '{user.username}' updated successfully.")
            return redirect('admin_users')
    else:
        form = AdminUserEditForm(instance=user)
    return render(request, 'tracker/admin/user_form.html', {'form': form, 'title': f"Edit User: {user.username}", 'edit_mode': True})


@login_required
@staff_required_decorator
def admin_user_delete_view(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.user.id == user.id:
        messages.error(request, "You cannot delete your own admin account!")
        return redirect('admin_users')
        
    if request.method == 'POST':
        username = user.username
        user.delete()
        messages.success(request, f"User '{username}' has been deleted successfully.")
        return redirect('admin_users')
    return render(request, 'tracker/admin/user_confirm_delete.html', {'target_user': user})


@login_required
@staff_required_decorator
def admin_user_password_reset_view(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.method == 'POST':
        form = AdminPasswordResetForm(request.POST)
        if form.is_valid():
            user.set_password(form.cleaned_data['password'])
            user.save()
            messages.success(request, f"Password reset successfully for user '{user.username}'.")
            return redirect('admin_users')
    else:
        form = AdminPasswordResetForm()
    return render(request, 'tracker/admin/user_password_reset.html', {'form': form, 'target_user': user})


@login_required
@staff_required_decorator
def admin_user_report_view(request, pk):
    user = get_object_or_404(User, pk=pk)
    today = timezone.localdate()
    
    # Retrieve user stats
    habits = Habit.objects.filter(user=user, is_template=False)
    habit_details = []
    completed_today_count = 0
    
    for h in habits:
        is_completed_today = h.logs.filter(date=today, completed=True).exists()
        if is_completed_today:
            completed_today_count += 1
            
        habit_details.append({
            'object': h,
            'completed_today': is_completed_today,
            'streak': h.get_streak(),
            'best_streak': h.get_best_streak(),
            'rate': h.get_completion_rate(30)
        })
        
    total_habits = len(habit_details)
    completion_percentage = 0
    if total_habits > 0:
        completion_percentage = round((completed_today_count / total_habits) * 100)

    # Average 30-day productivity rate
    avg_productivity = 0
    if total_habits > 0:
        avg_productivity = round(sum(item['rate'] for item in habit_details) / total_habits)

    context = {
        'target_user': user,
        'habit_details': habit_details,
        'total_habits': total_habits,
        'completed_today_count': completed_today_count,
        'completion_percentage': completion_percentage,
        'avg_productivity': avg_productivity
    }
    return render(request, 'tracker/admin/user_report.html', context)


@login_required
@staff_required_decorator
def admin_habits_view(request):
    query = request.GET.get('q', '')
    category_filter = request.GET.get('category', '')
    
    habits = Habit.objects.filter(is_template=False)
    if query:
        habits = habits.filter(
            Q(title__icontains=query) |
            Q(user__username__icontains=query) |
            Q(description__icontains=query)
        )
    if category_filter:
        habits = habits.filter(category=category_filter)
        
    categories = Habit.CATEGORY_CHOICES
    return render(request, 'tracker/admin/habits.html', {
        'habits': habits,
        'query': query,
        'categories': categories,
        'category_filter': category_filter
    })


@login_required
@staff_required_decorator
def admin_habit_delete_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk)
    if request.method == 'POST':
        title = habit.title
        user_owner = habit.user.username
        habit.delete()
        messages.success(request, f"Habit '{title}' belonging to user '{user_owner}' was deleted.")
        return redirect('admin_habits')
    return render(request, 'tracker/habit_confirm_delete.html', {'habit': habit, 'admin_mode': True})


@login_required
def habit_toggle_archive_view(request, pk):
    # Admins or the owner can archive
    habit = get_object_or_404(Habit, pk=pk)
    if not request.user.is_staff and habit.user.id != request.user.id:
        messages.error(request, "Permission denied.")
        return redirect('dashboard')
        
    habit.is_archived = not habit.is_archived
    habit.save()
    
    status_str = "archived" if habit.is_archived else "restored"
    messages.success(request, f"Habit '{habit.title}' has been successfully {status_str}.")
    
    if request.user.is_staff:
        return redirect('admin_habits')
    return redirect('habits')


@login_required
@staff_required_decorator
def admin_templates_manager_view(request):
    if request.method == 'POST':
        # Admin creating a template directly
        form = HabitForm(request.POST)
        if form.is_valid():
            habit = form.save(commit=False)
            habit.user = request.user
            habit.is_template = True
            habit.template_status = 'approved'
            habit.save()
            messages.success(request, f"Public template '{habit.title}' created and approved successfully!")
            return redirect('admin_templates')
    else:
        form = HabitForm()
        
    templates = Habit.objects.filter(is_template=True).order_by('template_status', '-created_at')
    return render(request, 'tracker/admin/templates_manager.html', {
        'templates': templates,
        'form': form
    })


@login_required
@staff_required_decorator
@require_POST
def admin_template_status_view(request, pk):
    template = get_object_or_404(Habit, pk=pk, is_template=True)
    status = request.POST.get('status')
    if status in ['approved', 'rejected']:
        template.template_status = status
        template.save()
        messages.success(request, f"Template suggestion '{template.title}' has been {status}.")
    else:
        messages.error(request, "Invalid status action.")
    return redirect('admin_templates')


@login_required
def template_gallery_view(request):
    # Allow normal users to browse templates and copy them, and also suggest templates
    if request.method == 'POST':
        form = TemplateSuggestForm(request.POST)
        if form.is_valid():
            suggestion = form.save(commit=False)
            suggestion.user = request.user
            suggestion.is_template = True
            suggestion.template_status = 'pending'
            suggestion.save()
            messages.success(request, "Your public template suggestion has been submitted to admins for review!")
            return redirect('template_gallery')
    else:
        form = TemplateSuggestForm()
        
    approved_templates = Habit.objects.filter(is_template=True, template_status='approved')
    pending_suggestions = Habit.objects.filter(user=request.user, is_template=True, template_status='pending')
    
    return render(request, 'tracker/templates_gallery.html', {
        'templates': approved_templates,
        'pending_suggestions': pending_suggestions,
        'form': form
    })


@login_required
@require_POST
def add_from_template_view(request, pk):
    template = get_object_or_404(Habit, pk=pk, is_template=True, template_status='approved')
    # Copy the template parameters into a new habit for this user
    copied_habit = Habit.objects.create(
        user=request.user,
        title=template.title,
        description=template.description,
        category=template.category,
        goal_type=template.goal_type,
        goal_value=template.goal_value,
        reminder_time=template.reminder_time,
        is_template=False
    )
    messages.success(request, f"Successfully added habit '{copied_habit.title}' from template library!")
    return redirect('dashboard')

