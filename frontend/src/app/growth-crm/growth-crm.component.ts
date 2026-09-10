import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
@Component({selector:'app-growth-crm',standalone:true,imports:[CommonModule,FormsModule],template: `
<section class="section-padding max-w-5xl mx-auto"><h1 class="text-3xl font-bold">Project requests</h1>
<p class="my-4">Latest 100 requests. No automated prospect sending is enabled here.</p>
<p role="status">{{ notice() }}</p><button class="premium-btn my-4" (click)="load()">Refresh</button>
<article *ngFor="let item of items()" class="border border-white/20 p-6 my-4">
<h2 class="text-xl">{{ item.businessName || item.name }}</h2><p>{{ item.email }} · {{ item.createdAt | date:'short' }}</p>
<p class="my-2">{{ item.website }}</p><p class="whitespace-pre-wrap">{{ item.message }}</p>
<p class="my-2">Owner notification: {{ item.notification }}. Source: {{ item.attribution?.utm_source || 'unknown' }}</p>
<label class="block">Stage <select [(ngModel)]="item.stage" class="bg-black border p-2"><option *ngFor="let stage of stages" [value]="stage">{{ stage }}</option></select></label>
<label class="block my-3">Next action <input [(ngModel)]="item.nextAction" maxlength="1000" class="bg-black border p-2 w-full"></label>
<label class="block my-3">Due date <input type="date" [(ngModel)]="item.dueDate" class="bg-black border p-2"></label>
<button class="premium-btn" (click)="save(item)">Save</button></article></section>`})
export class GrowthCrmComponent implements OnInit {
 private api=inject(ApiService); items=signal<any[]>([]); notice=signal('');
 stages=['new','qualified','call_booked','proposal','won','lost'];
 ngOnInit(){ this.load(); }
 load(){ this.api.get<any[]>('leads/requests').subscribe({next: rows=>{this.items.set(rows.map(row=>({...row,dueDate:row.nextActionAt?.slice(0,10)||''})));this.notice.set(rows.length ? '' : 'No saved requests.');},error:()=>this.notice.set('Owner access is required. Sign in and configure the owner account ID. No records are shown.')}); }
 save(item:any){ this.api.patch('leads/requests/'+item._id,{stage:item.stage,nextAction:item.nextAction,nextActionAt:item.dueDate||null}).subscribe({next:()=>this.notice.set('Saved.'),error:()=>this.notice.set('Save failed. Your changes have not been stored.')}); }
}
