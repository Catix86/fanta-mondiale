import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path:
      'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path:
      'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/mobile-shell.component').then(m => m.MobileShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'calendario',
        loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
      },
      {
        path: 'classifica',
        loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
      },
      {
        path: 'squadra',
        loadComponent: () => import('./features/team/team.component').then(m => m.TeamComponent),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./features/teams/teams.component').then(m => m.TeamsComponent)
      },
      {
        path:
          'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path:
          '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
