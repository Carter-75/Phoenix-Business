import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.css',
})
export class Services implements AfterViewInit {
  @ViewChildren('serviceCard') serviceCards!: QueryList<ElementRef>;

  services = [
    {
      title: 'Eco-Friendly Products',
      description: 'We use organic microbial treatments, compost top-dressing, and slow-release natural nutrients instead of heavy synthetic fertilizers that wash into local waterways.',
      image: 'assets/image1.png',
      tag: 'Eco-Intelligence'
    },
    {
      title: 'Zero-Emission Maintenance',
      description: 'Your weekend morning shouldn\'t sound like a construction zone. Our entire maintenance fleet is 100% battery-powered and charged via renewable energy. Zero emissions, fraction of the noise.',
      image: 'assets/image4.png',
      tag: 'Quiet & Clean'
    },
    {
      title: 'Native Landscaping',
      description: 'A great yard isn\'t just a green square. We advocate for integrating native perennial borders, rain gardens, and pollinator zones that reduce water reliance and give local birds and bees a place to thrive.',
      image: 'assets/image3.png',
      tag: 'Biodiversity'
    },
    {
      title: 'Smart Water Conservation',
      description: 'We install and manage intelligent irrigation systems that monitor soil moisture and weather forecasts, ensuring your lawn gets exactly the water it needs—and nothing more.',
      image: 'assets/image2.png',
      tag: 'Efficiency'
    }
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-12');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    this.serviceCards.forEach((card) => {
      // Setup initial CSS state instead of GSAP
      card.nativeElement.classList.add('transition-all', 'duration-700', 'ease-out', 'opacity-0', 'translate-y-12');
      observer.observe(card.nativeElement);
    });
  }
}
