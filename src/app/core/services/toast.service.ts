import { Injectable, signal } from '@angular/core';

export interface ToastState {
    message: string;
    type: 'success' | 'error';
    visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private timeoutId: any;

    toast = signal<ToastState>({
        message: '',
        type: 'success',
        visible: false
    });

    show(message: string, type: 'success' | 'error' = 'success'): void {
        clearTimeout(this.timeoutId);

        this.toast.set({
            message,
            type,
            visible: true
        });

        this.timeoutId = setTimeout(() => {
            this.hide();
        }, 3000);
    }

    hide(): void {
        this.toast.update(state => ({
            ...state,
            visible: false
        }));
    }
}
