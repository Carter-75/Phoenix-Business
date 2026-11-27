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
    <!-- Floating Chat Button: dark glass pill in the nav language, flame mark, full pill on every screen size -->
    <button *ngIf="!isOpen()" (click)="toggleChat()" class="press-spring fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-[200] h-14 w-auto pl-3 pr-6 rounded-full bg-[#050508]/70 backdrop-blur-2xl border border-white/10 shadow-[0_24px_55px_rgba(0,0,0,0.55),0_0_25px_rgba(255,77,0,0.25)] flex items-center justify-center gap-3 text-white hover:border-[#FF4D00]/40 hover:shadow-[0_24px_55px_rgba(0,0,0,0.55),0_0_35px_rgba(255,77,0,0.45)]">
      <span class="flex items-center justify-center w-9 h-9 rounded-full bg-[#FF4D00]/15 border border-[#FF4D00]/40 shrink-0">
        <i class="fa-solid fa-fire text-[#FF4D00]"></i>
      </span>
      <span class="text-sm font-bold tracking-wide">Chat with Phoenix</span>
      <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
    </button>

    <!-- Chat Window: floating glass panel in the nav language -->
    <div *ngIf="isOpen()" class="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[200] w-[calc(100vw-3rem)] sm:w-[400px] h-[550px] max-h-[calc(100vh-6rem)] bg-[#050508]/85 backdrop-blur-2xl border border-white/10 rounded-[1.75rem] shadow-[0_24px_55px_rgba(0,0,0,0.6),0_0_35px_rgba(255,77,0,0.10)] flex flex-col overflow-hidden animate-fade-in">

      <!-- Header -->
      <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-[#FF4D00]/15 border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00] shrink-0">
            <i class="fa-solid fa-fire text-lg"></i>
          </div>
          <div>
            <h3 class="text-white font-black tracking-wide text-sm leading-tight">Phoenix</h3>
            <p class="text-white/40 text-[10px] flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> Online</p>
          </div>
        </div>
        <button (click)="toggleChat()" aria-label="Close chat" class="press-spring w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" #scrollContainer>

        <!-- Welcome Message -->
        <div class="flex flex-col gap-1 items-start">
          <div class="bg-white/[0.05] text-white border border-white/10 px-4 py-3 rounded-3xl rounded-tl-md text-sm shadow-sm max-w-[85%] leading-relaxed">
            Hello! I am Phoenix, the official AI assistant for Phoenix Websites AI. How can I help you with your custom web development or software infrastructure needs today?
          </div>
        </div>

        <!-- Quick Questions (shown until the first message is sent) -->
        <div *ngIf="messages().length === 0" class="flex flex-wrap gap-2">
          <button (click)="askQuick('What packages do you offer and what do they cost?')" class="press-spring text-xs font-semibold text-white/85 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full px-3.5 py-2">Packages and pricing</button>
          <button (click)="askQuick('I would like a free website audit.')" class="press-spring text-xs font-semibold text-white/85 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full px-3.5 py-2">Free website audit</button>
          <button (click)="askQuick('How do you build websites?')" class="press-spring text-xs font-semibold text-white/85 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full px-3.5 py-2">How do you build?</button>
        </div>

        <ng-container *ngFor="let msg of messages()">
          <!-- User Message -->
          <div *ngIf="msg.role === 'user'" class="flex flex-col gap-1 items-end">
            <div class="bg-[#FF4D00] text-white px-4 py-3 rounded-3xl rounded-tr-md text-sm shadow-[0_10px_25px_rgba(255,77,0,0.25)] max-w-[85%] leading-relaxed">
              {{ msg.content }}
            </div>
          </div>

          <!-- Bot Message -->
          <div *ngIf="msg.role === 'assistant'" class="flex flex-col gap-1 items-start">
            <div class="bg-white/[0.05] text-white border border-white/10 px-4 py-3 rounded-3xl rounded-tl-md text-sm shadow-sm max-w-[85%] leading-relaxed whitespace-pre-wrap">
              {{ msg.content }}
            </div>
          </div>
        </ng-container>

        <!-- Typing Indicator -->
        <div *ngIf="isTyping()" class="flex flex-col gap-1 items-start">
          <div class="bg-white/[0.05] border border-white/10 px-4 py-3 rounded-3xl rounded-tl-md shadow-sm flex items-center gap-1 w-fit">
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
      <div class="p-4 border-t border-white/10 shrink-0">
        <form (ngSubmit)="sendMessage()" class="flex items-center gap-3">
          <input
            type="text"
            [(ngModel)]="currentInput"
            name="message"
            placeholder="Type your message..."
            class="flex-1 min-w-0 bg-white/[0.04] border border-white/10 focus:border-[#FF4D00]/60 rounded-full px-5 py-3.5 text-sm text-white placeholder-white/30 outline-none transition-colors"
            [disabled]="isTyping()"
            autocomplete="off"
          >
          <button
            type="submit"
            aria-label="Send message"
            [disabled]="!currentInput.trim() || isTyping()"
            class="press-spring w-11 h-11 shrink-0 flex items-center justify-center bg-[#FF4D00] hover:bg-[#f97316] disabled:opacity-40 rounded-full text-white shadow-[0_10px_25px_rgba(255,77,0,0.35)]"
          >
            <i class="fa-solid fa-paper-plane text-sm ml-[-1px]"></i>
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
      animation: fadeIn 320ms cubic-bezier(0.22, 1.4, 0.36, 1) forwards;
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

  private summarySentFor = '';

  toggleChat() {
    const wasOpen = this.isOpen();
    this.isOpen.update(v => !v);
    if (wasOpen) this.maybeSendChatSummary();
  }

  // When a chat that captured the visitor's contact details closes, send the
  // conversation to the backend, which emails Carter a summary + transcript
  // as a NEW lead email (same flow as the voice call summaries).
  private maybeSendChatSummary() {
    const msgs = this.messages();
    const userText = msgs.filter(m => m.role === 'user').map(m => m.content).join(' ');
    const contact = userText.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0]
      || userText.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/)?.[0]
      || '';
    if (!contact || contact === this.summarySentFor) return;
    this.summarySentFor = contact;
    this.api.post('bot/chat-summary', {
      messages: msgs.map(m => ({ role: m.role, text: m.content })),
      page: window.location.pathname
    }).subscribe({ next: () => {}, error: () => {} });
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
    const text = this.currentInput.trim();
    if (!text) return;
    this.currentInput = '';
    this.submitMessage(text);
  }

  askQuick(question: string) {
    this.submitMessage(question);
  }

  private submitMessage(text: string) {
    if (!text || this.isTyping()) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    this.messages.update(m => [...m, userMessage]);
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
