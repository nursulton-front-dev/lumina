/** Минимальный клиент Telegram Bot API: только то, что нужно боту. */

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export class Telegram {
  constructor(
    private readonly token: string,
    private readonly chatId: string,
  ) {}

  private async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { ok: boolean; result?: T; description?: string };
    if (!payload.ok) throw new Error(`${method}: ${payload.description ?? response.status}`);
    return payload.result as T;
  }

  async send(text: string, buttons: InlineButton[][] = []): Promise<number> {
    const result = await this.call<{ message_id: number }>('sendMessage', {
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
    });
    return result.message_id;
  }

  async edit(messageId: number, text: string, buttons: InlineButton[][] = []): Promise<void> {
    await this.call('editMessageText', {
      chat_id: this.chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
    });
  }

  async pin(messageId: number): Promise<void> {
    await this.call('pinChatMessage', {
      chat_id: this.chatId,
      message_id: messageId,
      disable_notification: true,
    });
  }

  async unpin(messageId: number): Promise<void> {
    await this.call('unpinChatMessage', { chat_id: this.chatId, message_id: messageId }).catch(
      () => undefined,
    );
  }

  async answerCallback(callbackId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackId, text }).catch(
      () => undefined,
    );
  }
}
