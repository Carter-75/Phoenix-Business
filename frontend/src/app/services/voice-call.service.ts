import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface VoiceCallSession {
  agentId: string;
  clientSecret: string;
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
  private transcriptTurns: { role: 'caller' | 'phoenix'; text: string }[] = [];
  private summarySent = false;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private timerInterval: any = null;
  private nextPlayTime = 0;

  startCall() {
    if (this.isCallActive() || this.isConnecting()) return;

    this.errorMessage.set(null);
    this.isConnecting.set(true);
    this.transcriptTurns = [];
    this.summarySent = false;

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

      // Note: Browser native WebSockets cannot set Authorization headers.
      // xAI requires passing the ephemeral client secret via Sec-WebSocket-Protocol.
      this.ws = new WebSocket(session.wssUrl, [
        `xai-client-secret.${session.clientSecret}`
      ]);

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
      if (!this.audioContext) return;
      // Stream mic audio to the agent as PCM16 24kHz input_audio_buffer
      // appends. Without this the agent could never hear the caller.
      this.micSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.micProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      const inputRate = this.audioContext.sampleRate;
      this.micProcessor.onaudioprocess = (e) => {
        if (this.isMuted() || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm = this.encodePcm16(this.downsample(input, inputRate, 24000));
        this.sendEvent({ type: 'input_audio_buffer.append', audio: pcm });
      };
      this.micSource.connect(this.micProcessor);
      this.micProcessor.connect(this.audioContext.destination);
    } catch (err: any) {
      console.warn('Microphone permission denied or not available:', err);
      this.lastTranscript.set('(Microphone access muted, listening to assistant)');
    }
  }

  private downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return input;
    const ratio = fromRate / toRate;
    const outLength = Math.floor(input.length / ratio);
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      out[i] = input[Math.floor(i * ratio)];
    }
    return out;
  }

  private encodePcm16(samples: Float32Array): string {
    const buffer = new ArrayBuffer(samples.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private handleServerEvent(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'error') {
        console.error('xAI realtime error:', data);
        this.errorMessage.set(data.error?.message || 'The voice agent returned an error.');
      } else if (data.type === 'response.output_audio_transcript.done') {
        if (data.transcript) {
          this.transcriptTurns.push({ role: 'phoenix', text: data.transcript });
        }
      } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
        if (data.transcript) this.addCallerTurn(data.transcript);
      } else if (data.type === 'conversation.item.added' && data.item?.content) {
        for (const part of data.item.content) {
          if (part?.type === 'input_audio' && part.transcript) {
            this.addCallerTurn(part.transcript);
          }
        }
      } else if (data.type === 'response.output_audio_transcript.delta') {
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

  private addCallerTurn(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const last = this.transcriptTurns[this.transcriptTurns.length - 1];
    if (last && last.role === 'caller' && last.text === clean) return;
    this.transcriptTurns.push({ role: 'caller', text: clean });
  }

  private sendCallSummary(durationSeconds: number) {
    if (this.summarySent) return;
    if (!this.transcriptTurns.some(t => t.role === 'caller')) return;
    this.summarySent = true;
    this.api.post('bot/call-summary', {
      transcript: this.transcriptTurns,
      durationSeconds,
      page: window.location.pathname
    }).subscribe({ next: () => {}, error: () => {} });
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
    if (this.isCallActive()) {
      this.sendCallSummary(this.callDuration());
    }
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

    if (this.micProcessor) {
      this.micProcessor.disconnect();
      this.micProcessor.onaudioprocess = null;
      this.micProcessor = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
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
