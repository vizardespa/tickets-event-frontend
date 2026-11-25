import { Routes } from '@angular/router';
import { Contact } from './features/contact/contact';
import { Dashboard } from './features/dashboard/dashboard';
import { History } from './features/history/history';
import { LineUp } from './features/line-up/line-up';
import { Merch } from './features/merch/merch';
import { Tickets } from './features/tickets/tickets';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Dashboard },
  { path: 'line-up', component: LineUp },
  // { path: 'events', component: EventsListComponent },
  // { path: 'events/:id', component: EventDetailComponent },
  // { path: 'checkout', component: Checkout },
  { path: 'tickets', component: Tickets },
  { path: 'merch', component: Merch },
  { path: 'contact', component: Contact },
  { path: 'history', component: History },
  { path: '**', redirectTo: 'events' },
];
