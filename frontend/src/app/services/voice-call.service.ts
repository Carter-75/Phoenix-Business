import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface VoiceCallSession {
  agentId: string;
  apiKey: string;
  wssUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceCallService {
  private api = inject(ApiService);

  isCallActive = signal(false);
  isConnecting = signal(false);
  isMuted = signal(false);
  isSpeaking = signal(false);
  callDuration = signal(0);
  errorMessage = signal<string | null>(null);
  lastTranscript = signal<string>('');

  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private timerInterval: any = null;
  private nextPlayTime = 0;

  startCall() {
    if (this.isCallActive() || this.isConnecting()) return;

    this.errorMessage.set(null);
    this.isConnecting.set(true);

    this.api.get<VoiceCallSession>('bot/realtime-session').subscribe({
      next: (session) => {
        this.initWebSocket(session);
      },
      error: (err) => {
        this.isConnecting.set(false);
        const msg = err.error?.error || 'Failed to connect to xAI Realtime Agent. Please check XAI_API_KEY environment variable.';
        this.errorMessage.set(msg);
        console.error('Voice call session error:', err);
      }
    });
  }

  private async initWebSocket(session: VoiceCallSession) {
    try {
      // Create Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
      this.nextPlayTime = this.audioContext.currentTime;

      // Note: Browser native WebSockets connecting directly to xAI Realtime
      // Subprotocol array can pass auth or custom query param if needed
      const wsUrl = `${session.wssUrl}&api_key=${encodeURIComponent(session.apiKey)}`;
      
      // Fallback: Connect via WebSocket
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting.set(false);
        this.isCallActive.set(true);
        this.startTimer();
        this.initMicrophone();

        // Send initial greeting trigger
        this.sendEvent({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'Hello! I am calling from the Phoenix website.' }]
          }
        });
        this.sendEvent({ type: 'response.create' });
      };

      this.ws.onmessage = (event) => {
        this.handleServerEvent(event);
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        this.errorMessage.set('Voice call connection lost. Please try again.');
        this.endCall();
      };

      this.ws.onclose = () => {
        if (this.isCallActive()) {
          this.endCall();
        }
      };
    } catch (e: any) {
      console.error('Error starting audio session:', e);
      this.errorMessage.set(e.message || 'Could not start web voice session.');
      this.isConnecting.set(false);
    }
  }

  private async initMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.warn('Microphone permission denied or not available:', err);
      this.lastTranscript.set('(Microphone access muted — listening to assistant)');
    }
  }

  private handleServerEvent(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'response.output_audio_transcript.delta') {
        if (data.delta) {
          this.lastTranscript.update(t => (t + data.delta).slice(-150));
        }
      } else if (data.type === 'response.output_audio.delta') {
        this.isSpeaking.set(true);
        if (data.delta && this.audioContext) {
          this.playAudioChunk(data.delta);
        }
      } else if (data.type === 'response.done') {
        setTimeout(() => this.isSpeaking.set(false), 800);
      }
    } catch (e) {
      // Ignore non-json frames
    }
  }

  private playAudioChunk(base64Pcm: string) {
    if (!this.audioContext) return;

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const startTime = Math.max(this.audioContext.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;
    } catch (err) {
      console.error('Audio chunk playback error:', err);
    }
  }

  private sendEvent(event: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  toggleMute() {
    this.isMuted.update(m => !m);
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted();
      });
    }
  }

  endCall() {
    this.isCallActive.set(false);
    this.isConnecting.set(false);
    this.isSpeaking.set(false);

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.callDuration.set(0);
  }

  private startTimer() {
    this.callDuration.set(0);
    this.timerInterval = setInterval(() => {
      this.callDuration.update(d => d + 1);
    }, 1000);
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
