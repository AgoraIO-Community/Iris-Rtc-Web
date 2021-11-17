import IrisRtcEngine from './IrisRtcEngine';
import {
  ApiTypeChannel,
  ChannelMediaOptions,
  ChannelMediaRelayConfiguration,
  CLIENT_ROLE_TYPE,
  ClientRoleOptions,
  CONNECTION_STATE_TYPE,
  EncryptionConfig,
  InjectStreamConfig,
  LiveTranscoding,
  REMOTE_VIDEO_STREAM_TYPE,
} from './types.native';
import { printf } from './utils';
import { UID } from 'agora-rtc-sdk-ng';

export default class IrisRtcChannel {
  private _engine: IrisRtcEngine;
  private _handler?: (event: string, data: string) => void;
  private _channels = new Map<string, IrisRtcEngine>();
  private _support_apis = {
    [ApiTypeChannel.kChannelCreateChannel]: this.createChannel,
    [ApiTypeChannel.kChannelRelease]: this.release,
    [ApiTypeChannel.kChannelJoinChannel]: this.joinChannel,
    [ApiTypeChannel.kChannelJoinChannelWithUserAccount]:
      this.joinChannelWithUserAccount,
    [ApiTypeChannel.kChannelLeaveChannel]: this.leaveChannel,
    [ApiTypeChannel.kChannelPublish]: this.publish,
    [ApiTypeChannel.kChannelUnPublish]: this.unPublish,
    [ApiTypeChannel.kChannelChannelId]: this.channelId,
    [ApiTypeChannel.kChannelRenewToken]: this.renewToken,
    [ApiTypeChannel.kChannelSetEncryptionSecret]: this.setEncryptionSecret,
    [ApiTypeChannel.kChannelSetEncryptionMode]: this.setEncryptionMode,
    [ApiTypeChannel.kChannelEnableEncryption]: this.enableEncryption,
    [ApiTypeChannel.kChannelSetClientRole]: this.setClientRole,
    [ApiTypeChannel.kChannelSetDefaultMuteAllRemoteAudioStreams]:
      this.setDefaultMuteAllRemoteAudioStreams,
    [ApiTypeChannel.kChannelSetDefaultMuteAllRemoteVideoStreams]:
      this.setDefaultMuteAllRemoteVideoStreams,
    [ApiTypeChannel.kChannelMuteLocalAudioStream]: this.muteLocalAudioStream,
    [ApiTypeChannel.kChannelMuteLocalVideoStream]: this.muteLocalVideoStream,
    [ApiTypeChannel.kChannelMuteAllRemoteAudioStreams]:
      this.muteAllRemoteAudioStreams,
    [ApiTypeChannel.kChannelAdjustUserPlaybackSignalVolume]:
      this.adjustUserPlaybackSignalVolume,
    [ApiTypeChannel.kChannelMuteRemoteAudioStream]: this.muteRemoteAudioStream,
    [ApiTypeChannel.kChannelMuteAllRemoteVideoStreams]:
      this.muteAllRemoteVideoStreams,
    [ApiTypeChannel.kChannelMuteRemoteVideoStream]: this.muteRemoteVideoStream,
    [ApiTypeChannel.kChannelSetRemoteVideoStreamType]:
      this.setRemoteVideoStreamType,
    [ApiTypeChannel.kChannelSetRemoteDefaultVideoStreamType]:
      this.setRemoteDefaultVideoStreamType,
    [ApiTypeChannel.kChannelAddPublishStreamUrl]: this.addPublishStreamUrl,
    [ApiTypeChannel.kChannelRemovePublishStreamUrl]:
      this.removePublishStreamUrl,
    [ApiTypeChannel.kChannelSetLiveTranscoding]: this.setLiveTranscoding,
    [ApiTypeChannel.kChannelAddInjectStreamUrl]: this.addInjectStreamUrl,
    [ApiTypeChannel.kChannelRemoveInjectStreamUrl]: this.removeInjectStreamUrl,
    [ApiTypeChannel.kChannelStartChannelMediaRelay]:
      this.startChannelMediaRelay,
    [ApiTypeChannel.kChannelUpdateChannelMediaRelay]:
      this.updateChannelMediaRelay,
    [ApiTypeChannel.kChannelStopChannelMediaRelay]: this.stopChannelMediaRelay,
    [ApiTypeChannel.kChannelGetConnectionState]: this.getConnectionState,
  };

  constructor(engine: IrisRtcEngine) {
    this._engine = engine;
  }

  /**
   * Iris callApi for channel
   * @param apiType
   * @param params
   * @param extra
   */
  public async callApi(
    apiType: ApiTypeChannel,
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

  public getChannel(channelId: string): IrisRtcEngine | undefined {
    return this._channels.get(channelId);
  }

  private async createChannel(params: { channelId: string }): Promise<void> {
    const { channelId } = params;
    if (this._channels.has(channelId)) {
      return;
    }
    const channel = await this._engine.createChannel();
    channel.setEventHandler((event, data) => {
      this._handler?.call(
        this,
        event,
        JSON.stringify({
          ...JSON.parse(data),
          channelId,
        })
      );
    });
    this._channels.set(channelId, channel);
  }

  private async release(params: { channelId: string }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    this._channels.get(channelId)!.release();
    this._channels.delete(channelId);
  }

  private async joinChannel(params: {
    channelId: string;
    token: string | null;
    info?: string;
    uid: UID;
    options?: ChannelMediaOptions;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { token, info, uid, options } = params;
    return this._channels
      .get(channelId)
      ?.joinChannel({ token, channelId, info, uid, options });
  }

  private async joinChannelWithUserAccount(params: {
    token: string | null;
    channelId: string;
    userAccount: string;
    options?: ChannelMediaOptions;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { token, userAccount, options } = params;
    return this._channels
      .get(channelId)
      ?.joinChannelWithUserAccount({ token, channelId, userAccount, options });
  }

  private async leaveChannel(params: { channelId: string }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    return this._channels.get(channelId)!.leaveChannel();
  }

  private async publish(params: { channelId: string }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    await this._channels.get(channelId)!.muteLocalAudioStream({ mute: false });
    await this._channels.get(channelId)!.muteLocalVideoStream({ mute: false });
  }

  private async unPublish(params: { channelId: string }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    await this._channels.get(channelId)!.muteLocalAudioStream({ mute: true });
    await this._channels.get(channelId)!.muteLocalVideoStream({ mute: true });
  }

  private channelId(params: { channelId: string }): string {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    return channelId;
  }

  private async renewToken(params: {
    channelId: string;
    token: string;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { token } = params;
    return this._channels.get(channelId)!.renewToken({ token });
  }

  private async setEncryptionSecret(params: {
    channelId: string;
    secret: string;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { secret } = params;
    return this._channels.get(channelId)!.setEncryptionSecret({ secret });
  }

  private async setEncryptionMode(params: {
    channelId: string;
    encryptionMode:
      | 'aes-128-xts'
      | 'aes-256-xts'
      | 'aes-128-ecb'
      | 'sm4-128-ecb'
      | 'aes-128-gcm'
      | 'aes-256-gcm'
      | 'none';
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { encryptionMode } = params;
    return this._channels.get(channelId)!.setEncryptionMode({ encryptionMode });
  }

  private async enableEncryption(params: {
    channelId: string;
    enabled: boolean;
    config: EncryptionConfig;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { enabled, config } = params;
    return this._channels.get(channelId)!.enableEncryption({ enabled, config });
  }

  private async setClientRole(params: {
    channelId: string;
    role: CLIENT_ROLE_TYPE;
    options?: ClientRoleOptions;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { role, options } = params;
    return this._channels.get(channelId)!.setClientRole({ role, options });
  }

  private async setDefaultMuteAllRemoteAudioStreams(params: {
    channelId: string;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { mute } = params;
    return this._channels
      .get(channelId)
      ?.setDefaultMuteAllRemoteAudioStreams({ mute });
  }

  private async setDefaultMuteAllRemoteVideoStreams(params: {
    channelId: string;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { mute } = params;
    return this._channels
      .get(channelId)
      ?.setDefaultMuteAllRemoteVideoStreams({ mute });
  }

  private async muteLocalAudioStream(params: {
    channelId: string;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { mute } = params;
    return this._channels.get(channelId)!.muteLocalAudioStream({ mute });
  }

  private async muteLocalVideoStream(params: {
    channelId: string;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { mute } = params;
    return this._channels.get(channelId)!.muteLocalVideoStream({ mute });
  }

  private async muteAllRemoteAudioStreams(params: {
    channelId: string;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { mute } = params;
    return this._channels.get(channelId)!.muteAllRemoteAudioStreams({ mute });
  }

  private async adjustUserPlaybackSignalVolume(params: {
    channelId: string;
    uid: number;
    volume: number;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { uid, volume } = params;
    return this._channels
      .get(channelId)
      ?.adjustUserPlaybackSignalVolume({ uid, volume });
  }

  private async muteRemoteAudioStream(params: {
    channelId: string;
    userId: number;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { userId, mute } = params;
    return this._channels
      .get(channelId)
      ?.muteRemoteAudioStream({ userId, mute });
  }

  private async muteAllRemoteVideoStreams(params: {
    channelId: string;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { mute } = params;
    return this._channels.get(channelId)!.muteAllRemoteVideoStreams({ mute });
  }

  private async muteRemoteVideoStream(params: {
    channelId: string;
    userId: number;
    mute: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { userId, mute } = params;
    return this._channels
      .get(channelId)
      ?.muteRemoteVideoStream({ userId, mute });
  }

  private async setRemoteVideoStreamType(params: {
    channelId: string;
    userId: UID;
    streamType: REMOTE_VIDEO_STREAM_TYPE;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { userId, streamType } = params;
    return this._channels
      .get(channelId)
      ?.setRemoteVideoStreamType({ userId, streamType });
  }

  private async setRemoteDefaultVideoStreamType(params: {
    channelId: string;
    streamType: REMOTE_VIDEO_STREAM_TYPE;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { streamType } = params;
    return this._channels
      .get(channelId)
      ?.setRemoteDefaultVideoStreamType({ streamType });
  }

  private async addPublishStreamUrl(params: {
    channelId: string;
    url: string;
    transcodingEnabled: boolean;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { url, transcodingEnabled } = params;
    return this._channels
      .get(channelId)
      ?.addPublishStreamUrl({ url, transcodingEnabled });
  }

  private async removePublishStreamUrl(params: {
    channelId: string;
    url: string;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { url } = params;
    return this._channels.get(channelId)!.removePublishStreamUrl({ url });
  }

  private async setLiveTranscoding(params: {
    channelId: string;
    transcoding: LiveTranscoding;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { transcoding } = params;
    return this._channels.get(channelId)!.setLiveTranscoding({ transcoding });
  }

  private async addInjectStreamUrl(params: {
    channelId: string;
    url: string;
    config: InjectStreamConfig;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { url, config } = params;
    return this._channels.get(channelId)!.addInjectStreamUrl({ url, config });
  }

  private async removeInjectStreamUrl(params: {
    channelId: string;
    url: string;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { url } = params;
    return this._channels.get(channelId)!.removeInjectStreamUrl({ url });
  }

  private async startChannelMediaRelay(params: {
    channelId: string;
    configuration: ChannelMediaRelayConfiguration;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { configuration } = params;
    return this._channels
      .get(channelId)
      ?.startChannelMediaRelay({ configuration });
  }

  private async updateChannelMediaRelay(params: {
    channelId: string;
    configuration: ChannelMediaRelayConfiguration;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    const { configuration } = params;
    return this._channels
      .get(channelId)
      ?.updateChannelMediaRelay({ configuration });
  }

  private async stopChannelMediaRelay(params: {
    channelId: string;
  }): Promise<void> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    return this._channels.get(channelId)!.stopChannelMediaRelay();
  }

  private async getConnectionState(params: {
    channelId: string;
  }): Promise<CONNECTION_STATE_TYPE> {
    const { channelId } = params;
    if (!this._channels.has(channelId)) {
      throw 'please create first';
    }
    return this._channels.get(channelId)!.getConnectionState();
  }
}
