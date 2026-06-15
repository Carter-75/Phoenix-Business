import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
})
export class Services implements AfterViewInit {
  @ViewChildren('serviceCard') serviceCards!: QueryList<ElementRef>;

  services = [
    { title: 'Eco-Intelligence', desc: 'Organic microbial treatments & slow-release nutrients.', img: 'assets/image1.png' },
    { title: 'Zero-Emission', desc: '100% battery-powered, renewable-charged fleet.', img: 'assets/image4.png' },
    { title: 'Biodiversity', desc: 'Native perennial borders & pollinator zones.', img: 'assets/image3.png' },
    { title: 'Water Conservation', desc: 'Intelligent, weather-forecasted irrigation.', img: 'assets/image2.png' }
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.to(entry.target, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    this.serviceCards.forEach((card) => {
      gsap.set(card.nativeElement, { y: 50, opacity: 0 });
      observer.observe(card.nativeElement);
    });
  }
}
