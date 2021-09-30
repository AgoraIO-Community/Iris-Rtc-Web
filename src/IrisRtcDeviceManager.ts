import {
  CameraVideoTrackInitConfig,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  MicrophoneAudioTrackInitConfig,
  UID,
} from 'agora-rtc-sdk-ng';
import {
  ApiTypeAudioDeviceManager,
  ApiTypeVideoDeviceManager,
  LOCAL_AUDIO_STREAM_ERROR,
  LOCAL_AUDIO_STREAM_STATE,
  LOCAL_VIDEO_STREAM_ERROR,
  LOCAL_VIDEO_STREAM_STATE,
  ScreenCaptureParameters,
} from './types.native';
import { printf } from './utils';

const AgoraRTC = require('agora-rtc-sdk-ng');

export default class IrisRtcDeviceManager {
  public localAudioConfig: MicrophoneAudioTrackInitConfig = {};
  public localVideoConfig: CameraVideoTrackInitConfig = {};
  public localAudioTrack?: ILocalAudioTrack;
  public localVideoTrack?: ILocalVideoTrack;
  public readonly remoteAudioTracks: IRemoteAudioTrack[] = [];
  public readonly remoteVideoTracks: IRemoteVideoTrack[] = [];
  private _audioPlaybackDeviceId?: string;
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
      this.localAudioConfig
    );
    this.localAudioTrack?.on('track-ended', () => {
      callback('LocalAudioStateChanged', {
        state: LOCAL_AUDIO_STREAM_STATE.LOCAL_AUDIO_STREAM_STATE_FAILED,
        error: LOCAL_AUDIO_STREAM_ERROR.LOCAL_AUDIO_STREAM_ERROR_RECORD_FAILURE,
      });
    });
    return this.localAudioTrack;
  }

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
      this.localVideoConfig
    );
    this.localVideoTrack?.on('track-ended', () => {
      callback('LocalVideoStateChanged', {
        localVideoState:
          LOCAL_VIDEO_STREAM_STATE.LOCAL_VIDEO_STREAM_STATE_FAILED,
        error:
          LOCAL_VIDEO_STREAM_ERROR.LOCAL_VIDEO_STREAM_ERROR_CAPTURE_FAILURE,
      });
    });
    return this.localVideoTrack;
  }

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
    const track = await AgoraRTC.createScreenVideoTrack(
      {
        encoderConfig: {
          width: captureParams?.dimensions?.width,
          height: captureParams?.dimensions?.height,
          frameRate: captureParams?.frameRate,
          bitrateMin: captureParams?.bitrate,
          bitrateMax: captureParams?.bitrate,
        },
      },
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
    return this.localVideoTrack;
  }

  public addRemoteAudioTrack(track: IRemoteAudioTrack) {
    track.setPlaybackDevice(this._audioPlaybackDeviceId ?? '');
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

  public async enumerateAudioPlaybackDevices(): Promise<string> {
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

  public async setAudioPlaybackDevice(params: { deviceId: string }) {
    this._audioPlaybackDeviceId = params.deviceId;
    await Promise.all(
      this.remoteAudioTracks.map((track) => {
        return track.setPlaybackDevice(this._audioPlaybackDeviceId ?? '');
      })
    );
  }

  public async getAudioPlaybackDevice(_: {}): Promise<string> {
    return this._audioPlaybackDeviceId ?? '';
  }

  public async getAudioPlaybackDeviceInfo(_: {}): Promise<string> {
    return AgoraRTC.getPlaybackDevices()?.then((res) => {
      const it = res.find(
        (value) => value.deviceId === this._audioPlaybackDeviceId
      );
      return JSON.stringify({
        deviceId: it.deviceId,
        deviceName: it.label,
      });
    });
  }

  public async enumerateAudioRecordingDevices(): Promise<string> {
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

  public async setAudioRecordingDevice(params: { deviceId: string }) {
    this.localAudioConfig.microphoneId = params.deviceId;
  }

  public async getAudioRecordingDevice(_: {}): Promise<string> {
    return this.localAudioConfig.microphoneId ?? '';
  }

  public async setAudioRecordingDeviceVolume(params: { volume: number }) {
    return this.localAudioTrack?.setVolume(params.volume);
  }

  public async getAudioRecordingDeviceVolume(): Promise<number> {
    return this.localAudioTrack?.getVolumeLevel() ?? 0;
  }

  public async getAudioRecordingDeviceInfo(_: {}): Promise<string> {
    return AgoraRTC.getMicrophones()?.then((res) => {
      const it = res.find(
        (value) => value.deviceId === this.localAudioConfig.microphoneId
      );
      return JSON.stringify({
        deviceId: it.deviceId,
        deviceName: it.label,
      });
    });
  }

  public async enumerateVideoDevices(): Promise<string> {
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

  public async setVideoDeviceId(params: { deviceId: string }) {
    if (this.localVideoConfig !== params.deviceId) {
      this.localVideoConfig.cameraId = params.deviceId;
      if (this.localAudioTrack) {
        this.localAudioTrack.getTrackLabel();
      }
    }
  }

  public async getVideoDeviceId(_: {}): Promise<string> {
    return this.localVideoConfig.cameraId ?? '';
  }
}
