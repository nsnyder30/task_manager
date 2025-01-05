import { Component } from '@angular/core';

@Component({
  selector: 'app-tutorial',
  standalone: false,
  
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.css'
})
export class TutorialComponent {
	title = 'Tutorial Title';
}
