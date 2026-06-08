import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { WORLD_CUP_TEAMS } from '../../core/constants/teams';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  teams = WORLD_CUP_TEAMS;
  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    championPick: ['', Validators.required]
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (value.password !== value.confirmPassword) {
      this.error.set('Le password non coincidono.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.register(value.username, value.password, value.championPick);
      await this.router.navigateByUrl('/calendario');
    } catch (error: any) {
      console.error('Errore registrazione:', error);
      const code = error?.code;
      const message = error?.message;
      if (message === 'USERNAME_NON_VALIDO') this.error.set('Username non valido. Usa almeno 3 caratteri validi.');
      else if (code === 'auth/invalid-email') this.error.set('Username non valido. Evita spazi, accenti o simboli speciali.');
      else if (code === 'auth/email-already-in-use') this.error.set('Username già registrato.');
      else if (code === 'auth/operation-not-allowed') this.error.set('Abilita Email/Password in Firebase Authentication.');
      else if (code === 'auth/weak-password') this.error.set('Password troppo debole. Usa almeno 6 caratteri.');
      else this.error.set(`Registrazione non riuscita: ${code || message || 'errore sconosciuto'}`);
    } finally {
      this.loading.set(false);
    }
  }
}
