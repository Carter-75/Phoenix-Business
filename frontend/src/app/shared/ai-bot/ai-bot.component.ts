import { Component, inject, signal, effect, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-ai-bot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Chat Button -->
    <button *ngIf="!isOpen()" (click)="toggleChat()" class="fixed bottom-6 right-6 z-[200] w-14 h-14 bg-orange-600 hover:bg-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 hover:-translate-y-1">
      <i class="fa-solid fa-robot text-2xl"></i>
    </button>

    <!-- Chat Window -->
    <div *ngIf="isOpen()" class="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[200] w-[calc(100vw-3rem)] sm:w-[400px] h-[550px] max-h-[calc(100vh-6rem)] bg-[#050505] border border-orange-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all animate-fade-in">
      
      <!-- Header -->
      <div class="p-4 bg-orange-600/10 border-b border-orange-500/20 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(234,88,12,0.5)]">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div>
            <h3 class="text-white font-black uppercase tracking-widest text-xs">Phoenix AI</h3>
            <p class="text-orange-400 text-[9px] uppercase tracking-widest flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> Online</p>
          </div>
        </div>
        <button (click)="toggleChat()" class="text-slate-400 hover:text-white transition-colors p-2">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-orange-950/10 scroll-smooth" #scrollContainer>
        
        <!-- Welcome Message -->
        <div class="flex flex-col gap-1 items-start">
          <div class="bg-white/10 text-white border border-white/5 p-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[85%]">
            Hello! I am Phoenix, the official AI assistant for Phoenix Digital. How can I help you with your custom web development or software infrastructure needs today?
          </div>
        </div>

        <ng-container *ngFor="let msg of messages()">
          <!-- User Message -->
          <div *ngIf="msg.role === 'user'" class="flex flex-col gap-1 items-end">
            <div class="bg-orange-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%] leading-relaxed">
              {{ msg.content }}
            </div>
          </div>

          <!-- Bot Message -->
          <div *ngIf="msg.role === 'assistant'" class="flex flex-col gap-1 items-start">
            <div class="bg-white/10 text-white border border-white/5 p-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[85%] leading-relaxed whitespace-pre-wrap">
              {{ msg.content }}
            </div>
          </div>
        </ng-container>

        <!-- Typing Indicator -->
        <div *ngIf="isTyping()" class="flex flex-col gap-1 items-start">
          <div class="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1 w-fit">
             <div class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
             <div class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
             <div class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
          </div>
        </div>
        
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMsg()" class="bg-red-500/20 border-t border-red-500/30 p-2 text-center text-red-400 text-xs font-bold">
        {{ errorMsg() }}
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white/5 border-t border-white/10 shrink-0">
        <form (ngSubmit)="sendMessage()" class="relative flex items-center">
          <input 
            type="text" 
            [(ngModel)]="currentInput" 
            name="message" 
            placeholder="Type your message..." 
            class="w-full bg-black/50 border border-white/10 focus:border-orange-500 rounded-full pl-5 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
            [disabled]="isTyping()"
            autocomplete="off"
          >
          <button 
            type="submit" 
            [disabled]="!currentInput.trim() || isTyping()"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 rounded-full text-white transition-colors"
          >
            <i class="fa-solid fa-paper-plane text-[10px] ml-[-1px]"></i>
          </button>
        </form>
        <div class="text-center mt-2">
          <span class="text-[8px] uppercase tracking-widest text-slate-600 font-bold">AI Responses may be inaccurate</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class AiBotComponent implements AfterViewChecked {
  api = inject(ApiService);
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentInput = '';
  isTyping = signal(false);
  errorMsg = signal('');

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  sendMessage() {
    if (!this.currentInput.trim() || this.isTyping()) return;

    const userMessage: ChatMessage = { role: 'user', content: this.currentInput.trim() };
    this.messages.update(m => [...m, userMessage]);
    this.currentInput = '';
    this.isTyping.set(true);
    this.errorMsg.set('');

    this.api.post<any>('bot/chat', { messages: this.messages() }).subscribe({
      next: (res: any) => {
        this.messages.update(m => [...m, { role: 'assistant', content: res.reply }]);
        this.isTyping.set(false);
      },
      error: (err: any) => {
        this.isTyping.set(false);
        this.errorMsg.set(err.error?.error || 'Failed to connect to Phoenix AI.');
        
        // Remove the user message if it failed, or let them see the error?
        // It's usually better to just show the error.
      }
    });
  }
}
