import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class TaskService {
	private apiUrl = 'http://localhost:3000/api/task';

	constructor(private http: HttpClient) {}

	getTasks(user_id: number): Observable<any[]> {
		let data = this.http.get<any[]>(`${this.apiUrl}/by_user/${user_id}`);
		return data;
	}

	activateTask(task_id: number, owner: number, uid: number, start_time: string): Observable<any> {
		const body = {
			task_id: task_id, 
			owner: owner, 
			uid: uid, 
			start_time: start_time
		};
		return this.http.post<any>(`${this.apiUrl}/activate/`, body);
	}

	deactivateTask(task_id: number): Observable<any> {
		const body = {task_id: task_id};
		return this.http.post<any>(`${this.apiUrl}/deactivate/`, body);
	}
}
