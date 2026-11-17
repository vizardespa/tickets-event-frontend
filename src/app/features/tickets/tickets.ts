import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TicketType } from '../../shared/models/ticket-type.model';
import { EventService } from '../../shared/services/event.service';
import { TicketTypeService } from '../../shared/services/ticket-type.service';
import { TicketPhase } from './ticket-phase/ticket-phase';

@Component({
  selector: 'app-tickets',
  imports: [TicketPhase],
  templateUrl: './tickets.html',
  styleUrl: './tickets.scss',
})
export class Tickets {
  router = inject(Router);
  eventService = inject(EventService);
  ticketTypeService = inject(TicketTypeService);

  eventResource = rxResource({
    stream: () => this.eventService.getTJREvent(),
  });

  ticketTypesResource = rxResource({
    params: () => this.eventResource.value()?.id,
    stream: ({ params: eventId }) => this.ticketTypeService.getByEvent(eventId),
    defaultValue: [],
  });

  phase1TicketType = computed(() =>
    this.ticketTypesResource.value().find((t) => t.name.includes('Comunidad'))
  );
  phase2TicketType = computed(() =>
    this.ticketTypesResource.value().find((t) => t.name.includes('Tijuana'))
  );
  phase3TicketType = computed(() =>
    this.ticketTypesResource.value().find((t) => t.name.includes('Rockea'))
  );
  phase4TicketType = computed(() =>
    this.ticketTypesResource.value().find((t) => t.name.includes('Frontera'))
  );
  phase5TicketType = computed(() =>
    this.ticketTypesResource.value().find((t) => t.name.includes('Julio'))
  );

  onTicketClick(ticketType: TicketType | undefined) {
    if (ticketType) {
      this.router.navigate(['/checkout'], {
        queryParams: { eventId: this.eventResource.value()?.id, ticketTypeId: ticketType.id },
      });
    }
  }
}
