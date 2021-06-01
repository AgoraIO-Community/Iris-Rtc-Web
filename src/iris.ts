import {
  AREAS,
  AudienceLatencyLevelType,
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
  ILocalAudioTrack,
  ILocalTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  NetworkQuality,
  RemoteStreamFallbackType,
  RemoteStreamType,
  SDK_MODE,
  UID,
} from 'agora-rtc-sdk-ng';
import {
  ApiTypeEngine,
  AREA_CODE,
  AUDIENCE_LATENCY_LEVEL_TYPE,
  BeautyOptions,
  CHANNEL_MEDIA_RELAY_ERROR,
  CHANNEL_MEDIA_RELAY_EVENT,
  CHANNEL_MEDIA_RELAY_STATE,
  CHANNEL_PROFILE_TYPE,
  ChannelMediaOptions,
  ChannelMediaRelayConfiguration,
  CLIENT_ROLE_TYPE,
  ClientRoleOptions,
  CONNECTION_CHANGED_REASON_TYPE,
  CONNECTION_STATE_TYPE,
  ENCRYPTION_MODE,
  EncryptionConfig,
  ERROR_CODE_TYPE,
  INJECT_STREAM_STATUS,
  InjectStreamConfig,
  LiveTranscoding,
  LOG_FILTER_TYPE,
  LOG_LEVEL,
  QUALITY_TYPE,
  REMOTE_AUDIO_STATE,
  REMOTE_AUDIO_STATE_REASON,
  REMOTE_VIDEO_STATE,
  REMOTE_VIDEO_STATE_REASON,
  REMOTE_VIDEO_STREAM_TYPE,
  RENDER_MODE_TYPE,
  RtcEngineContext,
  RtcStats,
  RTMP_STREAM_PUBLISH_ERROR,
  RTMP_STREAM_PUBLISH_STATE,
  RTMP_STREAMING_EVENT,
  STREAM_FALLBACK_OPTIONS,
  USER_OFFLINE_REASON_TYPE,
  VIDEO_MIRROR_MODE_TYPE,
  VideoCanvas,
  VideoEncoderConfiguration,
} from './types.native';

function printf(tag: string, ...params: any[]) {
  console.log('agora-iris', tag, ...params);
}

namespace iris {
  const AgoraRTC = require('agora-rtc-sdk-ng');

  export class IrisRtcEngine {
    private _mode: SDK_MODE;
    private _client?: IAgoraRTCClient;
    private _appId?: string;
    private handler?: (event: string, data: string) => {};
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
    private _localAudioTrack?: ILocalAudioTrack;
    private _localVideoTrack?: ILocalVideoTrack;
    private _remoteAudioTracks: IRemoteAudioTrack[] = [];
    private _remoteVideoTracks: IRemoteVideoTrack[] = [];
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
      [ApiTypeEngine.kEngineGetVersion]: this.getVersion,
      [ApiTypeEngine.kEngineSetEncryptionSecret]: this.setEncryptionSecret,
      [ApiTypeEngine.kEngineSetEncryptionMode]: this.setEncryptionMode,
      [ApiTypeEngine.kEngineEnableEncryption]: this.enableEncryption,
      [ApiTypeEngine.kEngineAddPublishStreamUrl]: this.addPublishStreamUrl,
      [ApiTypeEngine.kEngineRemovePublishStreamUrl]:
        this.removePublishStreamUrl,
      [ApiTypeEngine.kEngineSetLiveTranscoding]: this.setLiveTranscoding,
      [ApiTypeEngine.kEngineSetBeautyEffectOptions]:
        this.setBeautyEffectOptions,
      [ApiTypeEngine.kEngineAddInjectStreamUrl]: this.addInjectStreamUrl,
      [ApiTypeEngine.kEngineStartChannelMediaRelay]:
        this.startChannelMediaRelay,
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
              this._remoteAudioTracks = this._remoteAudioTracks.filter(
                (track) => track.getUserId() !== user.uid
              );
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
              this._remoteVideoTracks = this._remoteVideoTracks.filter(
                (track) => track.getUserId() !== user.uid
              );
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
      printf('_emitEvent', methodName, data, this.handler);
      this.handler?.call(this, methodName, JSON.stringify(data));
    }

    private _createClient() {
      this._client = AgoraRTC.createClient({ codec: 'h264', mode: this._mode });
      this._addListener();
    }

    private async _createMicrophoneAudioTrack() {
      if (!this._enableAudio) {
        printf('_createMicrophoneAudioTrack', this._enableAudio);
        return;
      }
      if (this._localAudioTrack === undefined) {
        this._localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      }
    }

    private async _createCameraVideoTrack() {
      if (!this._enableVideo) {
        printf('_createCameraVideoTrack', this._enableVideo);
        return;
      }
      if (this._localVideoTrack === undefined) {
        this._localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      }
    }

    private async _createScreenVideoTrack() {
      if (!this._enableVideo) {
        printf('_createScreenVideoTrack', this._enableVideo);
        return;
      }
      if (this._localVideoTrack === undefined) {
        this._localVideoTrack = await AgoraRTC.createScreenVideoTrack(
          {},
          'disable'
        );
      }
    }

    private async _setLogLevel(params: { level?: LOG_LEVEL }): Promise<void> {
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

    private async _setArea(code?: AREA_CODE): Promise<void> {
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
        return AgoraRTC.setArea([areaCode]);
      }
    }

    private async _publish() {
      if (this._client === undefined) {
        throw 'please create first';
      }
      const tracks: ILocalTrack[] = [];
      if (this._localAudioTrack !== undefined) {
        if (!this._muteLocalAudio) {
          tracks.push(this._localAudioTrack);
        }
      }
      if (this._localVideoTrack !== undefined) {
        if (!this._muteLocalVideo) {
          tracks.push(this._localVideoTrack);
        }
      }
      await this._client.publish(tracks);
    }

    public async callApi(
      apiType: ApiTypeEngine,
      params: string,
      extra?: any
    ): Promise<void> {
      printf('callApi', apiType, params, extra, this);
      return this._support_apis[apiType]?.call(this, JSON.parse(params), extra);
    }

    public setEventHandler(handler: (event: string) => {}) {
      this.handler = handler;
    }

    public async initialize(params: {
      context: RtcEngineContext;
    }): Promise<void> {
      this._appId = params.context.appId;
      await this._setArea(params.context.areaCode);
      await this._setLogLevel({ level: params.context.logConfig?.level });
      this._createClient();
    }

    public async release(): Promise<void> {
      await this.leaveChannel({});
      this._localAudioTrack?.close();
      this._localAudioTrack = undefined;
      this._localVideoTrack?.close();
      this._localVideoTrack = undefined;
      this._client = undefined;
      this._appId = undefined;
      this.handler = undefined;
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
      if (this._appId === undefined) {
        throw 'please create first';
      }
      const { channelId, token, uid } = params;
      return this._client
        ?.join(this._appId, channelId, token, uid)
        .then(async (id) => {
          await this._createMicrophoneAudioTrack();
          await this._createCameraVideoTrack();
          await this._publish();
          this._emitEvent('JoinChannelSuccess', {
            channel: channelId,
            uid: id,
            elapsed: 0,
          });
        });
    }

    public async leaveChannel(_: {}): Promise<void> {
      if (this._client === undefined) {
        throw 'please create first';
      }
      return this._client.leave().then(() => {
        this._remoteAudioTracks = [];
        this._remoteVideoTracks = [];
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
      if (this._appId === undefined) {
        throw 'please create first';
      }
      const { channelId, token, userAccount } = params;
      return this._client
        ?.join(this._appId, channelId, token, userAccount)
        .then(async (id) => {
          await this._createMicrophoneAudioTrack();
          await this._createCameraVideoTrack();
          await this._publish();
          this._emitEvent('JoinChannelSuccess', {
            channel: channelId,
            uid: id,
            elapsed: 0,
          });
        });
    }

    public async enableVideo(_: {}): Promise<void> {
      this._enableVideo = true;
      await Promise.all([
        this.enableLocalVideo({ enabled: true }),
        // TODO
        this._remoteVideoTracks.map((track) => {
          return track.play('');
        }),
      ]);
    }

    public async disableVideo(_: {}): Promise<void> {
      this._enableVideo = false;
      await Promise.all([
        this.enableLocalVideo({ enabled: false }),
        // TODO
        this._remoteVideoTracks.map((track) => {
          return track.stop();
        }),
      ]);
    }

    public async setVideoEncoderConfiguration(params: {
      config: VideoEncoderConfiguration;
    }): Promise<void> {
      const func = (this._localVideoTrack as ICameraVideoTrack | undefined)
        ?.setEncoderConfiguration;
      if (func !== undefined) {
        await func({
          width: params.config.dimensions.width,
          height: params.config.dimensions.height,
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
      let fit: 'cover' | 'contain' | 'fill';
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
      this._localVideoTrack?.play(element ?? params.canvas.view, {
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
      await Promise.all(
        this._remoteVideoTracks.map((track) => {
          if (track.getUserId() === params.canvas.uid) {
            printf('setupRemoteVideo', track, params, element);
            let fit: 'cover' | 'contain' | 'fill';
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

    public async startPreview(_: {}): Promise<void> {
      if (this._client === undefined) {
        throw 'please create first';
      }
      if (!this._enableVideo) return;
      if (this._client.channelName !== undefined) return;
      await this._createCameraVideoTrack();
    }

    public async stopPreview(_: {}): Promise<void> {
      if (this._client === undefined) {
        throw 'please create first';
      }
      if (this._client.channelName !== undefined) return;
      if (this._localVideoTrack !== undefined) {
        await this._localVideoTrack.close();
        this._localVideoTrack = undefined;
      }
    }

    public async enableAudio(_: {}): Promise<void> {
      this._enableAudio = true;
      await Promise.all([
        this.enableLocalAudio({ enabled: true }),
        // TODO
        this._remoteAudioTracks.map((track) => {
          return track.play();
        }),
      ]);
    }

    public async enableLocalAudio(params: { enabled: boolean }): Promise<void> {
      return this._localAudioTrack?.setEnabled(params.enabled);
    }

    public async disableAudio(_: {}): Promise<void> {
      this._enableAudio = false;
      await Promise.all([
        this.enableLocalAudio({ enabled: false }),
        // TODO
        this._remoteAudioTracks.map((track) => {
          return track.stop();
        }),
      ]);
    }

    public async muteLocalAudioStream(params: {
      mute: boolean;
    }): Promise<void> {
      if (this._client === undefined) {
        throw 'please create first';
      }
      this._muteLocalAudio = params.mute;
      if (this._localAudioTrack === undefined) {
        throw 'localAudioTrack not init';
      }
      if (params.mute) {
        return this._client.unpublish(this._localAudioTrack);
      } else {
        return this._client.publish(this._localAudioTrack);
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
        this._remoteAudioTracks.map((track) => {
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
            this._remoteAudioTracks.push(track);
          });
        } else {
          return this._client.unsubscribe(user, 'audio').then(() => {
            this._remoteAudioTracks = this._remoteAudioTracks.filter(
              (track) => track.getUserId() !== user.uid
            );
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

    public async muteLocalVideoStream(params: {
      mute: boolean;
    }): Promise<void> {
      if (this._client === undefined) {
        throw 'please create first';
      }
      this._muteLocalVideo = params.mute;
      if (this._localVideoTrack === undefined) {
        throw 'localVideoTrack not init';
      }
      if (!params.mute) {
        return this._client.publish(this._localVideoTrack);
      } else {
        return this._client.unpublish(this._localVideoTrack);
      }
    }

    public async enableLocalVideo(params: { enabled: boolean }): Promise<void> {
      await this._localVideoTrack?.setEnabled(params.enabled);
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
            this._remoteVideoTracks.push(track);
          });
        } else {
          return this._client.unsubscribe(user, 'video').then(() => {
            this._remoteVideoTracks = this._remoteVideoTracks.filter(
              (track) => track.getUserId() !== user.uid
            );
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
      return this._localAudioTrack?.setVolume(params.volume);
    }

    public async adjustPlaybackSignalVolume(params: {
      volume: number;
    }): Promise<void> {
      await Promise.all(
        this._remoteAudioTracks.map((track) => {
          return track.setVolume(params.volume);
        })
      );
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

    public async setEncryptionSecret(params: {
      secret: string;
    }): Promise<void> {
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
      let encryptionMode: EncryptionMode;
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

    public async removePublishStreamUrl(params: {
      url: string;
    }): Promise<void> {
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
      const func = (this._localVideoTrack as ICameraVideoTrack | undefined)
        ?.setBeautyEffect;
      if (func !== undefined) {
        await func(params.enabled, {
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

    public async stopChannelMediaRelay(_: {}): Promise<void> {
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

    public async getConnectionState(_: {}): Promise<CONNECTION_STATE_TYPE> {
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

  function ConnectionStateToNative(
    state?: ConnectionState
  ): CONNECTION_STATE_TYPE {
    switch (state) {
      case 'DISCONNECTED':
        return CONNECTION_STATE_TYPE.CONNECTION_STATE_DISCONNECTED;
      case 'CONNECTING':
        return CONNECTION_STATE_TYPE.CONNECTION_STATE_CONNECTING;
      case 'RECONNECTING':
        return CONNECTION_STATE_TYPE.CONNECTION_STATE_RECONNECTING;
      case 'CONNECTED':
        return CONNECTION_STATE_TYPE.CONNECTION_STATE_CONNECTED;
      case 'DISCONNECTING':
      default:
        return CONNECTION_STATE_TYPE.CONNECTION_STATE_DISCONNECTED;
    }
  }

  function ConnectionDisconnectedReasonToNative(
    reason?: ConnectionDisconnectedReason
  ): CONNECTION_CHANGED_REASON_TYPE {
    switch (reason) {
      case ConnectionDisconnectedReason.LEAVE:
        return CONNECTION_CHANGED_REASON_TYPE.CONNECTION_CHANGED_LEAVE_CHANNEL;
      case ConnectionDisconnectedReason.NETWORK_ERROR:
      case ConnectionDisconnectedReason.SERVER_ERROR:
        return CONNECTION_CHANGED_REASON_TYPE.CONNECTION_CHANGED_INTERRUPTED;
      case ConnectionDisconnectedReason.UID_BANNED:
        return CONNECTION_CHANGED_REASON_TYPE.CONNECTION_CHANGED_REJECTED_BY_SERVER;
      case ConnectionDisconnectedReason.IP_BANNED:
      case ConnectionDisconnectedReason.CHANNEL_BANNED:
        return CONNECTION_CHANGED_REASON_TYPE.CONNECTION_CHANGED_BANNED_BY_SERVER;
      default:
        return CONNECTION_CHANGED_REASON_TYPE.CONNECTION_CHANGED_JOIN_SUCCESS;
    }
  }

  function UserLeftReasonToNative(reason?: string): USER_OFFLINE_REASON_TYPE {
    switch (reason) {
      case 'Quit':
        return USER_OFFLINE_REASON_TYPE.USER_OFFLINE_QUIT;
      case 'ServerTimeOut':
        return USER_OFFLINE_REASON_TYPE.USER_OFFLINE_DROPPED;
      case 'BecomeAudience':
        return USER_OFFLINE_REASON_TYPE.USER_OFFLINE_BECOME_AUDIENCE;
      default:
        return USER_OFFLINE_REASON_TYPE.USER_OFFLINE_QUIT;
    }
  }

  function NetworkQualityToNative(
    quality: 0 | 1 | 2 | 3 | 4 | 5 | 6
  ): QUALITY_TYPE {
    switch (quality) {
      case 0:
        return QUALITY_TYPE.QUALITY_UNKNOWN;
      case 1:
        return QUALITY_TYPE.QUALITY_EXCELLENT;
      case 2:
        return QUALITY_TYPE.QUALITY_GOOD;
      case 3:
        return QUALITY_TYPE.QUALITY_POOR;
      case 4:
        return QUALITY_TYPE.QUALITY_BAD;
      case 5:
        return QUALITY_TYPE.QUALITY_VBAD;
      case 6:
        return QUALITY_TYPE.QUALITY_DOWN;
    }
  }

  function RtmpStreamingErrorToNative(code: string): RTMP_STREAM_PUBLISH_ERROR {
    switch (code) {
      case 'LIVE_STREAMING_INVALID_ARGUMENT':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_INVALID_ARGUMENT;
      case 'LIVE_STREAMING_INTERNAL_SERVER_ERROR':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_INTERNAL_SERVER_ERROR;
      case 'LIVE_STREAMING_PUBLISH_STREAM_NOT_AUTHORIZED':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_NOT_AUTHORIZED;
      case 'LIVE_STREAMING_TRANSCODING_NOT_SUPPORTED':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_FORMAT_NOT_SUPPORTED;
      case 'LIVE_STREAMING_CDN_ERROR':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_RTMP_SERVER_ERROR;
      case 'LIVE_STREAMING_INVALID_RAW_STREAM':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_CONNECTION_TIMEOUT;
      case 'LIVE_STREAMING_WARN_STREAM_NUM_REACH_LIMIT':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_REACH_LIMIT;
      case 'LIVE_STREAMING_WARN_FREQUENT_REQUEST':
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_TOO_OFTEN;
      default:
        return RTMP_STREAM_PUBLISH_ERROR.RTMP_STREAM_PUBLISH_ERROR_OK;
    }
  }

  function InjectStreamEventStatusToNative(
    status: number
  ): INJECT_STREAM_STATUS {
    switch (status) {
      case 0:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_START_SUCCESS;
      case 1:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_START_ALREADY_EXISTS;
      case 2:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_START_UNAUTHORIZED;
      case 3:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_START_TIMEDOUT;
      case 4:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_START_FAILED;
      case 5:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_STOP_SUCCESS;
      case 6:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_STOP_NOT_FOUND;
      case 7:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_STOP_UNAUTHORIZED;
      case 8:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_STOP_TIMEDOUT;
      case 9:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_STOP_FAILED;
      case 10:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_BROKEN;
      default:
        return INJECT_STREAM_STATUS.INJECT_STREAM_STATUS_START_UNAUTHORIZED;
    }
  }

  function ChannelMediaRelayStateToNative(
    state: ChannelMediaRelayState
  ): CHANNEL_MEDIA_RELAY_STATE {
    switch (state) {
      case ChannelMediaRelayState.RELAY_STATE_IDLE:
        return CHANNEL_MEDIA_RELAY_STATE.RELAY_STATE_IDLE;
      case ChannelMediaRelayState.RELAY_STATE_CONNECTING:
        return CHANNEL_MEDIA_RELAY_STATE.RELAY_STATE_CONNECTING;
      case ChannelMediaRelayState.RELAY_STATE_RUNNING:
        return CHANNEL_MEDIA_RELAY_STATE.RELAY_STATE_RUNNING;
      case ChannelMediaRelayState.RELAY_STATE_FAILURE:
        return CHANNEL_MEDIA_RELAY_STATE.RELAY_STATE_FAILURE;
    }
  }

  function ChannelMediaRelayErrorToNative(
    error: ChannelMediaRelayError
  ): CHANNEL_MEDIA_RELAY_ERROR {
    switch (error) {
      case ChannelMediaRelayError.RELAY_OK:
        return CHANNEL_MEDIA_RELAY_ERROR.RELAY_OK;
      case ChannelMediaRelayError.SERVER_CONNECTION_LOST:
        return CHANNEL_MEDIA_RELAY_ERROR.RELAY_ERROR_SERVER_CONNECTION_LOST;
      case ChannelMediaRelayError.SRC_TOKEN_EXPIRED:
        return CHANNEL_MEDIA_RELAY_ERROR.RELAY_ERROR_SRC_TOKEN_EXPIRED;
      case ChannelMediaRelayError.DEST_TOKEN_EXPIRED:
        return CHANNEL_MEDIA_RELAY_ERROR.RELAY_ERROR_DEST_TOKEN_EXPIRED;
    }
  }

  function ChannelMediaRelayEventToNative(
    event: ChannelMediaRelayEvent
  ): CHANNEL_MEDIA_RELAY_EVENT {
    switch (event) {
      case ChannelMediaRelayEvent.NETWORK_DISCONNECTED:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_NETWORK_DISCONNECTED;
      case ChannelMediaRelayEvent.NETWORK_CONNECTED:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_NETWORK_CONNECTED;
      case ChannelMediaRelayEvent.PACKET_JOINED_SRC_CHANNEL:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_JOINED_SRC_CHANNEL;
      case ChannelMediaRelayEvent.PACKET_JOINED_DEST_CHANNEL:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_JOINED_DEST_CHANNEL;
      case ChannelMediaRelayEvent.PACKET_SENT_TO_DEST_CHANNEL:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_SENT_TO_DEST_CHANNEL;
      case ChannelMediaRelayEvent.PACKET_RECEIVED_VIDEO_FROM_SRC:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_RECEIVED_VIDEO_FROM_SRC;
      case ChannelMediaRelayEvent.PACKET_RECEIVED_AUDIO_FROM_SRC:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_RECEIVED_AUDIO_FROM_SRC;
      case ChannelMediaRelayEvent.PACKET_UPDATE_DEST_CHANNEL:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_UPDATE_DEST_CHANNEL;
      case ChannelMediaRelayEvent.PACKET_UPDATE_DEST_CHANNEL_REFUSED:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_UPDATE_DEST_CHANNEL_REFUSED;
      case ChannelMediaRelayEvent.PACKET_UPDATE_DEST_CHANNEL_NOT_CHANGE:
        return CHANNEL_MEDIA_RELAY_EVENT.RELAY_EVENT_PACKET_UPDATE_DEST_CHANNEL_NOT_CHANGE;
    }
  }
}

export default iris.IrisRtcEngine;
