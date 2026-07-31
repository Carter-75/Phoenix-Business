import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceCallService } from '../../services/voice-call.service';

@Component({
  selector: 'app-voice-call-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Error Toast -->
    <div *ngIf="call.errorMessage()" 
         class="fixed bottom-6 right-6 z-[300] max-w-md bg-red-950/90 border border-red-500/50 text-red-200 p-5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <span class="text-2xl">⚠️</span>
      <div class="flex-1">
        <h4 class="text-xs font-black uppercase tracking-widest text-red-400 mb-1">Voice Agent Error</h4>
        <p class="text-xs leading-relaxed text-red-200/90">{{ call.errorMessage() }}</p>
      </div>
      <button (click)="call.errorMessage.set(null)" class="text-red-400 hover:text-white text-sm font-bold">✕</button>
    </div>

    <!-- Active Call Modal -->
    <div *ngIf="call.isCallActive() || call.isConnecting()" 
         class="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#020205]/90 backdrop-blur-2xl animate-in fade-in duration-300">
      
      <div class="relative max-w-md w-full glass-card !bg-[#05050A]/90 border-orange-500/30 p-8 sm:p-12 text-center rounded-3xl shadow-[0_0_80px_rgba(234,88,12,0.15)] overflow-hidden">
        
        <!-- Background Ambient Glow -->
        <div class="absolute -top-24 -left-24 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Header -->
        <div class="mb-8 relative z-10">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span class="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            {{ call.isConnecting() ? 'Connecting to Agent...' : 'Live Voice Call' }}
          </div>
          
          <h3 class="text-2xl font-black uppercase tracking-tight text-white mb-2">Phoenix AI Assistant</h3>
          <p class="text-xs text-white/40 font-mono tracking-widest">
            {{ call.isConnecting() ? 'Establishing Encrypted Audio Stream...' : call.formatDuration(call.callDuration()) }}
          </p>
        </div>

        <!-- Visualizer Wave -->
        <div class="h-24 flex items-center justify-center gap-1.5 my-8 relative z-10">
          <div *ngFor="let bar of visualizerBars" 
               class="w-1.5 rounded-full bg-gradient-to-t from-orange-600 to-amber-400 transition-all duration-150"
               [style.height.%]="call.isSpeaking() ? (bar * randomMultiplier()) : (call.isCallActive() ? 20 + bar * 0.3 : 10)">
          </div>
        </div>

        <!-- Live Transcript Preview -->
        <div *ngIf="call.lastTranscript()" class="mb-8 min-h-[40px] px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/70 italic font-mono leading-relaxed line-clamp-2">
          "{{ call.lastTranscript() }}"
        </div>

        <!-- Control Buttons -->
        <div class="flex items-center justify-center gap-6 relative z-10">
          <!-- Mute Mic Button -->
          <button (click)="call.toggleMute()" 
                  [class.bg-red-500/20]="call.isMuted()"
                  [class.border-red-500/40]="call.isMuted()"
                  [class.text-red-400]="call.isMuted()"
                  [class.bg-white/5]="!call.isMuted()"
                  [class.border-white/10]="!call.isMuted()"
                  [class.text-white]="!call.isMuted()"
                  class="w-14 h-14 rounded-2xl border flex items-center justify-center text-lg hover:scale-105 active:scale-95 transition-all shadow-lg">
            <i class="fas" [class.fa-microphone-slash]="call.isMuted()" [class.fa-microphone]="!call.isMuted()"></i>
          </button>

          <!-- Hang Up Button -->
          <button (click)="call.endCall()" 
                  class="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-105 active:scale-95 transition-all">
            <i class="fas fa-phone-slash"></i>
          </button>
        </div>

      </div>
    </div>
  `
})
export class VoiceCallModalComponent {
  call = inject(VoiceCallService);

  visualizerBars = [30, 65, 45, 80, 95, 60, 100, 75, 85, 40, 90, 55, 70, 35, 80];

  randomMultiplier(): number {
    return 0.5 + Math.random() * 0.7;
  }
}
