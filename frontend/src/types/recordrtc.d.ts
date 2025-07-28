declare module 'recordrtc' {
  interface RecordRTCOptions {
    type?: 'video' | 'audio' | 'canvas' | 'gif';
    mimeType?: string;
    recorderType?: any;
    video?: {
      width?: number;
      height?: number;
      frameRate?: number;
    };
    audio?: {
      sampleRate?: number;
      channelCount?: number;
      volume?: number;
    };
    canvas?: {
      width?: number;
      height?: number;
    };
    frameInterval?: number;
    quality?: number;
    checkForInactiveTracks?: boolean;
    timeSlice?: number;
    [key: string]: any;
  }

  class RecordRTC {
    constructor(stream: MediaStream, options?: RecordRTCOptions);
    
    static MediaStreamRecorder: any;
    static StereoAudioRecorder: any;
    static WebAssemblyRecorder: any;
    static CanvasRecorder: any;
    static GifRecorder: any;
    
    startRecording(): void;
    stopRecording(callback?: () => void): void;
    pauseRecording(): void;
    resumeRecording(): void;
    getBlob(): Blob;
    toURL(): string;
    save(fileName?: string): void;
    destroy(): void;
    getDataURL(callback?: (dataURL: string) => void): string;
    
    recordingDuration: number;
    stream: MediaStream;
  }

  export = RecordRTC;
}
