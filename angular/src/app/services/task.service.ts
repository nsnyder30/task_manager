import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class TaskService {
	private apiUrl = 'http://localhost:3000/api/task/by_user';

	constructor(private http: HttpClient) {}

	getTasks(user_id: number): Observable<any[]> {
console.log('getTasks method from task service called');
		let data = this.http.get<any[]>(`${this.apiUrl}/${user_id}`);
console.log(data);	
		return data;
	}
}
