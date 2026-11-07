import { Component } from '@angular/core';
import { Checkout } from '../checkout/checkout';
import { EventsListComponent } from '../events/events-list/events-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [EventsListComponent, Checkout],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
