import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, action: string = 'OK', duration: number = 4000): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    };
    this.snackBar.open(`✨ ${message}`, action, config);
  }

  warn(message: string, action: string = 'ENTENDIDO', duration: number = 4500): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['toast-warn'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    };
    this.snackBar.open(`⚠️ ${message}`, action, config);
  }

  error(message: string, action: string = 'CERRAR', duration: number = 5000): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    };
    this.snackBar.open(`🛑 ${message}`, action, config);
  }

  info(message: string, action: string = 'OK', duration: number = 3500): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: ['toast-info'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    };
    this.snackBar.open(`ℹ️ ${message}`, action, config);
  }
}
