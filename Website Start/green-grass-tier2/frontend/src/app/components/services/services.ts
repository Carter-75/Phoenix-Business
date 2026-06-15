import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.css',
})
export class Services implements AfterViewInit {
  @ViewChildren('serviceRow') serviceRows!: QueryList<ElementRef>;

  services = [
    {
      title: 'Eco-Intelligence',
      description: 'We use organic microbial treatments, compost top-dressing, and slow-release natural nutrients instead of heavy synthetic fertilizers that wash into local waterways.',
      image: 'assets/image1.png',
      number: '01'
    },
    {
      title: 'Zero-Emission Focus',
      description: 'Your weekend morning shouldn\'t sound like a construction zone. Our entire maintenance fleet is 100% battery-powered and charged via renewable energy. Zero emissions, fraction of the noise.',
      image: 'assets/image4.png',
      number: '02'
    },
    {
      title: 'Biodiversity By Design',
      description: 'A great yard isn\'t just a green square. We advocate for integrating native perennial borders, rain gardens, and pollinator zones that reduce water reliance and give local birds and bees a place to thrive.',
      image: 'assets/image3.png',
      number: '03'
    },
    {
      title: 'Water Conservation',
      description: 'We install and manage intelligent irrigation systems that monitor soil moisture and weather forecasts, ensuring your lawn gets exactly the water it needs—and nothing more.',
      image: 'assets/image2.png',
      number: '04'
    }
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.to(entry.target, { x: 0, opacity: 1, duration: 1, ease: 'power3.out' });
          const img = entry.target.querySelector('img');
          if (img) gsap.to(img, { scale: 1, duration: 1.5, ease: 'power2.out' });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    this.serviceRows.forEach((row, index) => {
      const xOffset = index % 2 === 0 ? -50 : 50;
      gsap.set(row.nativeElement, { x: xOffset, opacity: 0 });
      
      const img = row.nativeElement.querySelector('img');
      if (img) gsap.set(img, { scale: 1.2 });
      
      observer.observe(row.nativeElement);
    });
  }
}
