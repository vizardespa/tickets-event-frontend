import { Component } from '@angular/core';
import { Checkout } from '../checkout/checkout';

@Component({
  selector: 'app-dashboard',
  imports: [Checkout],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
