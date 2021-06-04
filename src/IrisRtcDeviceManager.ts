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
    [ApiTypeAudioDeviceManager.kADMEnumerateAudioPlaybackDevices]:
      this.enumerateAudioPlaybackDevices,
    [ApiTypeAudioDeviceManager.kADMGetAudioPlaybackDeviceCount]:
      this.getAudioPlaybackDeviceCount,
    [ApiTypeAudioDeviceManager.kADMGetAudioPlaybackDeviceInfoByIndex]:
      this.getAudioPlaybackDeviceInfoByIndex,
    [ApiTypeAudioDeviceManager.kADMSetCurrentAudioPlaybackDeviceId]:
      this.setCurrentAudioPlaybackDeviceId,
    [ApiTypeAudioDeviceManager.kADMGetCurrentAudioPlaybackDeviceId]:
      this.getCurrentAudioPlaybackDeviceId,
    [ApiTypeAudioDeviceManager.kADMGetCurrentAudioPlaybackDeviceInfo]:
      this.getCurrentAudioPlaybackDeviceInfo,
    [ApiTypeAudioDeviceManager.kADMEnumerateAudioRecordingDevices]:
      this.enumerateAudioRecordingDevices,
    [ApiTypeAudioDeviceManager.kADMGetAudioRecordingDeviceCount]:
      this.getAudioRecordingDeviceCount,
    [ApiTypeAudioDeviceManager.kADMGetAudioRecordingDeviceInfoByIndex]:
      this.getAudioRecordingDeviceInfoByIndex,
    [ApiTypeAudioDeviceManager.kADMSetCurrentAudioRecordingDeviceId]:
      this.setCurrentAudioRecordingDeviceId,
    [ApiTypeAudioDeviceManager.kADMGetCurrentAudioRecordingDeviceId]:
      this.getCurrentAudioRecordingDeviceId,
    [ApiTypeAudioDeviceManager.kADMGetCurrentAudioRecordingDeviceInfo]:
      this.getCurrentAudioRecordingDeviceInfo,
    [ApiTypeAudioDeviceManager.kADMSetAudioRecordingDeviceVolume]:
      this.setAudioRecordingDeviceVolume,
    [ApiTypeAudioDeviceManager.kADMGetAudioRecordingDeviceVolume]:
      this.getAudioRecordingDeviceVolume,
  };
  private _support_apis_video = {
    [ApiTypeVideoDeviceManager.kVDMEnumerateVideoDevices]:
      this.enumerateVideoDevices,
    [ApiTypeVideoDeviceManager.kVDMGetVideoDeviceCount]:
      this.getVideoDeviceCount,
    [ApiTypeVideoDeviceManager.kVDMGetVideoDeviceInfoByIndex]:
      this.getVideoDeviceInfoByIndex,
    [ApiTypeVideoDeviceManager.kVDMSetCurrentVideoDeviceId]:
      this.setCurrentVideoDeviceId,
    [ApiTypeVideoDeviceManager.kVDMGetCurrentVideoDeviceId]:
      this.getCurrentVideoDeviceId,
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
    force: boolean = false
  ) {
    if (!enableAudio) {
      printf('createMicrophoneAudioTrack', enableAudio);
      return;
    }
    if (this.localAudioTrack) {
      if (force) {
        this.localAudioTrack.close();
        this.localAudioTrack = undefined;
      } else {
        return;
      }
    }
    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack(
      this.localAudioConfig
    );
  }

  public async createCameraVideoTrack(
    enableVideo: boolean,
    force: boolean = false
  ) {
    if (!enableVideo) {
      printf('createCameraVideoTrack', enableVideo);
      return;
    }
    if (this.localVideoTrack) {
      if (force) {
        this.localVideoTrack.close();
        this.localVideoTrack = undefined;
      } else {
        return;
      }
    }
    this.localVideoTrack = await AgoraRTC.createCameraVideoTrack(
      this.localVideoConfig
    );
  }

  public async createScreenVideoTrack(
    enableVideo: boolean,
    captureParams: ScreenCaptureParameters,
    force: boolean = false
  ) {
    if (!enableVideo) {
      printf('createScreenVideoTrack', enableVideo);
      return;
    }
    if (this.localVideoTrack) {
      if (force) {
        this.localVideoTrack.close();
        this.localVideoTrack = undefined;
      } else {
        return;
      }
    }
    this.localVideoTrack = await AgoraRTC.createScreenVideoTrack(
      {
        encoderConfig: {
          width: captureParams.dimensions?.width,
          height: captureParams.dimensions?.height,
          frameRate: captureParams.frameRate,
          bitrateMin: captureParams.bitrate,
          bitrateMax: captureParams.bitrate,
        },
      },
      'disable'
    );
  }

  public addRemoteAudioTrack(track: IRemoteAudioTrack) {
    track.setPlaybackDevice(this._audioPlaybackDeviceId ?? '');
    this.remoteAudioTracks.push(track);
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

  public async getAudioPlaybackDeviceCount(): Promise<number> {
    return AgoraRTC.getPlaybackDevices()?.then((res) => {
      return res.length;
    });
  }

  public async getAudioPlaybackDeviceInfoByIndex(params: {
    index: number;
  }): Promise<string> {
    return AgoraRTC.getPlaybackDevices()?.then((res) => {
      const it = res[params.index];
      return JSON.stringify({
        deviceId: it.deviceId,
        deviceName: it.label,
      });
    });
  }

  public async setCurrentAudioPlaybackDeviceId(params: { deviceId: string }) {
    this._audioPlaybackDeviceId = params.deviceId;
    await Promise.all(
      this.remoteAudioTracks.map((track) => {
        return track.setPlaybackDevice(this._audioPlaybackDeviceId ?? '');
      })
    );
  }

  public async getCurrentAudioPlaybackDeviceId(_: {}): Promise<string> {
    return this._audioPlaybackDeviceId ?? '';
  }

  public async getCurrentAudioPlaybackDeviceInfo(_: {}): Promise<string> {
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

  public async getAudioRecordingDeviceCount(): Promise<number> {
    return AgoraRTC.getMicrophones()?.then((res) => {
      return res.length;
    });
  }

  public async getAudioRecordingDeviceInfoByIndex(params: {
    index: number;
  }): Promise<string> {
    return AgoraRTC.getMicrophones()?.then((res) => {
      const it = res[params.index];
      return JSON.stringify({
        deviceId: it.deviceId,
        deviceName: it.label,
      });
    });
  }

  public async setCurrentAudioRecordingDeviceId(params: { deviceId: string }) {
    this.localAudioConfig.microphoneId = params.deviceId;
  }

  public async getCurrentAudioRecordingDeviceId(_: {}): Promise<string> {
    return this.localAudioConfig.microphoneId ?? '';
  }

  public async setAudioRecordingDeviceVolume(params: { volume: number }) {
    return this.localAudioTrack?.setVolume(params.volume);
  }

  public async getAudioRecordingDeviceVolume(): Promise<number> {
    return this.localAudioTrack?.getVolumeLevel() ?? 0;
  }

  public async getCurrentAudioRecordingDeviceInfo(_: {}): Promise<string> {
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

  public async getVideoDeviceCount(): Promise<number> {
    return AgoraRTC.getCameras()?.then((res) => {
      return res.length;
    });
  }

  public async getVideoDeviceInfoByIndex(params: {
    index: number;
  }): Promise<string> {
    return AgoraRTC.getCameras()?.then((res) => {
      const it = res[params.index];
      return JSON.stringify({
        deviceId: it.deviceId,
        deviceName: it.label,
      });
    });
  }

  public async setCurrentVideoDeviceId(params: { deviceId: string }) {
    if (this.localVideoConfig !== params.deviceId) {
      this.localVideoConfig.cameraId = params.deviceId;
      if (this.localAudioTrack) {
        this.localAudioTrack.getTrackLabel();
      }
    }
  }

  public async getCurrentVideoDeviceId(_: {}): Promise<string> {
    return this.localVideoConfig.cameraId ?? '';
  }
}
