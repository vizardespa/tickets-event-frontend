import { Routes } from '@angular/router';
import { Checkout } from './features/checkout/checkout';
import { Dashboard } from './features/dashboard/dashboard';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { EventsListComponent } from './features/events/events-list/events-list.component';
import { TicketsListComponent } from './features/tickets/tickets-list/tickets-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'events', component: EventsListComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'checkout', component: Checkout },
  { path: 'tickets', component: TicketsListComponent },
  { path: '**', redirectTo: 'events' },
];
