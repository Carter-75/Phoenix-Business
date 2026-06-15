import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements AfterViewInit {
  @ViewChild('heroContent', { static: true }) heroContent!: ElementRef;

  ngAfterViewInit() {
    gsap.from(this.heroContent.nativeElement.children, {
      y: 60, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.2
    });
  }
}
