import { Component } from '@angular/core';
import { EventsListComponent } from '../events/events-list/events-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [EventsListComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
