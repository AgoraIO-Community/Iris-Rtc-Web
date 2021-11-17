import {
  AudioEncoderConfiguration,
  AudioEncoderConfigurationPreset,
  BeautyEffectOptions,
  CameraVideoTrackInitConfig,
  ICameraVideoTrack,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  MicrophoneAudioTrackInitConfig,
  ScreenVideoTrackInitConfig,
  UID,
  VideoEncoderConfiguration,
  VideoEncoderConfigurationPreset,
} from 'agora-rtc-sdk-ng';
import {
  ApiTypeAudioDeviceManager,
  ApiTypeVideoDeviceManager,
  LOCAL_AUDIO_STREAM_ERROR,
  LOCAL_AUDIO_STREAM_STATE,
  LOCAL_VIDEO_STREAM_ERROR,
  LOCAL_VIDEO_STREAM_STATE,
  RENDER_MODE_TYPE,
  ScreenCaptureParameters,
  VIDEO_MIRROR_MODE_TYPE,
  VideoCanvas,
} from './types.native';
import { printf } from './utils';

const AgoraRTC = require('agora-rtc-sdk-ng');

/**
 * Track manager for video tracks
 */
class IrisVideoTrackManager {
  protected canvasMap = new Map<UID, VideoCanvas>();

  protected setupVideo(
    track: ILocalVideoTrack | IRemoteVideoTrack | undefined,
    canvas?: VideoCanvas
  ) {
    if (canvas === undefined) {
      return;
    }
    let userId: number;
    const func = (track as IRemoteVideoTrack | undefined)?.getUserId;
    if (func === undefined) {
      userId = 0;
    } else {
      userId = func.call(track);
    }
    if (userId === canvas.uid) {
      let fit: 'cover' | 'contain' | 'fill' = 'cover';
      switch (canvas.renderMode) {
        case RENDER_MODE_TYPE.RENDER_MODE_HIDDEN:
          fit = 'cover';
          break;
        case RENDER_MODE_TYPE.RENDER_MODE_FIT:
          fit = 'contain';
          break;
        case RENDER_MODE_TYPE.RENDER_MODE_ADAPTIVE:
          fit = 'cover';
          break;
        case RENDER_MODE_TYPE.RENDER_MODE_FILL:
          fit = 'fill';
          break;
      }
      const div = canvas.view as HTMLDivElement;
      for (let i = 0; i < div.children.length; i++) {
        div.removeChild(div.children.item(i)!);
      }
      let mirror: boolean;
      if (userId === 0) {
        mirror =
          canvas.mirrorMode === VIDEO_MIRROR_MODE_TYPE.VIDEO_MIRROR_MODE_AUTO ||
          canvas.mirrorMode ===
            VIDEO_MIRROR_MODE_TYPE.VIDEO_MIRROR_MODE_ENABLED;
      } else {
        mirror =
          canvas.mirrorMode ===
          VIDEO_MIRROR_MODE_TYPE.VIDEO_MIRROR_MODE_ENABLED;
      }
      track?.play(div, {
        mirror,
        fit,
      });
    }
  }
}

/**
 * Track manager for local tracks
 */
class IrisLocalTrackManager extends IrisVideoTrackManager {
  protected microphoneConfig: MicrophoneAudioTrackInitConfig = {};
  protected cameraConfig: CameraVideoTrackInitConfig = {};
  /**
   * The localVideoTrack is ScreenVideoTrack is screenConfig is undefined
   * @protected
   */
  protected screenConfig?: ScreenVideoTrackInitConfig;
  protected localAudioTrack?: ILocalAudioTrack;
  protected localVideoTrack?: ILocalVideoTrack;

  /**
   * Create a microphone audio track
   * @param enableAudio
   * @param callback
   * @param force
   */
  public async createMicrophoneAudioTrack(
    enableAudio: boolean,
    callback: Function,
    force: boolean = false
  ): Promise<ILocalAudioTrack | undefined> {
    if (!enableAudio) {
      printf('createMicrophoneAudioTrack', enableAudio);
      return;
    }
    if (this.localAudioTrack) {
      if (force) {
        this.localAudioTrack.close();
        this.localAudioTrack = undefined;
      } else {
        return this.localAudioTrack;
      }
    }
    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack(
      this.microphoneConfig
    );
    this.localAudioTrack?.on('track-ended', () => {
      callback('LocalAudioStateChanged', {
        state: LOCAL_AUDIO_STREAM_STATE.LOCAL_AUDIO_STREAM_STATE_FAILED,
        error: LOCAL_AUDIO_STREAM_ERROR.LOCAL_AUDIO_STREAM_ERROR_RECORD_FAILURE,
      });
    });
    return this.localAudioTrack;
  }

  /**
   * Create a camera video track
   * @param enableVideo
   * @param callback
   * @param force
   */
  public async createCameraVideoTrack(
    enableVideo: boolean,
    callback: Function,
    force: boolean = false
  ): Promise<ILocalVideoTrack | undefined> {
    if (!enableVideo) {
      printf('CreateCameraVideoTrack', enableVideo);
      return;
    }
    if (this.localVideoTrack) {
      if (force) {
        this.localVideoTrack.close();
        this.localVideoTrack = undefined;
      } else {
        return this.localVideoTrack;
      }
    }
    this.localVideoTrack = await AgoraRTC.createCameraVideoTrack(
      this.cameraConfig
    );
    this.localVideoTrack?.on('track-ended', () => {
      callback('LocalVideoStateChanged', {
        localVideoState:
          LOCAL_VIDEO_STREAM_STATE.LOCAL_VIDEO_STREAM_STATE_FAILED,
        error:
          LOCAL_VIDEO_STREAM_ERROR.LOCAL_VIDEO_STREAM_ERROR_CAPTURE_FAILURE,
      });
    });
    this.playLocalVideo();
    return this.localVideoTrack;
  }

  /**
   * Create a screen video track
   * @param enableVideo
   * @param callback
   * @param captureParams
   * @param force
   */
  public async createScreenVideoTrack(
    enableVideo: boolean,
    callback: Function,
    captureParams?: ScreenCaptureParameters,
    force: boolean = false
  ): Promise<ILocalVideoTrack | undefined> {
    if (!enableVideo) {
      printf('createScreenVideoTrack', enableVideo);
      return;
    }
    if (this.localVideoTrack) {
      if (force) {
        this.localVideoTrack.close();
        this.localVideoTrack = undefined;
      } else {
        return this.localVideoTrack;
      }
    }
    this.screenConfig = {
      encoderConfig: {
        width: captureParams?.dimensions?.width,
        height: captureParams?.dimensions?.height,
        frameRate: captureParams?.frameRate,
        bitrateMin: captureParams?.bitrate,
        bitrateMax: captureParams?.bitrate,
      },
    };
    const track = await AgoraRTC.createScreenVideoTrack(
      this.screenConfig,
      'auto'
    );
    const func = (track as ILocalVideoTrack | undefined)?.play;
    if (func !== undefined) {
      this.localVideoTrack = track;
    } else {
      const [videoTrack, audioTrack] = track;
      this.localVideoTrack = videoTrack;
      this.localAudioTrack = audioTrack;
      this.localAudioTrack?.on('track-ended', () => {
        callback('LocalAudioStateChanged', {
          state: LOCAL_AUDIO_STREAM_STATE.LOCAL_AUDIO_STREAM_STATE_FAILED,
          error:
            LOCAL_AUDIO_STREAM_ERROR.LOCAL_AUDIO_STREAM_ERROR_RECORD_FAILURE,
        });
      });
    }
    this.localVideoTrack?.on('track-ended', () => {
      callback('LocalVideoStateChanged', {
        localVideoState:
          LOCAL_VIDEO_STREAM_STATE.LOCAL_VIDEO_STREAM_STATE_FAILED,
        error:
          LOCAL_VIDEO_STREAM_ERROR.LOCAL_VIDEO_STREAM_ERROR_CAPTURE_FAILURE,
      });
    });
    this.playLocalVideo();
    return this.localVideoTrack;
  }

  public async enableLocalAudio(enabled: boolean) {
    return this.localAudioTrack?.setEnabled(enabled);
  }

  public async enableLocalVideo(enabled: boolean) {
    return this.localVideoTrack?.setEnabled(enabled);
  }

  public async muteLocalAudio(muted: boolean) {
    return this.localAudioTrack?.setMuted(muted);
  }

  public async muteLocalVideo(muted: boolean) {
    return this.localVideoTrack?.setMuted(muted);
  }

  public adjustRecordingSignalVolume(volume: number) {
    this.localAudioTrack?.setVolume(volume);
  }

  public setAudioEncoderConfiguration(
    config?: AudioEncoderConfiguration | AudioEncoderConfigurationPreset
  ) {
    this.microphoneConfig.encoderConfig = config;
  }

  public async setVideoEncoderConfiguration(
    config: VideoEncoderConfiguration | VideoEncoderConfigurationPreset
  ) {
    this.cameraConfig.encoderConfig = config;
    const func = (this.localVideoTrack as ICameraVideoTrack | undefined)
      ?.setEncoderConfiguration;
    if (func !== undefined) {
      return func.call(this.localVideoTrack, this.cameraConfig.encoderConfig);
    }
  }

  public async setBeautyEffect(
    enabled: boolean,
    options?: BeautyEffectOptions
  ) {
    const func = (this.localVideoTrack as ICameraVideoTrack | undefined)
      ?.setBeautyEffect;
    if (func !== undefined) {
      return func.call(this.localVideoTrack, enabled, options);
    }
  }

  public stopCameraCapture() {
    if (this.screenConfig === undefined) {
      this.localVideoTrack?.close();
      this.localVideoTrack = undefined;
    }
  }

  public stopScreenCapture() {
    if (this.screenConfig !== undefined) {
      this.localVideoTrack?.close();
      this.localVideoTrack = undefined;
      this.screenConfig = undefined;
    }
  }

  public setupLocalVideo(canvas?: VideoCanvas) {
    if (canvas === undefined) {
      this.canvasMap.delete(0);
    } else {
      this.canvasMap.set(canvas.uid, canvas);
      this.setupVideo(this.localVideoTrack, canvas);
    }
  }

  public playLocalVideo() {
    this.setupVideo(this.localVideoTrack, this.canvasMap.get(0));
  }
}

/**
 * Track manager for remote tracks
 */
class IrisRemoteTrackManager extends IrisLocalTrackManager {
  protected remoteAudioTracks: IRemoteAudioTrack[] = [];
  protected remoteVideoTracks: IRemoteVideoTrack[] = [];
  protected audioPlaybackDeviceId?: string;

  public addRemoteAudioTrack(track: IRemoteAudioTrack) {
    track.setPlaybackDevice(this.audioPlaybackDeviceId ?? '');
    this.remoteAudioTracks.push(track);
  }

  public getRemoteAudioTrack(uid: UID): IRemoteAudioTrack | undefined {
    const index = this.remoteAudioTracks.findIndex(
      (value) => value.getUserId() === uid
    );
    return this.remoteAudioTracks[index];
  }

  public removeRemoteAudioTrack(uid: UID) {
    const index = this.remoteAudioTracks.findIndex(
      (value) => value.getUserId() === uid
    );
    this.remoteAudioTracks.splice(index, 1);
  }

  public clearRemoteAudioTracks() {
    this.remoteAudioTracks.splice(0, this.remoteAudioTracks.length);
  }

  public addRemoteVideoTrack(track: IRemoteVideoTrack) {
    this.remoteVideoTracks.push(track);
  }

  public getRemoteVideoTrack(uid: UID): IRemoteVideoTrack | undefined {
    const index = this.remoteVideoTracks.findIndex(
      (value) => value.getUserId() === uid
    );
    return this.remoteVideoTracks[index];
  }

  public removeRemoteVideoTrack(uid: UID) {
    const index = this.remoteVideoTracks.findIndex(
      (value) => value.getUserId() === uid
    );
    this.remoteVideoTracks.splice(index, 1);
  }

  public clearRemoteVideoTracks() {
    this.remoteVideoTracks.splice(0, this.remoteVideoTracks.length);
  }

  public async adjustPlaybackSignalVolume(volume: number) {
    return this.remoteAudioTracks.map((track) => {
      return track.setVolume(volume);
    });
  }

  public async adjustUserPlaybackSignalVolume(uid: number, volume: number) {
    return this.remoteAudioTracks.map((track) => {
      if (track.getUserId() === uid) {
        return track.setVolume(volume);
      }
    });
  }

  public async enableRemoteAudio(enabled: boolean) {
    return this.remoteAudioTracks.map((track) => {
      if (enabled) {
        return track.play();
      } else {
        return track.stop();
      }
    });
  }

  public async enableRemoteVideo(enabled: boolean) {
    return this.remoteVideoTracks.map((track) => {
      if (enabled) {
        this.setupVideo(track, this.canvasMap.get(track.getUserId()));
      } else {
        track.stop();
      }
    });
  }

  public setupRemoteVideo(uid: UID, canvas?: VideoCanvas) {
    if (canvas === undefined) {
      this.canvasMap.delete(uid);
    } else {
      this.canvasMap.set(uid, canvas);
      this.setupVideo(this.getRemoteVideoTrack(uid), canvas);
    }
  }

  public playRemoteVideo(uid: UID) {
    this.setupVideo(this.getRemoteVideoTrack(uid), this.canvasMap.get(uid));
  }
}

export default class IrisRtcDeviceManager extends IrisRemoteTrackManager {
  private _support_apis_audio = {
    [ApiTypeAudioDeviceManager.kADMEnumeratePlaybackDevices]:
      this.enumerateAudioPlaybackDevices,
    [ApiTypeAudioDeviceManager.kADMSetPlaybackDevice]:
      this.setAudioPlaybackDevice,
    [ApiTypeAudioDeviceManager.kADMGetPlaybackDevice]:
      this.getAudioPlaybackDevice,
    [ApiTypeAudioDeviceManager.kADMGetPlaybackDeviceInfo]:
      this.getAudioPlaybackDeviceInfo,
    [ApiTypeAudioDeviceManager.kADMEnumerateRecordingDevices]:
      this.enumerateAudioRecordingDevices,
    [ApiTypeAudioDeviceManager.kADMSetRecordingDevice]:
      this.setAudioRecordingDevice,
    [ApiTypeAudioDeviceManager.kADMGetRecordingDevice]:
      this.getAudioRecordingDevice,
    [ApiTypeAudioDeviceManager.kADMGetRecordingDeviceInfo]:
      this.getAudioRecordingDeviceInfo,
    [ApiTypeAudioDeviceManager.kADMSetRecordingDeviceVolume]:
      this.setAudioRecordingDeviceVolume,
    [ApiTypeAudioDeviceManager.kADMGetRecordingDeviceVolume]:
      this.getAudioRecordingDeviceVolume,
  };
  private _support_apis_video = {
    [ApiTypeVideoDeviceManager.kVDMEnumerateVideoDevices]:
      this.enumerateVideoDevices,
    [ApiTypeVideoDeviceManager.kVDMSetDevice]: this.setVideoDeviceId,
    [ApiTypeVideoDeviceManager.kVDMGetDevice]: this.getVideoDeviceId,
  };

  /**
   * Iris callApi for audio device manager
   * @param apiType
   * @param params
   * @param extra
   */
  public async callApiAudio(
    apiType: ApiTypeAudioDeviceManager,
    params: string,
    extra?: any
  ): Promise<any> {
    printf('callApiAudio', apiType, params, extra, this);
    return this._support_apis_audio[apiType]?.call(
      this,
      JSON.parse(params),
      extra
    );
  }

  /**
   * Iris callApi for video device manager
   * @param apiType
   * @param params
   * @param extra
   */
  public async callApiVideo(
    apiType: ApiTypeVideoDeviceManager,
    params: string,
    extra?: any
  ): Promise<any> {
    printf('callApiVideo', apiType, params, extra, this);
    return this._support_apis_video[apiType]?.call(
      this,
      JSON.parse(params),
      extra
    );
  }

  /**
   * Release all tracks
   */
  public release() {
    this.localAudioTrack?.close();
    this.localAudioTrack = undefined;
    this.localVideoTrack?.close();
    this.localVideoTrack = undefined;
    this.clearRemoteAudioTracks();
    this.clearRemoteVideoTracks();
  }

  private async enumerateAudioPlaybackDevices(): Promise<string> {
    return AgoraRTC.getPlaybackDevices()?.then((res) => {
      return JSON.stringify(
        res.map((it) => {
          return {
            deviceId: it.deviceId,
            deviceName: it.label,
          };
        })
      );
    });
  }

  private async setAudioPlaybackDevice(params: { deviceId: string }) {
    this.audioPlaybackDeviceId = params.deviceId;
    await Promise.all(
      this.remoteAudioTracks.map((track) => {
        return track.setPlaybackDevice(this.audioPlaybackDeviceId ?? '');
      })
    );
  }

  private async getAudioPlaybackDevice(_: {}): Promise<string> {
    return this.audioPlaybackDeviceId ?? '';
  }

  private async getAudioPlaybackDeviceInfo(_: {}): Promise<string> {
    return AgoraRTC.getPlaybackDevices()?.then((res) => {
      const it = res.find(
        (value) => value.deviceId === this.audioPlaybackDeviceId
      );
      return JSON.stringify({
        deviceId: it.deviceId,
        deviceName: it.label,
      });
    });
  }

  private async enumerateAudioRecordingDevices(): Promise<string> {
    return AgoraRTC.getMicrophones()?.then((res) => {
      return JSON.stringify(
        res.map((it) => {
          return {
            deviceId: it.deviceId,
            deviceName: it.label,
          };
        })
      );
    });
  }

  private async setAudioRecordingDevice(params: { deviceId: string }) {
    this.microphoneConfig.microphoneId = params.deviceId;
  }

  private async getAudioRecordingDevice(_: {}): Promise<string> {
    return this.microphoneConfig.microphoneId ?? '';
  }

  private async setAudioRecordingDeviceVolume(params: { volume: number }) {
    return this.adjustRecordingSignalVolume(params.volume);
  }

  private async getAudioRecordingDeviceVolume(): Promise<number> {
    return this.localAudioTrack?.getVolumeLevel() ?? 0;
  }

  private async getAudioRecordingDeviceInfo(_: {}): Promise<string> {
    return AgoraRTC.getMicrophones()?.then((res) => {
      const it = res.find(
        (value) => value.deviceId === this.microphoneConfig.microphoneId
      );
      return JSON.stringify({
        deviceId: it.deviceId,
        deviceName: it.label,
      });
    });
  }

  private async enumerateVideoDevices(): Promise<string> {
    return AgoraRTC.getCameras()?.then((res) => {
      return JSON.stringify(
        res.map((it) => {
          return {
            deviceId: it.deviceId,
            deviceName: it.label,
          };
        })
      );
    });
  }

  private async setVideoDeviceId(params: { deviceId: string }) {
    if (this.cameraConfig !== params.deviceId) {
      this.cameraConfig.cameraId = params.deviceId;
      if (this.localAudioTrack) {
        this.localAudioTrack.getTrackLabel();
      }
    }
  }

  private async getVideoDeviceId(_: {}): Promise<string> {
    return this.cameraConfig.cameraId ?? '';
  }
}
