import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface BuyTicketDialogData {
  eventName: string;
}

export interface BuyTicketResult {
  ownerName: string;
  ownerEmail: string;
}

/**
 * Dialog that collects the buyer's name and email before purchasing a ticket.
 */
@Component({
  selector: 'app-buy-ticket-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Buy ticket — {{ data.eventName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-2 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>Full name</mat-label>
          <input matInput formControlName="ownerName" placeholder="Ada Lovelace" />
          @if (form.controls.ownerName.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="ownerEmail" placeholder="ada@example.com" />
          @if (form.controls.ownerEmail.hasError('required')) {
            <mat-error>Email is required</mat-error>
          }
          @if (form.controls.ownerEmail.hasError('email')) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="confirm()">
        Confirm purchase
      </button>
    </mat-dialog-actions>
  `,
})
export class BuyTicketDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    ownerName: ['', Validators.required],
    ownerEmail: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<BuyTicketDialogComponent, BuyTicketResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: BuyTicketDialogData
  ) {}

  confirm(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
