import {
  AREAS,
  AudienceLatencyLevelType,
  AudioEncoderConfigurationPreset,
  ChannelMediaRelayError,
  ChannelMediaRelayEvent,
  ChannelMediaRelayState,
  ClientRole,
  ConnectionDisconnectedReason,
  ConnectionState,
  EncryptionMode,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  ILocalTrack,
  ILocalVideoTrack,
  IRemoteVideoTrack,
  NetworkQuality,
  RemoteStreamFallbackType,
  RemoteStreamType,
  SDK_MODE,
  UID,
} from 'agora-rtc-sdk-ng';
import IrisRtcDeviceManager from './IrisRtcDeviceManager';
import {
  ApiTypeEngine,
  AREA_CODE,
  AUDIENCE_LATENCY_LEVEL_TYPE,
  AUDIO_PROFILE_TYPE,
  AUDIO_SCENARIO_TYPE,
  BeautyOptions,
  CHANNEL_PROFILE_TYPE,
  ChannelMediaOptions,
  ChannelMediaRelayConfiguration,
  CLIENT_ROLE_TYPE,
  ClientRoleOptions,
  CONNECTION_STATE_TYPE,
  ENCRYPTION_MODE,
  EncryptionConfig,
  ERROR_CODE_TYPE,
  InjectStreamConfig,
  LiveTranscoding,
  LOG_FILTER_TYPE,
  LOG_LEVEL,
  Rect,
  Rectangle,
  REMOTE_AUDIO_STATE,
  REMOTE_AUDIO_STATE_REASON,
  REMOTE_VIDEO_STATE,
  REMOTE_VIDEO_STATE_REASON,
  REMOTE_VIDEO_STREAM_TYPE,
  RENDER_MODE_TYPE,
  RtcEngineContext,
  RtcStats,
  RTMP_STREAM_PUBLISH_STATE,
  RTMP_STREAMING_EVENT,
  ScreenCaptureParameters,
  STREAM_FALLBACK_OPTIONS,
  VIDEO_MIRROR_MODE_TYPE,
  VideoCanvas,
  VideoEncoderConfiguration,
} from './types.native';
import {
  ChannelMediaRelayErrorToNative,
  ChannelMediaRelayEventToNative,
  ChannelMediaRelayStateToNative,
  ConnectionDisconnectedReasonToNative,
  ConnectionStateToNative,
  InjectStreamEventStatusToNative,
  NetworkQualityToNative,
  printf,
  RtmpStreamingErrorToNative,
  UserLeftReasonToNative,
} from './utils';
import IrisRtcChannel from './IrisRtcChannel';

const AgoraRTC = require('agora-rtc-sdk-ng');

export default class IrisRtcEngine {
  private _mode: SDK_MODE;
  private _client?: IAgoraRTCClient;
  private _context?: RtcEngineContext;
  private _handler?: (event: string, data: string) => void;
  private _enableAudio: boolean;
  private _enableVideo: boolean;
  private _enableLocalAudio: boolean;
  private _enableLocalVideo: boolean;
  private _muteLocalAudio: boolean;
  private _muteLocalVideo: boolean;
  private _defaultMuteAllRemoteAudioStreams: boolean;
  private _defaultMuteAllRemoteVideoStreams: boolean;
  private _encryptionMode?:
    | 'aes-128-xts'
    | 'aes-256-xts'
    | 'aes-128-ecb'
    | 'sm4-128-ecb'
    | 'aes-128-gcm'
    | 'aes-256-gcm'
    | 'none';
  private _secret?: string;
  public channel: IrisRtcChannel = new IrisRtcChannel(this);
  public deviceManager: IrisRtcDeviceManager = new IrisRtcDeviceManager();
  private _support_apis = {
    [ApiTypeEngine.kEngineInitialize]: this.initialize,
    [ApiTypeEngine.kEngineRelease]: this.release,
    [ApiTypeEngine.kEngineSetChannelProfile]: this.setChannelProfile,
    [ApiTypeEngine.kEngineSetClientRole]: this.setClientRole,
    [ApiTypeEngine.kEngineJoinChannel]: this.joinChannel,
    [ApiTypeEngine.kEngineLeaveChannel]: this.leaveChannel,
    [ApiTypeEngine.kEngineRenewToken]: this.renewToken,
    [ApiTypeEngine.kEngineJoinChannelWithUserAccount]:
      this.joinChannelWithUserAccount,
    [ApiTypeEngine.kEngineEnableVideo]: this.enableVideo,
    [ApiTypeEngine.kEngineDisableVideo]: this.disableVideo,
    [ApiTypeEngine.kEngineSetVideoEncoderConfiguration]:
      this.setVideoEncoderConfiguration,
    [ApiTypeEngine.kEngineSetupLocalVideo]: this.setupLocalVideo,
    [ApiTypeEngine.kEngineSetupRemoteVideo]: this.setupRemoteVideo,
    [ApiTypeEngine.kEngineStartPreview]: this.startPreview,
    [ApiTypeEngine.kEngineStopPreview]: this.stopPreview,
    [ApiTypeEngine.kEngineEnableAudio]: this.enableAudio,
    [ApiTypeEngine.kEngineEnableLocalAudio]: this.enableLocalAudio,
    [ApiTypeEngine.kEngineDisableAudio]: this.disableAudio,
    [ApiTypeEngine.kEngineSetAudioProfile]: this.setAudioProfile,
    [ApiTypeEngine.kEngineMuteLocalAudioStream]: this.muteLocalAudioStream,
    [ApiTypeEngine.kEngineMuteAllRemoteAudioStreams]:
      this.muteAllRemoteAudioStreams,
    [ApiTypeEngine.kEngineSetDefaultMuteAllRemoteAudioStreams]:
      this.setDefaultMuteAllRemoteAudioStreams,
    [ApiTypeEngine.kEngineAdjustUserPlaybackSignalVolume]:
      this.adjustUserPlaybackSignalVolume,
    [ApiTypeEngine.kEngineMuteRemoteAudioStream]: this.muteRemoteAudioStream,
    [ApiTypeEngine.kEngineMuteLocalVideoStream]: this.muteLocalVideoStream,
    [ApiTypeEngine.kEngineEnableLocalVideo]: this.enableLocalVideo,
    [ApiTypeEngine.kEngineMuteAllRemoteVideoStreams]:
      this.muteAllRemoteVideoStreams,
    [ApiTypeEngine.kEngineSetDefaultMuteAllRemoteVideoStreams]:
      this.setDefaultMuteAllRemoteVideoStreams,
    [ApiTypeEngine.kEngineMuteRemoteVideoStream]: this.muteRemoteVideoStream,
    [ApiTypeEngine.kEngineSetRemoteVideoStreamType]:
      this.setRemoteVideoStreamType,
    [ApiTypeEngine.kEngineSetRemoteDefaultVideoStreamType]:
      this.setRemoteDefaultVideoStreamType,
    [ApiTypeEngine.kEngineEnableAudioVolumeIndication]:
      this.enableAudioVolumeIndication,
    [ApiTypeEngine.kEngineSetLogFilter]: this.setLogFilter,
    [ApiTypeEngine.kEngineUploadLogFile]: this.uploadLogFile,
    [ApiTypeEngine.kEngineEnableDualStreamMode]: this.enableDualStreamMode,
    [ApiTypeEngine.kEngineAdjustRecordingSignalVolume]:
      this.adjustRecordingSignalVolume,
    [ApiTypeEngine.kEngineAdjustPlaybackSignalVolume]:
      this.adjustPlaybackSignalVolume,
    [ApiTypeEngine.kEngineSetRemoteSubscribeFallbackOption]:
      this.setRemoteSubscribeFallbackOption,
    [ApiTypeEngine.kEngineStartScreenCaptureByDisplayId]:
      this.startScreenCaptureByDisplayId,
    [ApiTypeEngine.kEngineStartScreenCaptureByScreenRect]:
      this.startScreenCaptureByScreenRect,
    [ApiTypeEngine.kEngineStartScreenCaptureByWindowId]:
      this.startScreenCaptureByWindowId,
    [ApiTypeEngine.kEngineStopScreenCapture]: this.stopScreenCapture,
    [ApiTypeEngine.kEngineStartScreenCapture]: this.startScreenCapture,
    [ApiTypeEngine.kEngineGetVersion]: this.getVersion,
    [ApiTypeEngine.kEngineSetEncryptionSecret]: this.setEncryptionSecret,
    [ApiTypeEngine.kEngineSetEncryptionMode]: this.setEncryptionMode,
    [ApiTypeEngine.kEngineEnableEncryption]: this.enableEncryption,
    [ApiTypeEngine.kEngineAddPublishStreamUrl]: this.addPublishStreamUrl,
    [ApiTypeEngine.kEngineRemovePublishStreamUrl]: this.removePublishStreamUrl,
    [ApiTypeEngine.kEngineSetLiveTranscoding]: this.setLiveTranscoding,
    [ApiTypeEngine.kEngineSetBeautyEffectOptions]: this.setBeautyEffectOptions,
    [ApiTypeEngine.kEngineAddInjectStreamUrl]: this.addInjectStreamUrl,
    [ApiTypeEngine.kEngineStartChannelMediaRelay]: this.startChannelMediaRelay,
    [ApiTypeEngine.kEngineUpdateChannelMediaRelay]:
      this.updateChannelMediaRelay,
    [ApiTypeEngine.kEngineStopChannelMediaRelay]: this.stopChannelMediaRelay,
    [ApiTypeEngine.kEngineRemoveInjectStreamUrl]: this.removeInjectStreamUrl,
    [ApiTypeEngine.kEngineSendCustomReportMessage]:
      this.sendCustomReportMessage,
    [ApiTypeEngine.kEngineGetConnectionState]: this.getConnectionState,
    [ApiTypeEngine.kEngineSetParameters]: this.setParameters,
    [ApiTypeEngine.kEngineSetAppType]: this.setAppType,
  };

  constructor() {
    this._mode = 'rtc';
    this._enableAudio = true;
    this._enableVideo = false;
    this._enableLocalAudio = true;
    this._enableLocalVideo = true;
    this._muteLocalAudio = false;
    this._muteLocalVideo = false;
    this._defaultMuteAllRemoteAudioStreams = false;
    this._defaultMuteAllRemoteVideoStreams = false;
  }

  private _addListener() {
    if (this._client === undefined) {
      throw 'please create first';
    }
    this._client.on(
      'connection-state-change',
      (
        curState: ConnectionState,
        revState: ConnectionState,
        reason?: ConnectionDisconnectedReason
      ) => {
        printf('connection-state-change', curState, revState, revState);
        this._emitEvent('ConnectionStateChanged', {
          state: ConnectionStateToNative(curState),
          reason: ConnectionDisconnectedReasonToNative(reason),
        });
      }
    );
    this._client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
      printf('user-joined', user);
      this._emitEvent('UserJoined', {
        uid: user.uid,
        elapsed: 0,
      });
    });
    this._client.on(
      'user-left',
      (user: IAgoraRTCRemoteUser, reason: string) => {
        printf('user-left', user, reason);
        this._emitEvent('UserOffline', {
          uid: user.uid,
          reason: UserLeftReasonToNative(reason),
        });
      }
    );
    this._client.on(
      'user-published',
      async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        printf('user-published', user, mediaType);
        switch (mediaType) {
          case 'audio':
            // TODO
            // emitEvent('AudioPublishStateChanged', []);
            await this.muteRemoteAudioStream({ userId: user, mute: false });
            this._emitEvent('RemoteAudioStateChanged', {
              uid: user.uid,
              state: REMOTE_AUDIO_STATE.REMOTE_AUDIO_STATE_DECODING,
              reason:
                REMOTE_AUDIO_STATE_REASON.REMOTE_AUDIO_REASON_REMOTE_UNMUTED,
              elapsed: 0,
            });
            break;
          case 'video':
            // TODO
            // emitEvent('VideoPublishStateChanged', []);
            await this.muteRemoteVideoStream({ userId: user, mute: false });
            this._emitEvent('RemoteVideoStateChanged', {
              uid: user.uid,
              state: REMOTE_VIDEO_STATE.REMOTE_VIDEO_STATE_DECODING,
              reason:
                REMOTE_VIDEO_STATE_REASON.REMOTE_VIDEO_STATE_REASON_REMOTE_UNMUTED,
              elapsed: 0,
            });
            break;
        }
      }
    );
    this._client.on(
      'user-unpublished',
      (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        printf('user-unpublished', user, mediaType);
        switch (mediaType) {
          case 'audio':
            // TODO
            // emitEvent('AudioPublishStateChanged', []);
            this.deviceManager.removeRemoteAudioTrack(user.uid);
            this._emitEvent('RemoteAudioStateChanged', {
              uid: user.uid,
              state: REMOTE_AUDIO_STATE.REMOTE_AUDIO_STATE_STOPPED,
              reason:
                REMOTE_AUDIO_STATE_REASON.REMOTE_AUDIO_REASON_REMOTE_MUTED,
              elapsed: 0,
            });
            break;
          case 'video':
            // TODO
            // emitEvent('VideoPublishStateChanged', []);
            this.deviceManager.removeRemoteVideoTrack(user.uid);
            this._emitEvent('RemoteVideoStateChanged', {
              uid: user.uid,
              state: REMOTE_VIDEO_STATE.REMOTE_VIDEO_STATE_STOPPED,
              reason:
                REMOTE_VIDEO_STATE_REASON.REMOTE_VIDEO_STATE_REASON_REMOTE_MUTED,
              elapsed: 0,
            });
            break;
        }
      }
    );
    this._client.on(
      'user-info-updated',
      (
        uid: UID,
        msg:
          | 'mute-audio'
          | 'mute-video'
          | 'enable-local-video'
          | 'unmute-audio'
          | 'unmute-video'
          | 'disable-local-video'
      ) => {
        printf('user-info-updated', uid, msg);
        switch (msg) {
          case 'mute-audio':
            this._emitEvent('RemoteAudioStateChanged', {
              uid: uid,
              state: REMOTE_AUDIO_STATE.REMOTE_AUDIO_STATE_STOPPED,
              reason:
                REMOTE_AUDIO_STATE_REASON.REMOTE_AUDIO_REASON_REMOTE_MUTED,
              elapsed: 0,
            });
            break;
          case 'mute-video':
          case 'disable-local-video':
            this._emitEvent('RemoteVideoStateChanged', {
              uid: uid,
              state: REMOTE_VIDEO_STATE.REMOTE_VIDEO_STATE_STOPPED,
              reason:
                REMOTE_VIDEO_STATE_REASON.REMOTE_VIDEO_STATE_REASON_REMOTE_MUTED,
              elapsed: 0,
            });
            break;
          case 'unmute-audio':
            this._emitEvent('RemoteAudioStateChanged', {
              uid: uid,
              state: REMOTE_AUDIO_STATE.REMOTE_AUDIO_STATE_DECODING,
              reason:
                REMOTE_AUDIO_STATE_REASON.REMOTE_AUDIO_REASON_REMOTE_UNMUTED,
              elapsed: 0,
            });
            break;
          case 'unmute-video':
          case 'enable-local-video':
            this._emitEvent('RemoteVideoStateChanged', {
              uid: uid,
              state: REMOTE_VIDEO_STATE.REMOTE_VIDEO_STATE_DECODING,
              reason:
                REMOTE_VIDEO_STATE_REASON.REMOTE_VIDEO_STATE_REASON_REMOTE_UNMUTED,
              elapsed: 0,
            });
            break;
        }
      }
    );
    this._client.on('media-reconnect-start', (uid: UID) => {
      printf('media-reconnect-start', uid);
    });
    this._client.on('media-reconnect-end', (uid: UID) => {
      printf('media-reconnect-end', uid);
    });
    this._client.on(
      'stream-type-changed',
      (uid: UID, streamType: RemoteStreamType) => {
        printf('stream-type-changed', uid, streamType);
      }
    );
    this._client.on(
      'stream-fallback',
      (uid: UID, isFallbackOrRecover: 'fallback' | 'recover') => {
        printf('stream-fallback', uid, isFallbackOrRecover);
        this._emitEvent('RemoteSubscribeFallbackToAudioOnly', {
          uid: uid,
          isFallbackOrRecover: isFallbackOrRecover === 'fallback',
        });
      }
    );
    this._client.on(
      'channel-media-relay-state',
      (state: ChannelMediaRelayState, code: ChannelMediaRelayError) => {
        printf('channel-media-relay-state', state, code);
        this._emitEvent('ChannelMediaRelayStateChanged', {
          state: ChannelMediaRelayStateToNative(state),
          code: ChannelMediaRelayErrorToNative(code),
        });
      }
    );
    this._client.on(
      'channel-media-relay-event',
      (event: ChannelMediaRelayEvent) => {
        printf('channel-media-relay-event', event);
        this._emitEvent('ChannelMediaRelayEvent', {
          code: ChannelMediaRelayEventToNative(event),
        });
      }
    );
    this._client.on(
      'volume-indicator',
      (
        result: {
          level: number;
          uid: UID;
        }[]
      ) => {
        printf('volume-indicator', result);
        let totalVolume = 0;
        const speakers = result.map((value) => {
          totalVolume += value.level;
          return { uid: value.uid, volume: value.level };
        });
        this._emitEvent('AudioVolumeIndication', {
          speakers: speakers,
          speakerNumber: result.length,
          totalVolume: totalVolume,
        });
      }
    );
    this._client.on('crypt-error', () => {
      printf('crypt-error');
    });
    this._client.on('token-privilege-will-expire', () => {
      printf('token-privilege-will-expire');
      this._emitEvent('TokenPrivilegeWillExpire');
    });
    this._client.on('token-privilege-did-expire', () => {
      printf('token-privilege-did-expire');
    });
    this._client.on('network-quality', (stats: NetworkQuality) => {
      printf('network-quality', stats);
      this._emitEvent('NetworkQuality', {
        uid: 0,
        txQuality: NetworkQualityToNative(stats.uplinkNetworkQuality),
        rxQuality: NetworkQualityToNative(stats.downlinkNetworkQuality),
      });
    });
    this._client.on(
      'live-streaming-error',
      (url: string, err: { code: string }) => {
        printf('live-streaming-error', url, err);
        this._emitEvent('RtmpStreamingStateChanged', {
          url: url,
          state: RTMP_STREAM_PUBLISH_STATE.RTMP_STREAM_PUBLISH_STATE_IDLE,
          errCode: RtmpStreamingErrorToNative(err.code),
        });
      }
    );
    this._client.on(
      'live-streaming-warning',
      (url: string, warning: { code: string }) => {
        printf('live-streaming-warning', url, warning);
        if (warning.code === 'LIVE_STREAMING_WARN_FAILED_LOAD_IMAGE') {
          this._emitEvent('RtmpStreamingEvent', {
            url: url,
            eventCode:
              RTMP_STREAMING_EVENT.RTMP_STREAMING_EVENT_FAILED_LOAD_IMAGE,
          });
        } else {
          this._emitEvent('RtmpStreamingStateChanged', {
            url: url,
            state: RTMP_STREAM_PUBLISH_STATE.RTMP_STREAM_PUBLISH_STATE_IDLE,
            errCode: RtmpStreamingErrorToNative(warning.code),
          });
        }
      }
    );
    this._client.on(
      'stream-inject-status',
      (status: number, uid: UID, url: string) => {
        printf('stream-inject-status', status, uid, url);
        this._emitEvent('StreamInjectedStatus', {
          url: url,
          uid: uid,
          status: InjectStreamEventStatusToNative(status),
        });
      }
    );
    this._client.on(
      'exception',
      (event: { code: number; msg: string; uid: UID }) => {
        printf('exception', event);
        if (event.code in ERROR_CODE_TYPE) {
          this._emitEvent('Error', {
            err: event.code,
            msg: '',
          });
        }
      }
    );
    this._client.on('is-using-cloud-proxy', (isUsingProxy: boolean) => {
      printf('is-using-cloud-proxy', isUsingProxy);
    });
  }

  private _emitEvent(methodName: string, data: { [key: string]: any } = {}) {
    printf('_emitEvent', methodName, data, this._handler);
    this._handler?.call(this, methodName, JSON.stringify(data));
  }

  private _createClient() {
    this._client = AgoraRTC.createClient({ codec: 'h264', mode: this._mode });
    this._addListener();
  }

  private static async _setLogLevel(params: {
    level?: LOG_LEVEL;
  }): Promise<void> {
    if (params.level !== undefined) {
      let logLevel: number = 0;
      switch (params.level) {
        case LOG_LEVEL.LOG_LEVEL_NONE:
          logLevel = 4;
          break;
        case LOG_LEVEL.LOG_LEVEL_INFO:
          logLevel = 1;
          break;
        case LOG_LEVEL.LOG_LEVEL_WARN:
          logLevel = 2;
          break;
        case LOG_LEVEL.LOG_LEVEL_ERROR:
        case LOG_LEVEL.LOG_LEVEL_FATAL:
          logLevel = 3;
          break;
      }
      return AgoraRTC.setLogLevel(logLevel);
    }
  }

  private static async _setArea(code?: AREA_CODE): Promise<void> {
    if (code !== undefined) {
      let areaCode: AREAS = AREAS.GLOBAL;
      switch (code) {
        case AREA_CODE.AREA_CODE_CN:
          areaCode = AREAS.CHINA;
          break;
        case AREA_CODE.AREA_CODE_NA:
          areaCode = AREAS.NORTH_AMERICA;
          break;
        case AREA_CODE.AREA_CODE_EU:
          areaCode = AREAS.EUROPE;
          break;
        case AREA_CODE.AREA_CODE_AS:
          areaCode = AREAS.ASIA;
          break;
        case AREA_CODE.AREA_CODE_JP:
          areaCode = AREAS.JAPAN;
          break;
        case AREA_CODE.AREA_CODE_IN:
          areaCode = AREAS.INDIA;
          break;
        case AREA_CODE.AREA_CODE_GLOB:
          areaCode = AREAS.GLOBAL;
          break;
      }
      // TODO support area code array?
      return AgoraRTC.setArea([areaCode]);
    }
  }

  private async _publish(track?: ILocalTrack) {
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (track !== undefined) {
      await this._client.publish(track);
    } else {
      const tracks: ILocalTrack[] = [];
      if (this.deviceManager.localAudioTrack !== undefined) {
        if (!this._muteLocalAudio) {
          tracks.push(this.deviceManager.localAudioTrack);
        }
      }
      if (this.deviceManager.localVideoTrack !== undefined) {
        if (!this._muteLocalVideo) {
          tracks.push(this.deviceManager.localVideoTrack);
        }
      }
      if (tracks.length > 0) {
        await this._client.publish(tracks);
      }
    }
  }

  public async callApi(
    apiType: ApiTypeEngine,
    params: string,
    extra?: any
  ): Promise<any> {
    printf('callApi', apiType, params, extra, this);
    return this._support_apis[apiType]?.call(this, JSON.parse(params), extra);
  }

  public setEventHandler(handler: (event: string, data: string) => void) {
    this._handler = handler;
  }

  public async createChannel(): Promise<IrisRtcEngine> {
    if (this._context === undefined) {
      throw 'please create first';
    }
    const channel = new IrisRtcEngine();
    channel._mode = this._mode;
    channel._enableAudio = this._enableAudio;
    channel._enableLocalAudio = this._enableLocalAudio;
    channel._enableVideo = this._enableVideo;
    channel._enableLocalVideo = this._enableLocalVideo;
    await channel.initialize({ context: this._context });
    return channel;
  }

  public async initialize(params: {
    context: RtcEngineContext;
  }): Promise<void> {
    this._context = params.context;
    await IrisRtcEngine._setArea(params.context.areaCode);
    await IrisRtcEngine._setLogLevel({
      level: params.context.logConfig?.level,
    });
    this._createClient();
  }

  public async release(): Promise<void> {
    await this.leaveChannel({});
    this.deviceManager.localAudioTrack?.close();
    this.deviceManager.localAudioTrack = undefined;
    this.deviceManager.localVideoTrack?.close();
    this.deviceManager.localVideoTrack = undefined;
    this._client = undefined;
    this._context = undefined;
    this._handler = undefined;
  }

  public async setChannelProfile(params: {
    profile: CHANNEL_PROFILE_TYPE;
  }): Promise<void> {
    let mode: SDK_MODE | undefined;
    switch (params.profile) {
      case CHANNEL_PROFILE_TYPE.CHANNEL_PROFILE_COMMUNICATION:
        mode = 'rtc';
        break;
      case CHANNEL_PROFILE_TYPE.CHANNEL_PROFILE_LIVE_BROADCASTING:
        mode = 'live';
        break;
      case CHANNEL_PROFILE_TYPE.CHANNEL_PROFILE_GAME:
        break;
    }
    if (mode !== undefined && mode !== this._mode) {
      this._mode = mode;
      this._createClient();
    }
  }

  public async setClientRole(params: {
    role: CLIENT_ROLE_TYPE;
    options?: ClientRoleOptions;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    let role: ClientRole;
    switch (params.role) {
      case CLIENT_ROLE_TYPE.CLIENT_ROLE_BROADCASTER:
        role = 'host';
        break;
      case CLIENT_ROLE_TYPE.CLIENT_ROLE_AUDIENCE:
        role = 'audience';
        break;
    }
    let level: AudienceLatencyLevelType | undefined;
    switch (params.options?.audienceLatencyLevel) {
      case AUDIENCE_LATENCY_LEVEL_TYPE.AUDIENCE_LATENCY_LEVEL_LOW_LATENCY:
        level = AudienceLatencyLevelType.AUDIENCE_LEVEL_LOW_LATENCY;
        break;
      case AUDIENCE_LATENCY_LEVEL_TYPE.AUDIENCE_LATENCY_LEVEL_ULTRA_LOW_LATENCY:
        level = AudienceLatencyLevelType.AUDIENCE_LEVEL_ULTRA_LOW_LATENCY;
        break;
    }
    return this._client.setClientRole(role, level ? { level } : undefined);
  }

  public async joinChannel(params: {
    token: string | null;
    channelId: string;
    info?: string;
    uid?: number | string;
    options?: ChannelMediaOptions;
  }): Promise<void> {
    if (this._context === undefined) {
      throw 'please create first';
    }
    const { channelId, token, uid } = params;
    return this._client
      ?.join(this._context?.appId, channelId, token, uid)
      .then(async (id) => {
        try {
          await this.deviceManager.createMicrophoneAudioTrack(
            this._enableAudio && this._enableLocalAudio
          );
          await this.deviceManager.createCameraVideoTrack(
            this._enableVideo && this._enableLocalVideo
          );
          await this._publish();
        } finally {
          this._emitEvent('JoinChannelSuccess', {
            channel: channelId,
            uid: id,
            elapsed: 0,
          });
        }
      });
  }

  public async leaveChannel(_?: {}): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.leave().then(() => {
      this.deviceManager.localAudioTrack?.close();
      this.deviceManager.localAudioTrack = undefined;
      // this.deviceManager.localVideoTrack?.close();
      // this.deviceManager.localVideoTrack = undefined;
      this.deviceManager.clearRemoteAudioTracks();
      this.deviceManager.clearRemoteVideoTracks();
      let stats: RtcStats = {
        cpuAppUsage: 0,
        cpuTotalUsage: 0,
        duration: 0,
        gatewayRtt: 0,
        lastmileDelay: 0,
        memoryAppUsageInKbytes: 0,
        memoryAppUsageRatio: 0,
        memoryTotalUsageRatio: 0,
        rxAudioBytes: 0,
        rxAudioKBitRate: 0,
        rxBytes: 0,
        rxKBitRate: 0,
        rxPacketLossRate: 0,
        rxVideoBytes: 0,
        rxVideoKBitRate: 0,
        txAudioBytes: 0,
        txAudioKBitRate: 0,
        txBytes: 0,
        txKBitRate: 0,
        txPacketLossRate: 0,
        txVideoBytes: 0,
        txVideoKBitRate: 0,
        userCount: 0,
      };
      const res = this._client?.getRTCStats();
      if (res) {
        stats.duration = res.Duration;
        stats.rxKBitRate = res.RecvBitrate;
        stats.rxBytes = res.RecvBytes;
        stats.txKBitRate = res.SendBitrate;
        stats.txBytes = res.SendBytes;
        stats.userCount = res.UserCount;
        stats.gatewayRtt = res.RTT;
        // stats. = res.OutgoingAvailableBandwidth;
      }
      this._emitEvent('LeaveChannel', { stats: stats });
    });
  }

  public async renewToken(params: { token: string }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.renewToken(params.token);
  }

  public async joinChannelWithUserAccount(params: {
    token: string | null;
    channelId: string;
    userAccount: string;
    options?: ChannelMediaOptions;
  }): Promise<void> {
    if (this._context === undefined) {
      throw 'please create first';
    }
    const { channelId, token, userAccount } = params;
    return this._client
      ?.join(this._context.appId, channelId, token, userAccount)
      .then(async (id) => {
        try {
          await this.deviceManager.createMicrophoneAudioTrack(
            this._enableAudio && this._enableLocalAudio
          );
          await this.deviceManager.createCameraVideoTrack(
            this._enableVideo && this._enableLocalVideo
          );
          await this._publish();
        } finally {
          this._emitEvent('JoinChannelSuccess', {
            channel: channelId,
            uid: id,
            elapsed: 0,
          });
        }
      });
  }

  public async enableVideo(_?: {}): Promise<void> {
    this._enableVideo = true;
    await Promise.all([
      this.enableLocalVideo({ enabled: true }),
      // TODO
      this.deviceManager.remoteVideoTracks.map((track) => {
        return track.play('');
      }),
    ]);
  }

  public async disableVideo(_?: {}): Promise<void> {
    this._enableVideo = false;
    await Promise.all([
      this.enableLocalVideo({ enabled: false }),
      // TODO
      this.deviceManager.remoteVideoTracks.map((track) => {
        return track.stop();
      }),
    ]);
  }

  public async setVideoEncoderConfiguration(params: {
    config: VideoEncoderConfiguration;
  }): Promise<void> {
    const func = (
      this.deviceManager.localVideoTrack as ICameraVideoTrack | undefined
    )?.setEncoderConfiguration;
    if (func !== undefined) {
      await func.call(this.deviceManager.localVideoTrack, {
        width: params.config.dimensions?.width,
        height: params.config.dimensions?.height,
        frameRate: params.config.frameRate,
        bitrateMin: params.config.minBitrate,
        bitrateMax: params.config.bitrate,
      });
    }
  }

  public async setupLocalVideo(
    params: { canvas: VideoCanvas },
    element?: HTMLElement
  ): Promise<void> {
    let fit: 'cover' | 'contain' | 'fill' = 'cover';
    switch (params.canvas.renderMode) {
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
    const channel = this.channel.getChannel(params.canvas.channelId);
    let track: ILocalVideoTrack | undefined;
    if (channel !== undefined) {
      track = channel.deviceManager.localVideoTrack;
    } else {
      track = this.deviceManager.localVideoTrack;
    }
    track?.play(element ?? params.canvas.view, {
      mirror:
        params.canvas.mirrorMode ===
        VIDEO_MIRROR_MODE_TYPE.VIDEO_MIRROR_MODE_ENABLED,
      fit,
    });
  }

  public async setupRemoteVideo(
    params: { canvas: VideoCanvas },
    element?: HTMLElement
  ): Promise<void> {
    const channel = this.channel.getChannel(params.canvas.channelId);
    let tracks: IRemoteVideoTrack[];
    if (channel !== undefined) {
      tracks = channel.deviceManager.remoteVideoTracks;
    } else {
      tracks = this.deviceManager.remoteVideoTracks;
    }
    await Promise.all(
      tracks.map((track) => {
        if (track.getUserId() === params.canvas.uid) {
          printf('setupRemoteVideo', track, params, element);
          let fit: 'cover' | 'contain' | 'fill' = 'cover';
          switch (params.canvas.renderMode) {
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
          track.play(element ?? params.canvas.view, {
            mirror:
              params.canvas.mirrorMode ===
              VIDEO_MIRROR_MODE_TYPE.VIDEO_MIRROR_MODE_ENABLED,
            fit,
          });
        }
      })
    );
  }

  public async startPreview(_?: {}): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (!this._enableVideo || !this._enableLocalVideo) return;
    if (this._client.channelName !== undefined) return;
    await this.deviceManager.createCameraVideoTrack(
      this._enableVideo && this._enableLocalVideo,
      true
    );
  }

  public async stopPreview(_?: {}): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (this._client.channelName !== undefined) return;
    if (this.deviceManager.localVideoTrack !== undefined) {
      await this.deviceManager.localVideoTrack.close();
      this.deviceManager.localVideoTrack = undefined;
    }
  }

  public async enableAudio(_?: {}): Promise<void> {
    this._enableAudio = true;
    await Promise.all([
      this.enableLocalAudio({ enabled: true }),
      // TODO
      this.deviceManager.remoteAudioTracks.map((track) => {
        return track.play();
      }),
    ]);
  }

  public async enableLocalAudio(params: { enabled: boolean }): Promise<void> {
    this._enableLocalAudio = params.enabled;
    return this.deviceManager.localAudioTrack?.setEnabled(params.enabled);
  }

  public async disableAudio(_?: {}): Promise<void> {
    this._enableAudio = false;
    await Promise.all([
      this.enableLocalAudio({ enabled: false }),
      // TODO
      this.deviceManager.remoteAudioTracks.map((track) => {
        return track.stop();
      }),
    ]);
  }

  public async setAudioProfile(params: {
    profile: AUDIO_PROFILE_TYPE;
    scenario: AUDIO_SCENARIO_TYPE;
  }): Promise<void> {
    let preset: AudioEncoderConfigurationPreset = 'music_standard';
    switch (params.profile) {
      case AUDIO_PROFILE_TYPE.AUDIO_PROFILE_DEFAULT:
        preset = 'music_standard';
        break;
      case AUDIO_PROFILE_TYPE.AUDIO_PROFILE_SPEECH_STANDARD:
        preset = 'speech_standard';
        break;
      case AUDIO_PROFILE_TYPE.AUDIO_PROFILE_MUSIC_STANDARD:
        preset = 'music_standard';
        break;
      case AUDIO_PROFILE_TYPE.AUDIO_PROFILE_MUSIC_STANDARD_STEREO:
        preset = 'standard_stereo';
        break;
      case AUDIO_PROFILE_TYPE.AUDIO_PROFILE_MUSIC_HIGH_QUALITY:
        preset = 'high_quality';
        break;
      case AUDIO_PROFILE_TYPE.AUDIO_PROFILE_MUSIC_HIGH_QUALITY_STEREO:
        preset = 'high_quality_stereo';
        break;
      case AUDIO_PROFILE_TYPE.AUDIO_PROFILE_IOT:
        preset = 'speech_low_quality';
        break;
    }
    this.deviceManager.localAudioConfig.encoderConfig = preset;
  }

  public async muteLocalAudioStream(params: { mute: boolean }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    this._muteLocalAudio = params.mute;
    if (this.deviceManager.localAudioTrack === undefined) {
      throw 'localAudioTrack not init';
    }
    if (params.mute) {
      return this._client.unpublish(this.deviceManager.localAudioTrack);
    } else {
      return this._client.publish(this.deviceManager.localAudioTrack);
    }
  }

  public async muteAllRemoteAudioStreams(params: {
    mute: boolean;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    await Promise.all(
      this._client.remoteUsers.map((user) => {
        return this.muteRemoteAudioStream({
          userId: user,
          mute: params.mute,
        });
      })
    );
  }

  public async setDefaultMuteAllRemoteAudioStreams(params: {
    mute: boolean;
  }): Promise<void> {
    this._defaultMuteAllRemoteAudioStreams = params.mute;
  }

  public async adjustUserPlaybackSignalVolume(params: {
    uid: number;
    volume: number;
  }): Promise<void> {
    await Promise.all(
      this.deviceManager.remoteAudioTracks.map((track) => {
        if (track.getUserId() === params.uid) {
          return track.setVolume(params.volume);
        }
      })
    );
  }

  public async muteRemoteAudioStream(params: {
    userId: number | IAgoraRTCRemoteUser;
    mute: boolean;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    const muteRemoteAudioStream = async (
      user: IAgoraRTCRemoteUser
    ): Promise<void> => {
      if (this._client === undefined) {
        throw 'please create first';
      }
      if (!params.mute) {
        return this._client.subscribe(user, 'audio').then((track) => {
          track.on('first-frame-decoded', () => {
            printf('first-frame-decoded', 'audio', track);
            this._emitEvent('RemoteAudioStateChanged', {
              uid: user.uid,
              state: REMOTE_AUDIO_STATE.REMOTE_AUDIO_STATE_STARTING,
              reason:
                REMOTE_AUDIO_STATE_REASON.REMOTE_AUDIO_REASON_REMOTE_UNMUTED,
              elapsed: 0,
            });
          });
          track.play();
          this.deviceManager.remoteAudioTracks.push(track);
        });
      } else {
        return this._client.unsubscribe(user, 'audio').then(() => {
          this.deviceManager.removeRemoteAudioTrack(user.uid);
        });
      }
    };
    if (typeof params.userId === 'number') {
      await Promise.all(
        this._client.remoteUsers.map((user) => {
          if (user.uid === params.userId) {
            return muteRemoteAudioStream(user);
          }
        })
      );
    } else {
      return muteRemoteAudioStream(params.userId);
    }
  }

  public async muteLocalVideoStream(params: { mute: boolean }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    this._muteLocalVideo = params.mute;
    if (this.deviceManager.localVideoTrack === undefined) {
      throw 'localVideoTrack not init';
    }
    if (!params.mute) {
      return this._client.publish(this.deviceManager.localVideoTrack);
    } else {
      return this._client.unpublish(this.deviceManager.localVideoTrack);
    }
  }

  public async enableLocalVideo(params: { enabled: boolean }): Promise<void> {
    this._enableLocalVideo = params.enabled;
    await this.deviceManager.localVideoTrack?.setEnabled(params.enabled);
  }

  public async muteAllRemoteVideoStreams(params: {
    mute: boolean;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    await Promise.all(
      this._client.remoteUsers.map((user) => {
        return this.muteRemoteVideoStream({
          userId: user,
          mute: params.mute,
        });
      })
    );
  }

  public async setDefaultMuteAllRemoteVideoStreams(params: {
    mute: boolean;
  }): Promise<void> {
    this._defaultMuteAllRemoteVideoStreams = params.mute;
  }

  public async muteRemoteVideoStream(params: {
    userId: number | IAgoraRTCRemoteUser;
    mute: boolean;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    const muteRemoteVideoStream = async (
      user: IAgoraRTCRemoteUser
    ): Promise<void> => {
      if (this._client === undefined) {
        throw 'please create first';
      }
      if (!params.mute) {
        return this._client.subscribe(user, 'video').then((track) => {
          track.on('first-frame-decoded', () => {
            printf('first-frame-decoded', 'video', track);
            this._emitEvent('RemoteVideoStateChanged', {
              uid: user.uid,
              state: REMOTE_VIDEO_STATE.REMOTE_VIDEO_STATE_STARTING,
              reason:
                REMOTE_VIDEO_STATE_REASON.REMOTE_VIDEO_STATE_REASON_REMOTE_UNMUTED,
              elapsed: 0,
            });
          });
          this.deviceManager.remoteVideoTracks.push(track);
        });
      } else {
        return this._client.unsubscribe(user, 'video').then(() => {
          this.deviceManager.removeRemoteAudioTrack(user.uid);
        });
      }
    };
    if (typeof params.userId === 'number') {
      await Promise.all(
        this._client.remoteUsers.map((user) => {
          if (user.uid === params.userId) {
            return muteRemoteVideoStream(user);
          }
        })
      );
    } else {
      return muteRemoteVideoStream(params.userId);
    }
  }

  public async setRemoteVideoStreamType(params: {
    userId: UID;
    streamType: REMOTE_VIDEO_STREAM_TYPE;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    let streamType: RemoteStreamType;
    switch (params.streamType) {
      case REMOTE_VIDEO_STREAM_TYPE.REMOTE_VIDEO_STREAM_HIGH:
        streamType = RemoteStreamType.HIGH_STREAM;
        break;
      case REMOTE_VIDEO_STREAM_TYPE.REMOTE_VIDEO_STREAM_LOW:
        streamType = RemoteStreamType.LOW_STREAM;
        break;
    }
    await this._client.setRemoteVideoStreamType(params.userId, streamType);
  }

  public async setRemoteDefaultVideoStreamType(params: {
    streamType: REMOTE_VIDEO_STREAM_TYPE;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    await Promise.all(
      this._client.remoteUsers.map((user) => {
        // TODO
        return this.setRemoteVideoStreamType({
          userId: user.uid,
          streamType: params.streamType,
        });
      })
    );
  }

  public async enableAudioVolumeIndication(_: {
    interval: number;
    smooth: number;
    report_vad: number;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.enableAudioVolumeIndicator();
  }

  public async setLogFilter(params: {
    filter: LOG_FILTER_TYPE;
  }): Promise<void> {
    let logLevel: LOG_LEVEL = LOG_LEVEL.LOG_LEVEL_INFO;
    switch (params.filter) {
      case LOG_FILTER_TYPE.LOG_FILTER_OFF:
        logLevel = LOG_LEVEL.LOG_LEVEL_NONE;
        break;
      case LOG_FILTER_TYPE.LOG_FILTER_DEBUG:
      case LOG_FILTER_TYPE.LOG_FILTER_INFO:
      case LOG_FILTER_TYPE.LOG_FILTER_MASK:
        logLevel = LOG_LEVEL.LOG_LEVEL_INFO;
        break;
      case LOG_FILTER_TYPE.LOG_FILTER_WARN:
        logLevel = LOG_LEVEL.LOG_LEVEL_WARN;
        break;
      case LOG_FILTER_TYPE.LOG_FILTER_ERROR:
        logLevel = LOG_LEVEL.LOG_LEVEL_ERROR;
        break;
      case LOG_FILTER_TYPE.LOG_FILTER_CRITICAL:
        logLevel = LOG_LEVEL.LOG_LEVEL_FATAL;
        break;
    }
    return AgoraRTC.setLogLevel(logLevel);
  }

  public async uploadLogFile(): Promise<string> {
    // TODO
    AgoraRTC.enableLogUpload();
    return '';
  }

  public async enableDualStreamMode(params: {
    enabled: boolean;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (params.enabled) {
      return this._client.enableDualStream();
    } else {
      return this._client.disableDualStream();
    }
  }

  public async adjustRecordingSignalVolume(params: {
    volume: number;
  }): Promise<void> {
    return this.deviceManager.localAudioTrack?.setVolume(params.volume);
  }

  public async adjustPlaybackSignalVolume(params: {
    volume: number;
  }): Promise<void> {
    await Promise.all(
      this.deviceManager.remoteAudioTracks.map((track) => {
        return track.setVolume(params.volume);
      })
    );
  }

  public async startScreenCaptureByDisplayId(params: {
    displayId?: number;
    regionRect?: Rectangle;
    captureParams?: ScreenCaptureParameters;
  }): Promise<void> {
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        params.captureParams,
        true
      )
      .then((track) => {
        if (this._muteLocalVideo) return;
        this._publish(track);
      });
  }

  public async startScreenCaptureByScreenRect(params: {
    screenRect?: Rectangle;
    regionRect?: Rectangle;
    captureParams?: ScreenCaptureParameters;
  }): Promise<void> {
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        params.captureParams,
        true
      )
      .then((track) => {
        if (this._muteLocalVideo) return;
        this._publish(track);
      });
  }

  public async startScreenCaptureByWindowId(params: {
    windowId?: number;
    regionRect?: Rectangle;
    captureParams?: ScreenCaptureParameters;
  }): Promise<void> {
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        params.captureParams,
        true
      )
      .then((track) => {
        if (this._muteLocalVideo) return;
        this._publish(track);
      });
  }

  public async stopScreenCapture(_?: {}): Promise<void> {
    if (this.deviceManager.localVideoTrack === undefined) return;
    const func = (
      this.deviceManager.localVideoTrack as ICameraVideoTrack | undefined
    )?.setEncoderConfiguration;
    if (func === undefined) {
      this.deviceManager.localVideoTrack.close();
      this.deviceManager.localVideoTrack = undefined;
    }
  }

  public async startScreenCapture(params: {
    windowId?: number;
    captureFreq?: number;
    rect?: Rect;
    bitrate?: number;
  }): Promise<void> {
    const { rect } = params;
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        {
          dimensions: {
            width:
              rect && rect.right !== undefined && rect.left !== undefined
                ? rect.right - rect.left
                : undefined,
            height:
              rect && rect.bottom !== undefined && rect.top !== undefined
                ? rect.bottom - rect.top
                : undefined,
          },
          frameRate: params.captureFreq,
          bitrate: params.bitrate,
        },
        true
      )
      .then((track) => {
        if (this._muteLocalVideo) return;
        this._publish(track);
      });
  }

  public async setRemoteSubscribeFallbackOption(params: {
    option: STREAM_FALLBACK_OPTIONS;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    await Promise.all(
      this._client.remoteUsers.map((user) => {
        let option: RemoteStreamFallbackType;
        switch (params.option) {
          case STREAM_FALLBACK_OPTIONS.STREAM_FALLBACK_OPTION_DISABLED:
            option = RemoteStreamFallbackType.DISABLE;
            break;
          case STREAM_FALLBACK_OPTIONS.STREAM_FALLBACK_OPTION_VIDEO_STREAM_LOW:
            option = RemoteStreamFallbackType.LOW_STREAM;
            break;
          case STREAM_FALLBACK_OPTIONS.STREAM_FALLBACK_OPTION_AUDIO_ONLY:
            option = RemoteStreamFallbackType.AUDIO_ONLY;
            break;
        }
        return this._client?.setStreamFallbackOption(user.uid, option);
      })
    );
  }

  public async getVersion(): Promise<string> {
    return AgoraRTC.VERSION;
  }

  public async setEncryptionSecret(params: { secret: string }): Promise<void> {
    this._secret = params.secret;
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (this._encryptionMode && this._secret) {
      return this._client.setEncryptionConfig(
        this._encryptionMode,
        this._secret
      );
    } else {
      return this._client.setEncryptionConfig('none', '');
    }
  }

  public async setEncryptionMode(params: {
    encryptionMode:
      | 'aes-128-xts'
      | 'aes-256-xts'
      | 'aes-128-ecb'
      | 'sm4-128-ecb'
      | 'aes-128-gcm'
      | 'aes-256-gcm'
      | 'none';
  }): Promise<void> {
    this._encryptionMode = params.encryptionMode;
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (this._encryptionMode && this._secret) {
      return this._client.setEncryptionConfig(
        this._encryptionMode,
        this._secret
      );
    } else {
      return this._client.setEncryptionConfig('none', '');
    }
  }

  public async enableEncryption(params: {
    enabled: boolean;
    config: EncryptionConfig;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    let encryptionMode: EncryptionMode = 'aes-128-xts';
    if (params.enabled) {
      switch (params.config.encryptionMode) {
        case ENCRYPTION_MODE.AES_128_XTS:
          encryptionMode = 'aes-128-xts';
          break;
        case ENCRYPTION_MODE.AES_128_ECB:
          encryptionMode = 'aes-128-ecb';
          break;
        case ENCRYPTION_MODE.AES_256_XTS:
          encryptionMode = 'aes-256-xts';
          break;
        case ENCRYPTION_MODE.SM4_128_ECB:
          encryptionMode = 'sm4-128-ecb';
          break;
        case ENCRYPTION_MODE.AES_128_GCM:
          encryptionMode = 'aes-128-gcm';
          break;
        case ENCRYPTION_MODE.AES_256_GCM:
          encryptionMode = 'aes-256-gcm';
          break;
        case ENCRYPTION_MODE.MODE_END:
          encryptionMode = 'none';
          break;
      }
    } else {
      encryptionMode = 'none';
    }
    return this._client.setEncryptionConfig(
      encryptionMode,
      params.config.encryptionKey ?? ''
    );
  }

  public async addPublishStreamUrl(params: {
    url: string;
    transcodingEnabled: boolean;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.startLiveStreaming(
      params.url,
      params.transcodingEnabled
    );
  }

  public async removePublishStreamUrl(params: { url: string }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.stopLiveStreaming(params.url);
  }

  public async setLiveTranscoding(params: {
    transcoding: LiveTranscoding;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.setLiveTranscoding({
      audioBitrate: params.transcoding.audioBitrate,
      audioChannels: params.transcoding.audioChannels,
      audioSampleRate: params.transcoding.audioSampleRate,
      backgroundColor: params.transcoding.backgroundColor,
      height: params.transcoding.height,
      width: params.transcoding.width,
      lowLatency: params.transcoding.lowLatency,
      videoBitrate: params.transcoding.videoBitrate,
      videoCodecProfile: params.transcoding.videoCodecProfile,
      videoFrameRate: params.transcoding.videoFramerate,
      videoGop: params.transcoding.videoGop,
      watermark: params.transcoding.watermark,
      backgroundImage: params.transcoding.backgroundImage,
      transcodingUsers: params.transcoding.transcodingUsers,
      userConfigExtraInfo: params.transcoding.transcodingExtraInfo,
    });
  }

  public async setBeautyEffectOptions(params: {
    enabled: boolean;
    options: BeautyOptions;
  }): Promise<void> {
    const func = (
      this.deviceManager.localVideoTrack as ICameraVideoTrack | undefined
    )?.setBeautyEffect;
    if (func !== undefined) {
      await func.call(this.deviceManager.localVideoTrack, params.enabled, {
        smoothnessLevel: params.options.smoothnessLevel,
        lighteningLevel: params.options.lighteningLevel,
        rednessLevel: params.options.rednessLevel,
        lighteningContrastLevel: params.options.lighteningContrastLevel,
      });
    }
  }

  public async addInjectStreamUrl(params: {
    url: string;
    config: InjectStreamConfig;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.addInjectStreamUrl(params.url, {
      audioBitrate: params.config.audioBitrate,
      audioChannels: params.config.audioChannels,
      audioSampleRate: params.config.audioSampleRate,
      height: params.config.height,
      width: params.config.width,
      videoBitrate: params.config.videoBitrate,
      videoFramerate: params.config.videoFramerate,
      videoGop: params.config.videoGop,
    });
  }

  public async startChannelMediaRelay(params: {
    configuration: ChannelMediaRelayConfiguration;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    const config = AgoraRTC.createChannelMediaRelayConfiguration();
    config?.setSrcChannelInfo(params.configuration.srcInfo);
    params.configuration.destInfos.map((info) => {
      config?.addDestChannelInfo(info);
    });
    return this._client.startChannelMediaRelay(config);
  }

  public async updateChannelMediaRelay(params: {
    configuration: ChannelMediaRelayConfiguration;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    const config = AgoraRTC.createChannelMediaRelayConfiguration();
    config?.setSrcChannelInfo(params.configuration.srcInfo);
    params.configuration.destInfos.map((info) => {
      config?.addDestChannelInfo(info);
    });
    return this._client.updateChannelMediaRelay(config);
  }

  public async stopChannelMediaRelay(_?: {}): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.stopChannelMediaRelay();
  }

  public async removeInjectStreamUrl(_: { url: string }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.removeInjectStreamUrl();
  }

  public async sendCustomReportMessage(params: {
    id: string;
    category: string;
    event: string;
    label: string;
    value: number;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    await this._client.sendCustomReportMessage({
      category: params.id,
      event: params.category,
      label: params.event,
      reportId: params.label,
      value: params.value,
    });
  }

  public async getConnectionState(_?: {}): Promise<CONNECTION_STATE_TYPE> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return ConnectionStateToNative(this._client.connectionState);
  }

  public async setParameters(params: { parameters: string }): Promise<void> {
    const obj = JSON.parse(params.parameters);
    const key = Object.keys(obj)[0];
    return AgoraRTC.setParameter(key, obj[key]);
  }

  public async setAppType(params: { appType: number }): Promise<void> {
    return this.setParameters({
      parameters: `{"REPORT_APP_SCENARIO":${params.appType.toString()}}`,
    });
  }
}
