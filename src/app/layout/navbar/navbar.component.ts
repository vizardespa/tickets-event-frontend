import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Top navigation bar with links to the Events and Tickets pages.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive],
  template: `
    <mat-toolbar color="primary" class="flex items-center gap-2 shadow-md">
      <a routerLink="/events" class="flex items-center gap-2 no-underline">
        <mat-icon>confirmation_number</mat-icon>
        <span class="text-lg font-semibold">TicketHub</span>
      </a>

      <span class="flex-1"></span>

      <nav class="flex items-center gap-1">
        <a
          mat-button
          routerLink="/events"
          routerLinkActive="!bg-white/20"
          [routerLinkActiveOptions]="{ exact: false }"
        >
          <mat-icon>event</mat-icon>
          <span class="ml-1 hidden sm:inline">Events</span>
        </a>
        <a mat-button routerLink="/tickets" routerLinkActive="!bg-white/20">
          <mat-icon>local_activity</mat-icon>
          <span class="ml-1 hidden sm:inline">My Tickets</span>
        </a>
      </nav>
    </mat-toolbar>
  `,
})
export class NavbarComponent {}
