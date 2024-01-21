import { AppOptions } from '@slack/bolt';

export interface SlackModuleOptions extends AppOptions {
  useFactory?: (...args: any) => AppOptions;
}
