import { Routes } from '@angular/router';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { EventsListComponent } from './features/events/events-list/events-list.component';
import { TicketsListComponent } from './features/tickets/tickets-list/tickets-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  { path: 'events', component: EventsListComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'tickets', component: TicketsListComponent },
  { path: '**', redirectTo: 'events' },
];
