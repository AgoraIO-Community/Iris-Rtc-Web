import {
  AREAS,
  AudienceLatencyLevelType,
  AudioEncoderConfigurationPreset,
  ChannelMediaRelayError,
  ChannelMediaRelayEvent,
  ChannelMediaRelayState,
  ClientConfig,
  ClientRole,
  ConnectionDisconnectedReason,
  ConnectionState,
  EncryptionMode,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalTrack,
  ILocalVideoTrack,
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
  AudioVolumeInfo,
  BeautyOptions,
  CHANNEL_PROFILE_TYPE,
  ChannelMediaOptions,
  ChannelMediaRelayConfiguration,
  CLIENT_ROLE_TYPE,
  ClientRoleOptions,
  CLOUD_PROXY_TYPE,
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
  RtcEngineContext,
  RtcStats,
  RTMP_STREAM_PUBLISH_STATE,
  RTMP_STREAMING_EVENT,
  ScreenCaptureParameters,
  STREAM_FALLBACK_OPTIONS,
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
  public channel: IrisRtcChannel = new IrisRtcChannel(this);
  public deviceManager: IrisRtcDeviceManager = new IrisRtcDeviceManager();
  private _config: ClientConfig;
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
    [ApiTypeEngine.kEngineSetCloudProxy]: this.setCloudProxy,
  };

  constructor() {
    this._reset();
  }

  private _reset() {
    this._config = { codec: 'h264', mode: 'rtc' };
    this._client = undefined;
    this._context = undefined;
    this._handler = undefined;
    this._enableAudio = true;
    this._enableVideo = false;
    this._enableLocalAudio = true;
    this._enableLocalVideo = true;
    this._muteLocalAudio = false;
    this._muteLocalVideo = false;
    this._defaultMuteAllRemoteAudioStreams = false;
    this._defaultMuteAllRemoteVideoStreams = false;
    this._encryptionMode = undefined;
    this._secret = undefined;
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
            if (!this._enableAudio || this._defaultMuteAllRemoteAudioStreams)
              return;
            // TODO emitEvent('AudioPublishStateChanged', []);
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
            if (!this._enableVideo || this._defaultMuteAllRemoteVideoStreams)
              return;
            // TODO emitEvent('VideoPublishStateChanged', []);
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
            // TODO emitEvent('AudioPublishStateChanged', []);
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
            // TODO emitEvent('VideoPublishStateChanged', []);
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
          const level = Math.floor((value.level / 100) * 255);
          totalVolume += level;
          const volume: AudioVolumeInfo = {
            uid: +value.uid,
            volume: level,
            vad: 0,
            channelId: this._client?.channelName ?? '',
          };
          return volume;
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
      const qualities = this._client?.getRemoteNetworkQuality();
      if (qualities) {
        for (const it in qualities) {
          this._emitEvent('NetworkQuality', {
            uid: +it,
            txQuality: NetworkQualityToNative(
              qualities[it].uplinkNetworkQuality
            ),
            rxQuality: NetworkQualityToNative(
              qualities[it].downlinkNetworkQuality
            ),
          });
        }
      }
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
    if (this._client !== undefined) return;
    this._client = AgoraRTC.createClient(this._config);
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

  private static async _setArea(areaCodes?: AREA_CODE[]): Promise<void> {
    if (areaCodes !== undefined) {
      return AgoraRTC.setArea(
        areaCodes.map((value) => {
          switch (value) {
            case AREA_CODE.AREA_CODE_CN:
              return AREAS.CHINA;
            case AREA_CODE.AREA_CODE_NA:
              return AREAS.NORTH_AMERICA;
            case AREA_CODE.AREA_CODE_EU:
              return AREAS.EUROPE;
            case AREA_CODE.AREA_CODE_AS:
              return AREAS.ASIA;
            case AREA_CODE.AREA_CODE_JP:
              return AREAS.JAPAN;
            case AREA_CODE.AREA_CODE_IN:
              return AREAS.INDIA;
            case AREA_CODE.AREA_CODE_GLOB:
              return AREAS.GLOBAL;
          }
        })
      );
    }
  }

  private async _publish(track?: ILocalTrack) {
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (track === undefined) return;
    const func = (track as ILocalVideoTrack | undefined)?.setBeautyEffect;
    if (func !== undefined) {
      // as ILocalVideoTrack
      await this.deviceManager.muteLocalVideo(this._muteLocalVideo);
    } else {
      // as ILocalAudioTrack
      await this.deviceManager.muteLocalAudio(this._muteLocalAudio);
    }
    return this._client.publish(track);
  }

  /**
   * Iris callApi for engine
   * @param apiType
   * @param params
   * @param extra
   */
  public async callApi(
    apiType: ApiTypeEngine,
    params: string,
    extra?: any
  ): Promise<any> {
    printf('callApi', apiType, params, extra, this);
    return this._support_apis[apiType]?.call(this, JSON.parse(params), extra);
  }

  /**
   * Register event handler
   * @param handler
   */
  public setEventHandler(handler: (event: string, data: string) => void) {
    this._handler = handler;
  }

  public async createChannel(): Promise<IrisRtcEngine> {
    if (this._context === undefined) {
      throw 'please create first';
    }
    const channel = new IrisRtcEngine();
    channel._config.mode = this._config.mode;
    channel._enableAudio = this._enableAudio;
    channel._enableLocalAudio = this._enableLocalAudio;
    channel._enableVideo = this._enableVideo;
    channel._enableLocalVideo = this._enableLocalVideo;
    await channel.initialize({ context: this._context });
    return channel;
  }

  private async initialize(
    params: {
      context: RtcEngineContext;
    },
    config?: ClientConfig
  ): Promise<void> {
    this._context = params.context;
    await IrisRtcEngine._setArea(params.context.areaCode);
    await IrisRtcEngine._setLogLevel({
      level: params.context.logConfig?.level,
    });
    if (config !== undefined) {
      this._config = config;
    }
    this._createClient();
  }

  public async release(): Promise<void> {
    await this.leaveChannel();
    this.deviceManager.release();
    this._reset();
  }

  private async setChannelProfile(params: {
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
    if (mode !== undefined && mode !== this._config.mode) {
      await this.leaveChannel();
      this.deviceManager.release();
      this._config.mode = mode;
      // recreate client
      this._client = undefined;
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
    uid: UID;
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
          await this._publish(
            await this.deviceManager.createMicrophoneAudioTrack(
              this._enableAudio && this._enableLocalAudio,
              this._emitEvent.bind(this)
            )
          );
          await this._publish(
            await this.deviceManager.createCameraVideoTrack(
              this._enableVideo && this._enableLocalVideo,
              this._emitEvent.bind(this)
            )
          );
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
      this.deviceManager.release();
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
            this._enableAudio && this._enableLocalAudio,
            this._emitEvent.bind(this)
          );
          await this.deviceManager.createCameraVideoTrack(
            this._enableVideo && this._enableLocalVideo,
            this._emitEvent.bind(this)
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

  private async enableVideo(_?: {}): Promise<void> {
    this._enableVideo = true;
    await Promise.all([
      this.deviceManager.enableLocalVideo(
        this._enableVideo && this._enableLocalAudio
      ),
      this.deviceManager.enableRemoteVideo(this._enableVideo),
    ]);
  }

  private async disableVideo(_?: {}): Promise<void> {
    this._enableVideo = false;
    await Promise.all([
      this.deviceManager.enableLocalVideo(
        this._enableVideo && this._enableLocalAudio
      ),
      this.deviceManager.enableRemoteVideo(this._enableVideo),
    ]);
  }

  private async setVideoEncoderConfiguration(params: {
    config: VideoEncoderConfiguration;
  }): Promise<void> {
    return this.deviceManager.setVideoEncoderConfiguration({
      width: params.config.dimensions?.width,
      height: params.config.dimensions?.height,
      frameRate: params.config.frameRate,
      bitrateMin: params.config.minBitrate,
      bitrateMax: params.config.bitrate,
    });
  }

  private async setupLocalVideo(
    params: { canvas: VideoCanvas },
    element?: HTMLElement
  ): Promise<void> {
    const { canvas } = params;
    if (element !== undefined) {
      canvas.view = element;
    }
    const channel = this.channel.getChannel(canvas.channelId);
    if (channel !== undefined) {
      channel.deviceManager.setupLocalVideo(canvas);
    } else {
      this.deviceManager.setupLocalVideo(canvas);
    }
  }

  private async setupRemoteVideo(
    params: { canvas: VideoCanvas },
    element?: HTMLElement
  ): Promise<void> {
    const { canvas } = params;
    if (element !== undefined) {
      canvas.view = element;
    }
    const channel = this.channel.getChannel(canvas.channelId);
    if (channel !== undefined) {
      channel.deviceManager.setupRemoteVideo(canvas.uid, canvas);
    } else {
      this.deviceManager.setupRemoteVideo(canvas.uid, canvas);
    }
  }

  private async startPreview(_?: {}): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (this._client.channelName !== undefined) return;
    await this.deviceManager.createCameraVideoTrack(
      this._enableVideo && this._enableLocalVideo,
      this._emitEvent.bind(this),
      true
    );
  }

  private async stopPreview(_?: {}): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    if (this._client.channelName !== undefined) return;
    return this.deviceManager.stopCameraCapture();
  }

  private async enableAudio(_?: {}): Promise<void> {
    this._enableAudio = true;
    await Promise.all([
      this.deviceManager.enableLocalAudio(
        this._enableAudio && this._enableLocalAudio
      ),
      this.deviceManager.enableRemoteAudio(this._enableAudio),
    ]);
  }

  private async enableLocalAudio(params: { enabled: boolean }): Promise<void> {
    this._enableLocalAudio = params.enabled;
    return this.deviceManager.enableLocalAudio(
      this._enableAudio && this._enableLocalAudio
    );
  }

  private async disableAudio(_?: {}): Promise<void> {
    this._enableAudio = false;
    await Promise.all([
      this.deviceManager.enableLocalAudio(
        this._enableAudio && this._enableLocalAudio
      ),
      this.deviceManager.enableRemoteAudio(this._enableAudio),
    ]);
  }

  private async setAudioProfile(params: {
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
    this.deviceManager.setAudioEncoderConfiguration(preset);
  }

  public async muteLocalAudioStream(params: { mute: boolean }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    this._muteLocalAudio = params.mute;
    return this.deviceManager.muteLocalAudio(this._muteLocalAudio);
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
    await this.deviceManager.adjustUserPlaybackSignalVolume(
      params.uid,
      params.volume
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
          this.deviceManager.addRemoteAudioTrack(track);
          track.play();
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
    return this.deviceManager.muteLocalVideo(this._muteLocalVideo);
  }

  private async enableLocalVideo(params: { enabled: boolean }): Promise<void> {
    this._enableLocalVideo = params.enabled;
    return this.deviceManager.enableLocalVideo(
      this._enableVideo && this._enableLocalVideo
    );
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
          this.deviceManager.addRemoteVideoTrack(track);
          this.deviceManager.playRemoteVideo(user.uid);
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

  private async enableAudioVolumeIndication(_: {
    interval: number;
    smooth: number;
    report_vad: number;
  }): Promise<void> {
    if (this._client === undefined) {
      throw 'please create first';
    }
    return this._client.enableAudioVolumeIndicator();
  }

  private async setLogFilter(params: {
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

  private async uploadLogFile(): Promise<string> {
    // TODO
    AgoraRTC.enableLogUpload();
    return '';
  }

  private async enableDualStreamMode(params: {
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

  private async adjustRecordingSignalVolume(params: {
    volume: number;
  }): Promise<void> {
    return this.deviceManager.adjustRecordingSignalVolume(params.volume);
  }

  private async adjustPlaybackSignalVolume(params: {
    volume: number;
  }): Promise<void> {
    await this.deviceManager.adjustPlaybackSignalVolume(params.volume);
  }

  private async startScreenCaptureByDisplayId(params: {
    displayId?: number;
    regionRect?: Rectangle;
    captureParams?: ScreenCaptureParameters;
  }): Promise<void> {
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        this._emitEvent.bind(this),
        params.captureParams,
        true
      )
      .then((track) => {
        if (this._muteLocalVideo) return;
        this._publish(track);
      });
  }

  private async startScreenCaptureByScreenRect(params: {
    screenRect?: Rectangle;
    regionRect?: Rectangle;
    captureParams?: ScreenCaptureParameters;
  }): Promise<void> {
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        this._emitEvent.bind(this),
        params.captureParams,
        true
      )
      .then((track) => {
        if (this._muteLocalVideo) return;
        this._publish(track);
      });
  }

  private async startScreenCaptureByWindowId(params: {
    windowId?: number;
    regionRect?: Rectangle;
    captureParams?: ScreenCaptureParameters;
  }): Promise<void> {
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        this._emitEvent.bind(this),
        params.captureParams,
        true
      )
      .then((track) => {
        if (this._muteLocalVideo) return;
        this._publish(track);
      });
  }

  private async stopScreenCapture(_?: {}): Promise<void> {
    return this.deviceManager.stopScreenCapture();
  }

  private async startScreenCapture(params: {
    windowId?: number;
    captureFreq?: number;
    rect?: Rect;
    bitrate?: number;
  }): Promise<void> {
    const { rect } = params;
    return this.deviceManager
      .createScreenVideoTrack(
        this._enableVideo && this._enableLocalVideo,
        this._emitEvent.bind(this),
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

  private async setRemoteSubscribeFallbackOption(params: {
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

  private async getVersion(): Promise<string> {
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

  private async setBeautyEffectOptions(params: {
    enabled: boolean;
    options: BeautyOptions;
  }): Promise<void> {
    return this.deviceManager.setBeautyEffect(params.enabled, {
      smoothnessLevel: params.options.smoothnessLevel,
      lighteningLevel: params.options.lighteningLevel,
      rednessLevel: params.options.rednessLevel,
      lighteningContrastLevel: params.options.lighteningContrastLevel,
    });
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

  private async sendCustomReportMessage(params: {
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

  private async setParameters(params: { parameters: string }): Promise<void> {
    const obj = JSON.parse(params.parameters);
    const key = Object.keys(obj)[0];
    return AgoraRTC.setParameter(key, obj[key]);
  }

  private async setAppType(params: { appType: number }): Promise<void> {
    return this.setParameters({
      parameters: `{"REPORT_APP_SCENARIO":${params.appType.toString()}}`,
    });
  }

  private async setCloudProxy(params: {
    proxyType: CLOUD_PROXY_TYPE;
  }): Promise<void> {
    let mode: number = 0;
    switch (params.proxyType) {
      case CLOUD_PROXY_TYPE.NONE_PROXY:
        mode = 0;
        break;
      case CLOUD_PROXY_TYPE.UDP_PROXY:
        mode = 3;
        break;
      case CLOUD_PROXY_TYPE.TCP_PROXY:
        mode = 5;
        break;
    }
    return this._client?.startProxyServer(mode);
  }
}
