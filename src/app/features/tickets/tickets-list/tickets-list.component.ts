import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Ticket } from '../../../shared/models/ticket.model';
import { TicketService } from '../../../shared/services/ticket.service';

/**
 * "My Tickets" page — lists all tickets in a Material table with a cancel action.
 */
@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterLink,
    DatePipe,
  ],
  template: `
    <section class="mx-auto max-w-5xl px-4 py-8">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">My Tickets</h1>
        <p class="text-sm text-gray-500">All purchased tickets and their status.</p>
      </header>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <div class="flex flex-col items-center gap-3 py-20 text-center">
          <mat-icon class="!h-12 !w-12 text-5xl text-red-400">error_outline</mat-icon>
          <p class="text-gray-600">{{ error() }}</p>
          <button mat-flat-button color="primary" (click)="load()">Retry</button>
        </div>
      } @else if (tickets().length === 0) {
        <div class="flex flex-col items-center gap-3 py-20 text-center text-gray-500">
          <mat-icon class="!h-12 !w-12 text-5xl">local_activity</mat-icon>
          <p>You have no tickets yet.</p>
          <a mat-flat-button color="primary" routerLink="/events">Browse events</a>
        </div>
      } @else {
        <div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <table mat-table [dataSource]="tickets()" class="w-full">
            <ng-container matColumnDef="owner">
              <th mat-header-cell *matHeaderCellDef>Owner</th>
              <td mat-cell *matCellDef="let t">
                <div class="font-medium">{{ t.ownerName }}</div>
                <div class="text-xs text-gray-500">{{ t.ownerEmail }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="seat">
              <th mat-header-cell *matHeaderCellDef>Seat</th>
              <td mat-cell *matCellDef="let t">#{{ t.seatNumber }}</td>
            </ng-container>

            <ng-container matColumnDef="purchasedAt">
              <th mat-header-cell *matHeaderCellDef>Purchased</th>
              <td mat-cell *matCellDef="let t">{{ t.purchasedAt | date: 'short' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let t">
                <mat-chip-set>
                  <mat-chip
                    [highlighted]="t.status === 'ACTIVE'"
                    [disabled]="t.status === 'CANCELLED'"
                  >
                    {{ t.status }}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
              <td mat-cell *matCellDef="let t" class="text-right">
                <button
                  mat-button
                  color="warn"
                  [disabled]="t.status === 'CANCELLED'"
                  (click)="cancel(t)"
                >
                  <mat-icon>cancel</mat-icon>
                  Cancel
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>
      }
    </section>
  `,
})
export class TicketsListComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['owner', 'seat', 'purchasedAt', 'status', 'actions'];
  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ticketService.getAll().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load tickets. Is the backend running?');
        this.loading.set(false);
      },
    });
  }

  cancel(ticket: Ticket): void {
    this.ticketService.cancel(ticket.id).subscribe({
      next: () => {
        this.snackBar.open('Ticket cancelled.', 'Dismiss', { duration: 4000 });
        this.load();
      },
      error: () => {
        this.snackBar.open('Failed to cancel ticket.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
