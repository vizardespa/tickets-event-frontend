import { Component } from '@angular/core';
import { TicketTypePhase } from '../../shared/models/ticket-type.model';
import { TicketPhase } from './ticket-phase/ticket-phase';

@Component({
  selector: 'app-tickets',
  imports: [TicketPhase],
  templateUrl: './tickets.html',
  styleUrl: './tickets.scss',
})
export class Tickets {
  tickets: TicketTypePhase[] = [
    {
      name: $localize`Comunidad`,
      description: $localize`Acceso a la primera fase de venta de boletos.`,
      price: 1350,
      purchaseStartAt: '2026-11-16T00:00:00Z',
      purchaseEndAt: '2026-12-31T23:59:59Z',
      dateRangeLabel: $localize`16 NOVIEMBRE AL 31 DICIEMBRE`,
      imagePath: 'assets/img/TJ_MANO.png',
    },
    {
      name: 'Tijuana',
      description: $localize`Boleto General Fase Tijuana`,
      price: 1750,
      purchaseStartAt: '2027-01-01T00:00:00Z',
      purchaseEndAt: '2027-02-28T23:59:59Z',
      dateRangeLabel: $localize`1 ENERO AL 28 FEBRERO`,
      imagePath: 'assets/img/TJ_GHOST.png',
    },
    {
      name: $localize`Rockea`,
      description: $localize`Boleto General Fase Rockea`,
      price: 2150,
      purchaseStartAt: '2027-03-01T00:00:00Z',
      purchaseEndAt: '2027-04-30T23:59:59Z',
      dateRangeLabel: $localize`1 MARZO AL 30 ABRIL`,
      imagePath: '',
    },
    {
      name: $localize`Frontera`,
      description: $localize`Boleto General Fase Frontera`,
      price: 2550,
      purchaseStartAt: '2027-05-01T00:00:00Z',
      purchaseEndAt: '2027-06-30T23:59:59Z',
      dateRangeLabel: $localize`1 MAYO AL 30 JUNIO`,
      imagePath: '',
    },
    {
      name: $localize`Julio`,
      description: $localize`Boleto General Mes Julio`,
      price: 2950,
      purchaseStartAt: '2027-07-01T00:00:00Z',
      purchaseEndAt: '2027-07-16T23:59:59Z',
      dateRangeLabel: $localize`1 AL 16 JULIO`,
      imagePath: '',
    },
  ];

  onTicketClick() {
    window.open('https://ticketon.com/tl/azs73yw', '_blank');
  }
}
