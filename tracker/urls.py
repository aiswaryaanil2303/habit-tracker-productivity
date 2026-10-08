from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Auth Views
    path('register/', views.register_view, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='tracker/auth/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    
    # Profile View
    path('profile/', views.profile_view, name='profile'),
    
    # Dashboard
    path('', views.dashboard_view, name='dashboard'),
    
    # Habit Views
    path('habits/', views.habit_list_view, name='habits'),
    path('habits/create/', views.habit_create_view, name='habit_create'),
    path('habits/<int:pk>/edit/', views.habit_update_view, name='habit_edit'),
    path('habits/<int:pk>/delete/', views.habit_delete_view, name='habit_delete'),
    path('habits/<int:pk>/archive/', views.habit_toggle_archive_view, name='habit_archive'),
    path('habits/toggle/', views.habit_toggle_view, name='habit_toggle'),
    
    # Admin Panel
    path('admin-panel/', views.admin_dashboard_view, name='admin_dashboard'),
    path('admin-panel/users/', views.admin_users_view, name='admin_users'),
    path('admin-panel/users/create/', views.admin_user_create_view, name='admin_user_create'),
    path('admin-panel/users/<int:pk>/edit/', views.admin_user_edit_view, name='admin_user_edit'),
    path('admin-panel/users/<int:pk>/delete/', views.admin_user_delete_view, name='admin_user_delete'),
    path('admin-panel/users/<int:pk>/reset-password/', views.admin_user_password_reset_view, name='admin_user_password_reset'),
    path('admin-panel/users/<int:pk>/report/', views.admin_user_report_view, name='admin_user_report'),
    
    path('admin-panel/habits/', views.admin_habits_view, name='admin_habits'),
    path('admin-panel/habits/<int:pk>/delete/', views.admin_habit_delete_view, name='admin_habit_delete'),
    
    path('admin-panel/templates/', views.admin_templates_manager_view, name='admin_templates'),
    path('admin-panel/templates/<int:pk>/status/', views.admin_template_status_view, name='admin_template_status'),
    
    # Public Templates Gallery (User Facing)
    path('templates-gallery/', views.template_gallery_view, name='template_gallery'),
    path('templates-gallery/<int:pk>/add/', views.add_from_template_view, name='add_from_template'),
]
