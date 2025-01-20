import { Component } from '@angular/core';

type CalendarView = 'Yearly' | 'Monthly' | 'Weekly' | 'Daily';

@Component({
  selector: 'app-calendar',
  standalone: false,
  
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})

export class CalendarComponent {
	view: CalendarView = 'Yearly';
	selectedDate: Date = new Date();

	switchView(view: CalendarView): void { 
		this.view = view;
	}

	navigate(direction: 'previous' | 'next'): void {
		const date = new Date(this.selectedDate);
		const sgn = direction === 'next' ? 1 : -1;
		if (this.view === 'Yearly') {
			date.setFullYear(date.getFullYear() + sgn);
		} else if (this.view === 'Monthly') {
			date.setMonth(date.getMonth() + sgn);
		} else if (this.view === 'Weekl') {
			date.setDate(date.getDate() + sgn * 7);
		} else if (this.view === 'Daily') {
			date.setDate(date.getDate() + sgn);
		}

		this.selectedDate = date;
	}
}
