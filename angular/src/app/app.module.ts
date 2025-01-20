import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes, RouterOutlet } from '@angular/router';
import { AppComponent } from './app.component';
import { TestComponent } from './test/test.component';
import { TutorialComponent } from './tutorial/tutorial.component';
import { LoginComponent } from './login/login.component';
import { CreateAccountComponent } from './create-account/create-account.component';
import { ProjectGridComponent } from './project-grid/project-grid.component';
import { CalendarComponent } from './calendar/calendar.component';
import { DatePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const routes: Routes = [
	{path: '', component: LoginComponent},
	{path: 'test', component: TestComponent}, 
	{path: 'tutorial', component: TutorialComponent}, 
	{path: 'create-account', component: CreateAccountComponent}, 
	{path: 'home', component: ProjectGridComponent}, 
	{path: 'calendar', component: CalendarComponent}
]

@NgModule({
	declarations: [
  		CreateAccountComponent,
		AppComponent, 
		LoginComponent, 
		TestComponent,
		TutorialComponent,
		ProjectGridComponent,
		CalendarComponent,
	], 
	imports: [
		BrowserModule, 
		HttpClientModule, 
		RouterOutlet, 
		RouterModule.forRoot(routes), 
		BrowserAnimationsModule
	], 
	exports: [
		RouterModule,
		RouterOutlet
	], 
	providers: [DatePipe], 
	bootstrap: [AppComponent]
})

export class AppModule { }
