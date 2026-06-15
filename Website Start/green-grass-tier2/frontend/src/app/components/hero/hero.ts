import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import gsap from 'gsap';
import anime from 'animejs/lib/anime.es.js';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements AfterViewInit {
  @ViewChild('heroContent', { static: true }) heroContent!: ElementRef;
  @ViewChild('animationContainer', { static: true }) animationContainer!: ElementRef;
  
  ngAfterViewInit() {
    gsap.from(this.heroContent.nativeElement.children, {
      y: 40, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out'
    });

    const container = this.animationContainer.nativeElement;
    
    // Create animated elements
    for(let i=0; i<30; i++) {
      const el = document.createElement('div');
      el.classList.add('anime-node');
      const size = Math.random() * 20 + 10;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = Math.random() > 0.5 ? '#10B981' : '#84CC16';
      el.style.position = 'absolute';
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '20%';
      el.style.top = `${Math.random() * 100}%`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.opacity = '0.6';
      container.appendChild(el);
    }

    anime({
      targets: '.anime-node',
      translateX: function() { return anime.random(-100, 100) + 'px'; },
      translateY: function() { return anime.random(-100, 100) + 'px'; },
      scale: function() { return anime.random(0.5, 2); },
      rotate: function() { return anime.random(-360, 360); },
      borderRadius: function() { return ['50%', '20%', '50%'][anime.random(0,2)]; },
      duration: function() { return anime.random(3000, 8000); },
      delay: function() { return anime.random(0, 1000); },
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutQuad'
    });
  }
}
