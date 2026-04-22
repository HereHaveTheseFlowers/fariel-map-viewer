/// <reference types="vite/client" />

/**
 * Переменные окружения для клиентской сборки (префикс `VITE_` обязателен).
 * Задаются в `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local` в корне проекта.
 *
 * @see https://vite.dev/guide/env-and-mode
 */
interface ImportMetaEnv {
  /** ID bin на jsonbin.io — нужен вместе с `VITE_JSONBIN_MASTER_KEY` для чтения/записи общей карты */
  readonly VITE_JSONBIN_BIN_ID?: string;

  /** Master key JSONBin (запись и чтение приватного bin). Попадает в бандл — только для доверенной сборки */
  readonly VITE_JSONBIN_MASTER_KEY?: string;

  /**
   * URL JSON с глобальными локациями (только GET), если не используете JSONBin.
   * По умолчанию: `{BASE_URL}global-locations.json`
   */
  readonly VITE_GLOBAL_HEX_JSON_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
