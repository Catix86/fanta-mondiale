import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  user
} from '@angular/fire/auth';
import { Firestore, doc, docData, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { AppUser } from '../models/app-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  readonly firebaseUser$ = user(this.auth);
  readonly appUser$: Observable<AppUser | null> = this.firebaseUser$.pipe(
    switchMap(u => u ? docData(doc(this.firestore, `users/${u.uid}`)) as Observable<AppUser> : of(null))
  );

  private usernameToEmail(username: string): string {
    const normalizedUsername = username
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]/g, '');

    if (!normalizedUsername || normalizedUsername.length < 3) {
      throw new Error('USERNAME_NON_VALIDO');
    }

    return `${normalizedUsername}@fantamondiale.app`;
  }

  async register(username: string, password: string, championPick: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      this.usernameToEmail(username),
      password
    );

    try {
      await setDoc(doc(this.firestore, `users/${credential.user.uid}`), {
        uid: credential.user.uid,
        username: username.trim(),
        role: 'player',
        championPick,
        championPickLocked: true,
        points: 0,
        exactResults: 0,
        correctOutcomes: 0,
        championBonusAwarded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      await deleteUser(credential.user);
      throw error;
    }
  }

  login(username: string, password: string): Promise<unknown> {
    return signInWithEmailAndPassword(this.auth, this.usernameToEmail(username), password);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  cleanUsername(username: string): string {
    // Cerca se è presente la @ e rimuove tutto ciò che viene dopo
    const atIndex = username.indexOf('@');

    if (atIndex !== -1) {
      return username.substring(0, atIndex);
    }

    return username;
  }
}
