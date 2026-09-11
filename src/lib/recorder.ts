/** Запись голоса через MediaRecorder. Файл живёт в памяти вкладки и не уходит с устройства. */
export interface Recording {
  url: string;
  blob: Blob;
  seconds: number;
}

export class VoiceRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startedAt = 0;

  get isRecording(): boolean {
    return this.recorder?.state === 'recording';
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.startedAt = Date.now();
    this.recorder.start();
  }

  async stop(): Promise<Recording | null> {
    const recorder = this.recorder;
    if (!recorder || recorder.state === 'inactive') return null;

    const finished = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(this.chunks, { type: recorder.mimeType }));
    });
    recorder.stop();
    const blob = await finished;

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;

    return {
      blob,
      url: URL.createObjectURL(blob),
      seconds: Math.round((Date.now() - this.startedAt) / 1000),
    };
  }

  /** Сброс без сохранения — на случай выхода из протокола посреди записи. */
  cancel(): void {
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
  }
}

export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}
