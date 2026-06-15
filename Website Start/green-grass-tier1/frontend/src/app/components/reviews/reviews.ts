import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.html',
})
export class Reviews implements AfterViewInit {
  @ViewChildren('reviewCard') reviewCards!: QueryList<ElementRef>;

  reviews = [
    { text: "Green Grass completely revitalized our front yard. The native borders look incredible and we've seen so many more butterflies.", author: "Sarah M.", role: "Homeowner" },
    { text: "I love that their entire fleet is battery-powered. I can actually work from home on Thursdays without hearing a gas mower screaming outside my window.", author: "James T.", role: "Remote Worker" },
    { text: "Their intelligent irrigation system cut our water bill by 30% this summer. Highly recommend their services.", author: "Elena R.", role: "Property Manager" }
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    this.reviewCards.forEach((card) => {
      card.nativeElement.classList.add('transition-all', 'duration-700', 'ease-out', 'opacity-0', 'translate-y-8');
      observer.observe(card.nativeElement);
    });
  }
}
