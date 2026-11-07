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
  templateUrl: './tickets-list.component.html',
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
