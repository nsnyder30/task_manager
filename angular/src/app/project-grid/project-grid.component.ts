import { Component, OnInit } from '@angular/core';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-project-grid',
  standalone: false,
  
  templateUrl: './project-grid.component.html',
  styleUrl: './project-grid.component.css'
})

export class ProjectGridComponent implements OnInit {
	projects: any[] = [];

	constructor(private taskService: TaskService) {}

	ngOnInit(): void {
		const userId = 1;

		this.taskService.getTasks(userId).subscribe((data) => {
			this.projects = data;
		});
	}

	createProject(): void {
		console.log('Create New Project button clicked');
	}
}
