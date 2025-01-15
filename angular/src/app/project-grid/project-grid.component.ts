import { Component, OnInit } from '@angular/core';
import { TaskService } from '../services/task.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-project-grid',
  standalone: false,
  
  templateUrl: './project-grid.component.html',
  styleUrl: './project-grid.component.css'
})

export class ProjectGridComponent implements OnInit {
	projects: any[] = [];

	constructor(private taskService: TaskService, private datePipe: DatePipe) {}

	ngOnInit(): void {
		const userId = 1;

		this.taskService.getTasks(userId).subscribe((data) => {
			this.projects = data;
		});
	}

	createProject(): void {
		console.log('Create New Project button clicked');
	}

	toggleTask(task: any): void {
		if(task.active) {
			this.taskService.deactivateTask(task.tsk_id).subscribe(() => {
				task.active = false;
			});
		} else {
			const now = new Date();
			const inp_time = this.datePipe.transform(now, 'yyyy-MM-dd HH:mm:ss') as string;
			this.taskService.activateTask(task.tsk_id, 1, 1, inp_time).subscribe(() => {
				task.active = true;
			});
		}
	}
}
