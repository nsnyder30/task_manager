import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes, RouterOutlet } from '@angular/router';
import { AppComponent } from './app.component';
import { TestComponent } from './test/test.component';
import { TutorialComponent } from './tutorial/tutorial.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
	{path: '', component: LoginComponent},
	{path: 'test', component: TestComponent}, 
	{path: 'tutorial', component: TutorialComponent}
]

@NgModule({
	declarations: [
		AppComponent, 
		LoginComponent, 
		TestComponent,
		TutorialComponent,
	], 
	imports: [
		BrowserModule, 
		HttpClientModule, 
		RouterOutlet, 
		RouterModule.forRoot(routes)
	], 
	exports: [
		RouterModule,
		RouterOutlet
	], 
	bootstrap: [AppComponent]
})

export class AppModule { }
